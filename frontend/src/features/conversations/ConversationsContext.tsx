import { createContext, useContext } from "react";

export interface Conversation {
  id: number;
  unread_count: number;
  last_message: string | null;
  last_message_at: string | null;
  last_message_id?: number | null;
  user: { id: number; username: string; gender?: string };
}

export interface ConversationsCtx {
  conversations: Conversation[];
  loading: boolean;
  refresh: () => void;
  updateConversation: (c: Partial<Conversation> & { id: number }) => void;
  setUnreadZero: (id: number) => void;
  startConversation: (peerId: number) => Promise<number | null>;
  hideConversation: (id: number) => Promise<void>;
  clearConversation: (id: number) => Promise<void>;
}

export const ConversationsContext = createContext<ConversationsCtx | null>(null);

export function useConversations(): ConversationsCtx {
  const ctx = useContext(ConversationsContext);
  if (!ctx) throw new Error("useConversations must be used inside ConversationsProvider");
  return ctx;
}