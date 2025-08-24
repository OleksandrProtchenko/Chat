from pydantic import BaseModel
from datetime import datetime, UTC
from typing import List, Optional
from app.schemas.attachment import AttachmentOut


class MessageBase(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    content: str
    created_at: datetime
    edited_at: Optional[datetime] = None
    attachments: List[AttachmentOut] = []

    class Config:
        from_attributes = True


class ConversationBase(BaseModel):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True