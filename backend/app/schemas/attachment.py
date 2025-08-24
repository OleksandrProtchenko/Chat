from pydantic import BaseModel
from datetime import datetime


class AttachmentOut(BaseModel):
    id: int
    filename: str
    mimetype: str | None = None
    size_bytes: int | None = None
    is_deleted_for_all: bool
    created_at: datetime

    class Config:
        from_attributes = True