from sqlalchemy import Column, Integer, ForeignKey, String, Boolean, DateTime, BigInteger
from sqlalchemy.orm import relationship
from datetime import datetime, UTC
from app.database.database import Base


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("messages.id"), nullable=False)
    uploader_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    filename = Column(String, nullable=False)
    stored_path = Column(String, nullable=False)
    mimetype = Column(String, nullable=True)
    size_bytes = Column(BigInteger, nullable=True)

    is_deleted_for_all = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda:datetime.now(UTC))

    message = relationship(
        "Message", 
        back_populates="attachments"
    )
    uploader = relationship(
        "User", 
        back_populates="attachments"
    )
    statuses = relationship(
        "AttachmentStatus", 
        back_populates="attachment",
        cascade="all, delete-orphan",
    )


class AttachmentStatus(Base):
    __tablename__ = "attachment_status"

    id = Column(Integer, primary_key=True, index=True)
    attachment_id = Column(Integer, ForeignKey("attachments.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_deleted = Column(Boolean, default=False)

    attachment = relationship(
        "Attachment", 
        back_populates="statuses",
    )
    user = relationship(
        "User",
        back_populates="attachment_statuses",
    )
