from pydantic import BaseModel
from typing import List, Optional
from app.schemas.conversation import MessageBase


class MessagePage(BaseModel):
    items: List[MessageBase]
    has_more: bool
    next_before_id: Optional[int] = None
    

class EditMessageRequest(BaseModel):
    content: str