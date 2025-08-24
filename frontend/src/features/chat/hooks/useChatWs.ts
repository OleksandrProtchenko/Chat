import { useEffect } from "react";
import { useWs } from "../../../app/providers/useWs";
import type { ChatMessage } from "./useMessages";
import { useConversations } from "../../conversations/useConversations";

interface WsNewMessageEvent {
  type: "new_message";
  message: ChatMessage;
}
interface WsConversationUpdatedEvent {
  type: "conversation_updated";
  conversation_id: number;
  unread_count?: number;
}
interface WsMessageDeletedEvent {
  type: "message_deleted";
  conversation_id: number | string;
  message_id: number | string;
}
interface WsMessageEditedEvent {
  type: "message_edited";
  conversation_id: number | string;
  message: ChatMessage;
}

type KnownWsEvent =
  | WsNewMessageEvent
  | WsConversationUpdatedEvent
  | WsMessageDeletedEvent
  | WsMessageEditedEvent;

function isKnownWsEvent(data: unknown): data is KnownWsEvent {
  if (!data || typeof data !== "object") return false;
  const t = (data as { type?: unknown }).type;
  return (
    t === "new_message" ||
    t === "conversation_updated" ||
    t === "message_deleted" ||
    t === "message_edited"
  );
}

interface UseChatWsParams {
  conversationId: number;
  appendMessage: (m: ChatMessage) => void;
  onActiveConversationMessage: (m: ChatMessage) => void;
  onOtherConversationUpdated: () => void;
  setActiveUnreadZero: () => void;
  onRemoveMessage: (id: number) => void;
}

export function useChatWs({
  conversationId,
  appendMessage,
  onActiveConversationMessage,
  onOtherConversationUpdated,
  setActiveUnreadZero,
  onRemoveMessage
}: UseChatWsParams) {
  const { addListener } = useWs();
  const { refresh } = useConversations();

  useEffect(() => {
    const off = addListener(evt => {
      const data = evt.data;
      if (!isKnownWsEvent(data)) return;
      switch (data.type) {
        case "new_message": {
          const msg = data.message;
          if (msg.conversation_id === conversationId) {
            appendMessage(msg);
            onActiveConversationMessage(msg);
          } else {
            onOtherConversationUpdated();
          }
          break;
        }
        case "conversation_updated": {
          if (data.conversation_id === conversationId) {
            setActiveUnreadZero();
          } else {
            refresh();
          }
          break;
        }
        case "message_deleted": {
          const cid = Number(data.conversation_id);
          const mid = Number(data.message_id);
          if (cid === conversationId) {
            onRemoveMessage(mid);
          }
          refresh();
          break;
        }
        case "message_edited": {
          const cid = Number(data.conversation_id);
          if (cid === conversationId) {
            appendMessage(data.message);
          } else {
            onOtherConversationUpdated();
          }
          refresh();
          break;
        }
      }
    });
    return off;
  }, [
    addListener,
    conversationId,
    appendMessage,
    onActiveConversationMessage,
    onOtherConversationUpdated,
    setActiveUnreadZero,
    onRemoveMessage,
    refresh
  ]);
}