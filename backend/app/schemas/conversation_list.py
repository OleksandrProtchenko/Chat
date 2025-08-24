from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ConversationListItem(BaseModel):
    conversation_id: int
    peer_id: int
    peer_username: str
    peer_gender: str
    last_message_id: Optional[int] = None
    last_message_preview: Optional[str] = None
    last_message_at: Optional[datetime] = None
    unread_count: int

    class Config:
        from_attributes = True