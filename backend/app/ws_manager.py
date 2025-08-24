import json
import asyncio
from typing import Dict, List, Optional
from fastapi import WebSocket

active_connections: Dict[int, WebSocket] = {}

def get_active_connections():
    return active_connections

async def send_message_to_user(user_id: int, message: dict):
    ws = active_connections.get(user_id)
    if not ws:
        return False
    try:
        await ws.send_text(json.dumps(message, default=str))
        return True
    except Exception:
        active_connections.pop(user_id, None)
        return False

async def broadcast_to_conversation_participants(participant_ids: List[int], message: dict):
    for uid in list(participant_ids):
        await send_message_to_user(uid, message)

async def broadcast_message_deleted(conversation_id: int, participant_ids: List[int], message_id: int):
    await broadcast_to_conversation_participants(
        participant_ids,
        {
            "type": "message_deleted",
            "conversation_id": conversation_id,
            "message_id": message_id
        },
    )

async def broadcast_message_edited(conversation_id: int, participant_ids: List[int], message: dict):
    await broadcast_to_conversation_participants(
        participant_ids,
        {
            "type": "message_edited",
            "conversation_id": conversation_id,
            "message": message
        },
    )

from sqlalchemy import event, select, inspect as sa_inspect
from sqlalchemy.orm import object_session

Message: Optional[type] = None
ConversationParticipant: Optional[type] = None
try:
    from app.models.conversation import Message as _Msg, ConversationParticipant as _CP
    Message = _Msg
    ConversationParticipant = _CP
except Exception:
    pass

def _schedule(coro):
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(coro)
    except RuntimeError:
        pass

def _get_participant_ids(sess, conversation_id: int) -> list[int]:
    if not ConversationParticipant:
        return []
    try:
        rows = sess.execute(
            select(ConversationParticipant.user_id)
            .where(ConversationParticipant.conversation_id == conversation_id)
        ).all()
        return [r[0] for r in rows]
    except Exception:
        return []

if Message:
    @event.listens_for(Message, "after_update", propagate=True)
    def _ws_after_update(mapper, connection, target):
        sess = object_session(target)
        if not sess:
            return
        insp = sa_inspect(target)

        def _changed(attr):
            return attr in insp.attrs and insp.attrs[attr].history.has_changes()

        content_changed = _changed("content")
        edited_changed = _changed("edited_at")
        deleted_now = hasattr(target, "is_deleted_for_all") and getattr(target, "is_deleted_for_all") is True and _changed("is_deleted_for_all")

        if not (content_changed or edited_changed or deleted_now):
            return

        participant_ids = _get_participant_ids(sess, target.conversation_id)
        if not participant_ids:
            return

        if deleted_now:
            _schedule(
                broadcast_message_deleted(
                    target.conversation_id,
                    participant_ids,
                    target.id
                )
            )
        else:
            attachments = []
            try:
                atts = getattr(target, "attachments", []) or []
                for a in atts:
                    attachments.append({"id": getattr(a, "id", None), "filename": getattr(a, "filename", None)})
            except Exception:
                pass
            payload = {
                "id": target.id,
                "conversation_id": target.conversation_id,
                "sender_id": getattr(target, "sender_id", None),
                "content": getattr(target, "content", None),
                "created_at": getattr(target, "created_at", None),
                "edited_at": getattr(target, "edited_at", None),
                "attachments": attachments
            }
            _schedule(
                broadcast_message_edited(
                    target.conversation_id,
                    participant_ids,
                    payload
                )
            )
else:
    print("[ws_manager] Message model not imported; WS edit/delete broadcasts disabled")