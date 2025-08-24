# app/services/attachment_service.py
import os
import uuid
from typing import List
from fastapi import UploadFile
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.attachment import Attachment, AttachmentStatus
from app.models.conversation import Message

def ensure_storage() -> str:
    os.makedirs(settings.STORAGE_DIR, exist_ok=True)
    sub = os.path.join(settings.STORAGE_DIR, "attachments")
    os.makedirs(sub, exist_ok=True)
    return sub

def save_attachments(
    db: Session, message: Message, uploader_id: int, files: List[UploadFile]
) -> List[Attachment]:
    dest_dir = ensure_storage()
    saved: List[Attachment] = []
    for f in files or []:
        if not hasattr(f, "file"):
            continue

        ext = os.path.splitext(f.filename)[1] if f.filename else ""
        stored_name = f"{uuid.uuid4().hex}{ext}"
        stored_path = os.path.join(dest_dir, stored_name)

        try:
            f.file.seek(0)
        except Exception:
            pass

        with open(stored_path, "wb") as out:
            out.write(f.file.read())

        size = os.path.getsize(stored_path)
        att = Attachment(
            message_id=message.id,
            uploader_id=uploader_id,
            filename=f.filename or stored_name,
            stored_path=stored_path,
            mimetype=getattr(f, "content_type", None),
            size_bytes=size,
        )
        db.add(att)
        saved.append(att)

    db.commit()
    for att in saved:
        db.refresh(att)
    return saved

def mark_attachment_deleted_for_me(db: Session, attachment: Attachment, user_id: int):
    st = db.query(AttachmentStatus).filter_by(
        attachment_id=attachment.id, user_id=user_id
    ).first()
    if not st:
        st = AttachmentStatus(
            attachment_id=attachment.id, user_id=user_id, is_deleted=True
        )
        db.add(st)
    else:
        st.is_deleted = True
    db.commit()

def delete_attachment_for_all(db: Session, attachment: Attachment):
    attachment.is_deleted_for_all = True
    db.add(attachment)
    db.commit()

    try:
        if attachment.stored_path and os.path.exists(attachment.stored_path):
            os.remove(attachment.stored_path)
    except Exception:
        pass
