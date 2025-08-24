export type Json = Record<string, unknown>;

export interface IncomingNewMessage {
  type: "new_message";
  message: {
    id: number;
    conversation_id: number;
    sender_id: number;
    content: string | null;
    created_at: string;
    edited_at?: string | null;
    attachments?: {
      id: number;
      filename?: string;
      name?: string;
    }[];
  };
}

export interface IncomingConversationUpdated {
  type: "conversation_updated";
  conversation_id: number;
  unread_count?: number;
}

export interface IncomingMessageDeleted {
  type: "message_deleted";
  conversation_id: number;
  message_id: number;
}

export type IncomingEvent =
  | IncomingNewMessage
  | IncomingConversationUpdated
  | IncomingMessageDeleted;

export type Listener = (evt: { data: unknown }) => void;

export function isIncomingEvent(v: unknown): v is IncomingEvent {
  if (!v || typeof v !== "object") return false;
  const t = (v as { type?: unknown }).type;
  return (
    t === "new_message" ||
    t === "conversation_updated" ||
    t === "message_deleted"
  );
}