from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.models.conversation import Message, ConversationParticipant
from app.models.message_status import MessageStatus

DEFAULT_PAGE_SIZE = 30

def _exclude_deleted_for_user(q, user_id: int):
    return q.outerjoin(
        MessageStatus, (MessageStatus.message_id == Message.id) & (MessageStatus.user_id == user_id)
    ).filter(
        (MessageStatus.id.is_(None)) | (MessageStatus.is_deleted == False)
    )

def fetch_messages_page(
    db: Session,
    conversation_id: int,
    user_id: int,
    before_id: int | None,
    limit: int = DEFAULT_PAGE_SIZE,
    search: str | None = None,
):
    part = db.query(ConversationParticipant).filter_by(conversation_id=conversation_id, user_id=user_id).first()
    if not part:
        return [], False, None
    
    q = db.query(Message).filter(
        Message.conversation_id == conversation_id,
        Message.is_deleted_for_all == False
    )
    if before_id:
        q = q.filter(Message.id < before_id)
    if search:
        q = q.filter(Message.content.ilike(f"%{search}%"))

    q = _exclude_deleted_for_user(q, user_id)
    q = q.order_by(Message.id.desc()).limit(limit + 1)
    rows = q.all()

    has_more = len(rows) > limit
    items = list(reversed(rows[:limit])) if has_more else list(reversed(rows))
    next_before = items[0].id if has_more else (items[0].id if items else None)
    return items, has_more, next_before