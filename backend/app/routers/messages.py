from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Response
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, UTC

from app.core.config import settings
from app.core.auth import get_current_user
from app.core.dependencies import get_db
from app.models.user import User
from app.models.conversation import Conversation, ConversationParticipant, Message
from app.models.attachment import Attachment, AttachmentStatus
from app.models.message_status import MessageStatus
from app.schemas.conversation import MessageBase
from app.schemas.messages import MessagePage, EditMessageRequest
from app.services.attachment_service import save_attachments, mark_attachment_deleted_for_me, delete_attachment_for_all
from app.services.message_service import fetch_messages_page

import json
from app.ws_manager import get_active_connections

router = APIRouter(prefix="/messages", tags=["messages"])

def ensure_participation_or_404(db: Session, conversation_id: int, user_id: int) -> Conversation:
    conv = db.get(Conversation, conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Розмова не знайдена")
    is_participant = db.query(ConversationParticipant).filter_by(
        conversation_id=conversation_id, user_id=user_id
    ).first()
    if not is_participant:
        raise HTTPException(status_code=403, detail="Ви не є учасником цієї розмови")
    return conv

@router.post("/send", response_model=MessageBase)
async def send_message(
    conversation_id: int = Form(...),
    content: str = Form(""),
    files: Optional[List[UploadFile]] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conv = ensure_participation_or_404(db, conversation_id, current_user.id)

    file_list: List[UploadFile] = files or []

    if len(file_list) > settings.MAX_FILES_PER_MESSAGE:
        raise HTTPException(status_code=400, detail=f"Максимальна кількість файлів на повідомлення: {settings.MAX_FILES_PER_MESSAGE}")
    
    if not (content.strip() or len(file_list) > 0):
        raise HTTPException(status_code=400, detail="Повідомлення не може бути порожнім")

    msg = Message(conversation_id=conv.id, sender_id=current_user.id, content=content.strip() if content else "")
    db.add(msg)
    db.commit()
    db.refresh(msg)

    if file_list:
        save_attachments(db, msg, current_user.id, file_list)

    msg = (
        db.query(Message)
        .options(joinedload(Message.attachments))
        .filter(Message.id == msg.id)
        .first()
    )

    active_connections = get_active_connections()
    participants = db.query(ConversationParticipant).filter_by(conversation_id=conv.id).all()
    user_ids = [p.user_id for p in participants]
    from app.schemas.conversation import MessageBase
    msg_out = MessageBase.from_orm(msg)
    for user_id in user_ids:
        ws = active_connections.get(user_id)
        if ws:
            try:
                await ws.send_text(json.dumps({
                    "type": "new_message",
                    "message": msg_out.model_dump(mode="json")
                }, default=str))
            except Exception:
                pass

    return msg

@router.get("/attachments/{attachment_id}")
def download_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    att = db.get(Attachment, attachment_id)
    if not att or att.is_deleted_for_all:
        raise HTTPException(status_code=404, detail="Файл не знайдено")
    
    conv = db.get(Conversation, att.message.conversation_id)
    is_participant = db.query(ConversationParticipant).filter_by(
        conversation_id=conv.id, user_id=current_user.id
    ).first()
    if not is_participant:
        raise HTTPException(status_code=403, detail="Ви не є учасником цієї розмови")
    
    st = db.query(AttachmentStatus).filter_by(
        attachment_id=att.id, user_id=current_user.id
    ).first()
    if st and st.is_deleted:
        raise HTTPException(status_code=404, detail="Файл не знайдено")
    
    from fastapi.responses import FileResponse
    return FileResponse(
        att.stored_path,
        media_type=att.mimetype or "application/octet-stream",
        filename=att.filename,
    )

@router.delete("/attachments/{attachment_id}")
def delete_attachment(
    attachment_id: int,
    scope: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    att = db.get(Attachment, attachment_id)
    if not att:
        raise HTTPException(status_code=404, detail="Файл не знайдено")
    
    conv = db.get(Conversation, att.message.conversation_id)
    is_participant = db.query(ConversationParticipant).filter_by(
        conversation_id=conv.id, user_id=current_user.id
    ).first()
    if not is_participant:
        raise HTTPException(status_code=403, detail="Ви не є учасником цієї розмови")
    
    if scope not in {"me", "all"}:
        raise HTTPException(status_code=400, detail="Невірний параметр scope")
    
    if scope == "me":
        mark_attachment_deleted_for_me(db, att.id, current_user.id)
        return {"detail": "Файл позначено як видалений для вас"}
    else:
        if att.uploader_id != current_user.id:
            raise HTTPException(status_code=403, detail="Тільки завантажувач може видалити файл для всіх")
        delete_attachment_for_all(db, att)
        return {"detail": "Файл видалено для всіх учасників"}
    
@router.get("/page", response_model=MessagePage)
def get_messages_page(
    conversation_id: int,
    before_id: int | None = None,
    limit: int = 30,
    search: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items, has_more, next_before = fetch_messages_page(db, conversation_id, current_user.id, before_id, limit, search)
    return {"items": items, "has_more": has_more, "next_before_id": next_before}

@router.patch("/{message_id}")
async def edit_message(
    message_id: int,
    req: EditMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    msg = db.get(Message, message_id)
    if not msg or msg.is_deleted_for_all:
        raise HTTPException(status_code=404, detail="Повідомлення не знайдено")
    
    if msg.sender_id != current_user.id:
        raise HTTPException(status_code=403, detail="Ви не можете редагувати це повідомлення")
    msg.content = req.content
    msg.edited_at = datetime.now(UTC)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return {"message": "updated"}

@router.delete("/{message_id}")
async def delete_message(
    message_id: int,
    scope: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    msg = db.get(Message, message_id)
    if not msg:
        raise HTTPException(status_code=404, detail="Повідомлення не знайдено")
    
    if scope not in {"me", "all"}:
        raise HTTPException(status_code=400, detail="Невірний параметр scope")
    
    if scope == "me":
        st = db.query(MessageStatus).filter_by(message_id=message_id, user_id=current_user.id).first()
        if not st:
            st = MessageStatus(message_id=message_id, user_id=current_user.id, is_deleted=True)
            db.add(st)
        else:
            st.is_deleted = True

        for att in msg.attachments:
            asx = db.query(AttachmentStatus).filter_by(attachment_id=att.id, user_id=current_user.id).first()
            if not asx:
                db.add(AttachmentStatus(attachment_id=att.id, user_id=current_user.id, is_deleted=True))
            else:
                asx.is_deleted = True
        db.commit()
        return {"message": "Видалено для мене"}
    
    else:
        if msg.sender_id != current_user.id:
            raise HTTPException(status_code=403, detail="Тільки автор повідомлення може видалити його для всіх")
        msg.is_deleted_for_all = True
        db.add(msg)
        for att in msg.attachments:
            att.is_deleted_for_all = True
            db.add(att)

        db.commit()
        return {"message": "Видалено для всіх"}
    