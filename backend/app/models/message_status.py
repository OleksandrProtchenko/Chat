from sqlalchemy import Column, Integer, ForeignKey, Boolean, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database.database import Base


class MessageStatus(Base):
    __tablename__ = "message_status"

    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("messages.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_deleted = Column(Boolean, default=False)

    message = relationship(
        "Message", 
        back_populates="statuses",
    )
    user = relationship(
        "User",
        back_populates="message_statuses",
    )

    __table_args__ = (UniqueConstraint("message_id", "user_id", name="uq_message_user"),)