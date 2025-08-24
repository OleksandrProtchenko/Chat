from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from app.database.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    gender = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)

    conversations = relationship(
        "ConversationParticipant", 
        back_populates="user",
        cascade="all, delete-orphan",
    )
    messages = relationship(
        "Message",
        back_populates="sender",
        cascade="all, delete-orphan",
    )
    attachments = relationship(
        "Attachment",
        back_populates="uploader",
        cascade="all, delete-orphan",
    )
    message_statuses = relationship(
        "MessageStatus",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    attachment_statuses = relationship(
        "AttachmentStatus",
        back_populates="user",
        cascade="all, delete-orphan",
    )