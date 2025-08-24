from sqlalchemy import Column, Integer, ForeignKey, Boolean, DateTime, Text, Index
from sqlalchemy.orm import relationship
from datetime import datetime, UTC
from app.database.database import Base


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.now(UTC))

    participants = relationship(
        "ConversationParticipant", 
        back_populates="conversation",
        cascade="all, delete-orphan",
    )
    messages = relationship(
        "Message", 
        back_populates="conversation",
        cascade="all, delete-orphan",
    )


class ConversationParticipant(Base):
    __tablename__ = "conversation_participants"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_hidden = Column(Boolean, default=False)
    is_cleared = Column(Boolean, default=False)
    last_read_message_id = Column(Integer, nullable=True)
    last_read_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.now(UTC))
    
    conversation = relationship(
        "Conversation", 
        back_populates="participants",
    )
    user = relationship(
        "User", 
        back_populates="conversations",
    )


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False, default="")
    is_deleted_for_all = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    edited_at = Column(DateTime, nullable=True)

    conversation = relationship(
        "Conversation", 
        back_populates="messages"
    )
    sender = relationship(
        "User", 
        back_populates="messages"
    )
    attachments = relationship(
        "Attachment", 
        back_populates="message", 
        cascade="all, delete-orphan",
    )
    statuses = relationship(
        "MessageStatus", 
        back_populates="message",
        cascade="all, delete-orphan",
    )

Index("ix_messages_conversation_id", Message.conversation_id, Message.id)