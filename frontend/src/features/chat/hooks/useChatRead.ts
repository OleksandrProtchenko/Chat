import { useCallback, useRef } from "react";
import { apiFetch } from "../../../utils/api";
import { useConversations } from "../../conversations/useConversations";

export function useChatRead(conversationId: number) {
  const { setUnreadZero } = useConversations();
  const inFlightRef = useRef(false);
  const lastSentIdRef = useRef<number | null>(null);
  const lastSentAtRef = useRef(0);
  const MIN_INTERVAL_MS = 800;

  const markRead = useCallback(
    async (lastMessageId?: number) => {
      if (!conversationId) return;
      const now = Date.now();

      const newer =
        typeof lastMessageId === "number" &&
        (lastSentIdRef.current === null || lastMessageId > lastSentIdRef.current);

      const sameId =
        typeof lastMessageId === "number" &&
        lastSentIdRef.current !== null &&
        lastMessageId === lastSentIdRef.current;

      if (
        !newer &&
        (sameId || typeof lastMessageId !== "number") &&
        now - lastSentAtRef.current < MIN_INTERVAL_MS
      ) {
        return;
      }

      if (inFlightRef.current) return;
      inFlightRef.current = true;
      try {
        const body =
          typeof lastMessageId === "number"
            ? JSON.stringify({ up_to_message_id: lastMessageId })
            : JSON.stringify({});
        const res = await apiFetch(`/conversations/${conversationId}/read`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body
        });
        if (res.ok) {
          if (typeof lastMessageId === "number") {
            lastSentIdRef.current = lastMessageId;
          }
          lastSentAtRef.current = now;
          setUnreadZero(conversationId);
        }
      } finally {
        inFlightRef.current = false;
      }
    },
    [conversationId, setUnreadZero]
  );

  return { markRead };
}