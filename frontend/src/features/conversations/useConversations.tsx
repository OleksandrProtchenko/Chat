import { useContext } from "react";
import { ConversationsContext } from "./ConversationsContext";

export function useConversations() {
  const ctx = useContext(ConversationsContext);
  if (!ctx) throw new Error("useConversations must be used inside ConversationsProvider");
  return ctx;
}