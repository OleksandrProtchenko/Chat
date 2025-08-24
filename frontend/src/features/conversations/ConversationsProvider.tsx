import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../app/providers/useAuth.js";
import { apiFetch } from "../../utils/api.js";
import { useWs } from "../../app/providers/useWs.js";
import { ConversationsContext } from "./ConversationsContext.js";
import type { Conversation, ConversationsCtx } from "./ConversationsContext.js";

interface BackendConversationItem {
  conversation_id: number;
  peer_id: number;
  peer_username: string;
  peer_gender: string;
  last_message_id: number | null;
  last_message_preview: string | null;
  last_message_at: string | null;
  unread_count: number;
}

interface ConversationUpdatedWs {
  type: "conversation_updated";
  conversation_id: number;
  unread_count?: number;
}
interface MessageDeletedWs {
  type: "message_deleted";
  conversation_id: number;
  message_id: number | string;
  deleted_for_all?: boolean;
}
type WsInbound = ConversationUpdatedWs | MessageDeletedWs | Record<string, unknown>;

function isBackendConversation(v: unknown): v is BackendConversationItem {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as { conversation_id?: unknown }).conversation_id === "number" &&
    typeof (v as { peer_id?: unknown }).peer_id === "number"
  );
}

const ConversationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const { addListener } = useWs();

  const mapItem = (b: BackendConversationItem): Conversation => ({
    id: b.conversation_id,
    unread_count: b.unread_count,
    last_message: b.last_message_preview ?? null,
    last_message_at: b.last_message_at ?? null,
    last_message_id: b.last_message_id ?? null,
    user: {
      id: b.peer_id,
      username: b.peer_username,
      gender: b.peer_gender
    }
  });

  const refresh = useCallback(async () => {
    if (!user) {
      setConversations([]);
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch("/conversations");
      if (!res.ok) {
        setConversations([]);
        return;
      }
      const data: unknown = await res.json();
      if (Array.isArray(data)) {
        setConversations(data.filter(isBackendConversation).map(mapItem));
      } else {
        setConversations([]);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateConversation = useCallback(
    (patch: Partial<Conversation> & { id: number }) => {
      setConversations(prev =>
        prev.map(c => (c.id === patch.id ? { ...c, ...patch } : c))
      );
    },
    []
  );

  const setUnreadZero = useCallback((id: number) => {
    setConversations(prev => prev.map(c => (c.id === id ? { ...c, unread_count: 0 } : c)));
  }, []);

  const startConversation = useCallback(
    async (peerId: number) => {
      const pid = Number(peerId);
      if (!Number.isInteger(pid) || pid <= 0) return null;
      try {
        const res = await apiFetch("/conversations/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ peer_id: pid })
        });
        if (!res.ok) return null;
        const body: unknown = await res.json();
        const convId =
          typeof (body as { conversation_id?: unknown }).conversation_id === "number"
            ? (body as { conversation_id: number }).conversation_id
            : null;
        await refresh();
        return convId;
      } catch {
        return null;
      }
    },
    [refresh]
  );

  const hideConversation = useCallback(
    async (id: number) => {
      await apiFetch(`/conversations/${id}/hide`, { method: "POST" });
      await refresh();
    },
    [refresh]
  );

  const clearConversation = useCallback(
    async (id: number) => {
      await apiFetch(`/conversations/${id}/clear?scope=me`, { method: "POST" });
      await refresh();
    },
    [refresh]
  );

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    const off = addListener(evt => {
      const data = evt.data as WsInbound;
      if (!data || typeof data !== "object") return;
      const type = (data as { type?: unknown }).type;
      if (type === "conversation_updated") {
        const ev = data as ConversationUpdatedWs;
        updateConversation({
          id: ev.conversation_id,
          unread_count: typeof ev.unread_count === "number" ? ev.unread_count : 0
        });
      } else if (type === "message_deleted") {
        const ev = data as MessageDeletedWs;
        const mid = Number(ev.message_id);
        setConversations(prev =>
          prev.map(c =>
            c.id === ev.conversation_id && c.last_message_id === mid
              ? {
                  ...c,
                  last_message: null,
                  last_message_id: null,
                  last_message_at: null
                }
              : c
          )
        );
      }
    });
    return off;
  }, [addListener, updateConversation]);

  const value: ConversationsCtx = {
    conversations,
    loading,
    refresh,
    updateConversation,
    setUnreadZero,
    startConversation,
    hideConversation,
    clearConversation
  };

  return (
    <ConversationsContext.Provider value={value}>{children}</ConversationsContext.Provider>
  );
};

export default ConversationsProvider;