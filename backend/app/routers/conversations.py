from typing import List, Literal
from fastapi import APIRouter, Depends, Body, Query, HTTPException
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.dependencies import get_db
from app.models.user import User
from app.models.conversation import Conversation, ConversationParticipant, Message
from app.models.message_status import MessageStatus
from app.models.attachment import Attachment, AttachmentStatus
from app.schemas.conversation_list import ConversationListItem
from app.services.conversation_service import list_conversations_with_unread, get_or_create_dialog
from app.services.user_service import search_users

router = APIRouter(prefix="/conversations", tags=["conversations"])

@router.get("", response_model=List[ConversationListItem])
def get_my_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items = list_conversations_with_unread(db, current_user.id)
    return items

@router.post("/{conversation_id}/read")
def mark_read(
    conversation_id: int,
    up_to_message_id: int | None = Body(default=None, embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.services.conversation_service import mark_conversation_read
    mark_conversation_read(db, conversation_id, current_user.id, up_to_message_id)
    return {"status": "ok"}

@router.get("/search-users")
def search_users_endpoint(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    users = search_users(db, q, exclude_user_id=current_user.id)
    return [{"id": u.id, "username": u.username, "email": u.email, "gender": u.gender} for u in users]

@router.post("/start")
def start_dialog(
    peer_id: int = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    peer = db.get(User, peer_id)
    if not peer:
        raise HTTPException(status_code=404, detail="Користувач не знайдений")
    try:
        conv = get_or_create_dialog(db, current_user.id, peer_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"conversation_id": conv.id}

@router.post("/{conversation_id}/clear")
def clear_conversation(
    conversation_id: int,
    scope: Literal["me", "all"],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    part = db.query(ConversationParticipant).filter_by(conversation_id=conversation_id, user_id=current_user.id).first()
    if not part:
        raise HTTPException(status_code=403, detail="Ви не є учасником цієї розмови")
    
    if scope not in {"me", "all"}:
        raise HTTPException(status_code=400, detail="Невірний параметр scope")
    
    msgs = db.query(Message).filter(Message.conversation_id == conversation_id).all()

    if scope == "me":
        for m in msgs:
            st = db.query(MessageStatus).filter_by(message_id=m.id, user_id=current_user.id).first()
            if st is None:
                st = MessageStatus(message_id=m.id, user_id=current_user.id, is_deleted=True)
                db.add(st)
            else:
                st.is_deleted = True
                db.add(st)

            for att in m.attachments:
                asx = db.query(AttachmentStatus).filter_by(attachment_id=att.id, user_id=current_user.id).first()
                if asx is None:
                    asx = AttachmentStatus(attachment_id=att.id, user_id=current_user.id, is_deleted=True)
                    db.add(asx)
                else:
                    asx.is_deleted = True
                    db.add(asx)

        part.is_cleared = True
        db.add(part)
        db.commit()
        return {"message": "Розмову очищено"}
    
    else:
        for m in msgs:
            m.is_deleted_for_all = True
            db.add(m)
            for att in m.attachments:
                att.is_deleted_for_all = True
                db.add(att)
        db.commit()
        return {"message": "Розмову видалено"}
    
@router.post("/{conversation_id}/hide")
def hide_conversation(
    conversation_id: int,
    hide: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    part = db.query(ConversationParticipant).filter_by(conversation_id=conversation_id, user_id=current_user.id).first()
    if not part:
        raise HTTPException(status_code=403, detail="Ви не є учасником цієї розмови")
    part.is_hidden = bool(hide)
    db.add(part)
    db.commit()
    return {"hidden": part.is_hidden}