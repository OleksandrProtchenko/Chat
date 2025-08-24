import type { ChatMessage } from "./useMessages";
import { apiFetch } from "../../../utils/api";

export function useMessageDeletion(removeMessage: (msg: ChatMessage) => void) {
  async function del(msg: ChatMessage, scope: "me" | "all") {
    const res = await apiFetch(`/messages/${msg.id}?scope=${scope}`, {
      method: "DELETE"
    });
    if (res.ok) {
      removeMessage(msg);
    }
  }
  return {
    deleteMine: (m: ChatMessage) => del(m, "me"),
    deleteAll: (m: ChatMessage) => del(m, "all")
  };
}