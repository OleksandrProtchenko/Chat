from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone
from app.models.conversation import Conversation, ConversationParticipant, Message
from app.models.user import User
from app.models.message_status import MessageStatus

def list_conversations_with_unread(db: Session, user_id: int) -> list[dict]:
    parts = db.query(ConversationParticipant).filter(
        ConversationParticipant.user_id == user_id,
        ConversationParticipant.is_hidden == False
    ).all()

    items: list[dict] = []

    for part in parts:
        conv_id = part.conversation_id

        peer_part = db.query(ConversationParticipant).filter(
            ConversationParticipant.conversation_id == conv_id,
            ConversationParticipant.user_id != user_id
        ).first()
        if not peer_part:
            continue
        peer = db.get(User, peer_part.user_id)

        last_msg = (
            db.query(Message)
            .filter(
                Message.conversation_id == conv_id,
                Message.is_deleted_for_all == False,
            )
            .outerjoin(
                MessageStatus,
                (MessageStatus.message_id == Message.id)
                & (MessageStatus.user_id == user_id)
            )
            .filter(
                (MessageStatus.id.is_(None)) | (MessageStatus.is_deleted == False)
            )
            .order_by(Message.id.desc())
            .first()
        )

        last_id = int(part.last_read_message_id or 0)

        unread_count = (
            db.query(func.count(Message.id))
            .filter(
                Message.conversation_id == conv_id,
                Message.id > last_id,
                Message.sender_id != user_id,
                Message.is_deleted_for_all == False,
            )
            .outerjoin(
                MessageStatus,
                (MessageStatus.message_id == Message.id)
                & (MessageStatus.user_id == user_id)
            )
            .filter(
                (MessageStatus.id.is_(None)) | (MessageStatus.is_deleted == False)
            )
            .scalar()
        )

        items.append({
            "conversation_id": conv_id,
            "peer_id": peer.id,
            "peer_username": peer.username,
            "peer_gender": peer.gender,
            "last_message_id": last_msg.id if last_msg else None,
            "last_message_preview": (last_msg.content[:200] if last_msg and last_msg.content else None),
            "last_message_at": last_msg.created_at if last_msg else None,
            "unread_count": int(unread_count or 0),
        })

    def to_utc(dt):
        if dt is None:
            return datetime.min.replace(tzinfo=timezone.utc)
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)

    items.sort(key=lambda x: to_utc(x["last_message_at"]), reverse=True)
    return items

def mark_conversation_read(db: Session, conversation_id: int, user_id: int, up_to_message_id: int | None):
    part = db.query(ConversationParticipant).filter_by(
        conversation_id=conversation_id, user_id=user_id
    ).first()
    if not part:
        return
    
    if up_to_message_id is None:
        last = db.query(Message).filter(
            Message.conversation_id == conversation_id,
            Message.is_deleted_for_all == False
        ).order_by(Message.id.desc()).first()
        if not last:
            return
        up_to_message_id = last.id

    if part.last_read_message_id is None or up_to_message_id > part.last_read_message_id:
        part.last_read_message_id = int(up_to_message_id)
        part.last_read_at = datetime.now(timezone.utc)
        db.add(part)
        db.commit()

def get_or_create_dialog(db: Session, user_a_id: int, user_b_id: int) -> Conversation:
    if user_a_id == user_b_id:
        return ValueError("Неможливо створити діалог з самим собою")

    parts = db.query(ConversationParticipant).filter(
        ConversationParticipant.user_id.in_([user_a_id, user_b_id])
    ).all()

    conv_ids_by_user: dict[int, set[int]] = {}
    for p in parts:
        conv_ids_by_user.setdefault(p.user_id, set()).add(p.conversation_id)
        
    inter = conv_ids_by_user.get(user_a_id, set()) & conv_ids_by_user.get(user_b_id, set())
    if inter:
        conv = db.get(Conversation, list(inter)[0])
        for uid in (user_a_id, user_b_id):
            prt = db.query(ConversationParticipant).filter_by(conversation_id=conv.id, user_id=uid).first()
            if prt and prt.is_hidden:
                prt.is_hidden = False
                db.add(prt)
        db.commit()
        return conv
    
    conv = Conversation()
    db.add(conv)
    db.commit()
    db.refresh(conv)

    db.add_all([
        ConversationParticipant(conversation_id=conv.id, user_id=user_a_id),
        ConversationParticipant(conversation_id=conv.id, user_id=user_b_id),
    ])
    db.commit()
    return conv