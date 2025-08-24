import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "../../../utils/api";

export interface MessageAttachment {
  id: number | string;
  filename?: string;
  name?: string;
  mime_type?: string;
  content_type?: string;
  url?: string;
  size?: number;
}

export interface ChatMessage {
  id: number;
  sender_id: number;
  content: string;
  created_at: string;
  updated_at?: string;
  edited_at?: string | null;
  conversation_id: number;
  attachments?: MessageAttachment[];
}

interface PageResponse {
  items: ChatMessage[];
  has_more: boolean;
  next_before_id: number | null;
}

const PAGE_SIZE = 20;

export function useMessages(conversationId: number | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [initialLoading, setInitialLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextBeforeId, setNextBeforeId] = useState<number | null>(null);

  const convRef = useRef<number | null>(null);
  const tokenRef = useRef<string | null>(null);
  tokenRef.current =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  const loadPage = useCallback(
    async (before?: number) => {
      if (!conversationId) return;
      const first = before === undefined;
      if (first) setInitialLoading(true);
      else setLoadingMore(true);
      try {
        let url = `/messages/page?conversation_id=${conversationId}&limit=${PAGE_SIZE}`;
        if (before) url += `&before_id=${before}`;
        const res = await apiFetch(url, {
          headers: {
            Authorization: `Bearer ${tokenRef.current ?? ""}`,
          },
        });
        if (!res.ok) return;
        const data: PageResponse = await res.json();
        setHasMore(data.has_more);
        setNextBeforeId(data.next_before_id);
        if (before) {
          setMessages(prev => [...data.items, ...prev]);
        } else {
          setMessages(data.items);
        }
      } finally {
        if (first) setInitialLoading(false);
        else setLoadingMore(false);
      }
    },
    [conversationId]
  );

  useEffect(() => {
    if (convRef.current !== conversationId) {
      convRef.current = conversationId;
      setMessages([]);
      setHasMore(true);
      setNextBeforeId(null);
    }
    if (conversationId) {
      loadPage();
    }
  }, [conversationId, loadPage]);

  useEffect(() => {
    if (!conversationId) return;
    const interval = setInterval(async () => {
      try {
        const res = await apiFetch(
          `/messages/page?conversation_id=${conversationId}&limit=30`
        );
        if (!res.ok) return;
        const data: PageResponse = await res.json();
        setMessages(prev => {
          if (prev.length === 0) return prev;
          const fresh = data.items;
          if (!fresh.length) return prev;
          let changed = false;
          const freshIds = new Set(fresh.map(m => m.id));
          const minFreshId = Math.min(...fresh.map(m => m.id));
          const prevMap = new Map(prev.map(m => [m.id, m]));

          for (const incoming of fresh) {
            const existing = prevMap.get(incoming.id);
            if (!existing) {
              prevMap.set(incoming.id, incoming);
              changed = true;
            } else if (
              existing.content !== incoming.content ||
              existing.updated_at !== incoming.updated_at ||
              existing.edited_at !== incoming.edited_at
            ) {
              prevMap.set(incoming.id, { ...existing, ...incoming });
              changed = true;
            }
          }

          for (const m of prev) {
            if (m.id >= minFreshId && !freshIds.has(m.id)) {
              prevMap.delete(m.id);
              changed = true;
            }
          }

          if (!changed) return prev;
          return Array.from(prevMap.values()).sort((a, b) => a.id - b.id);
        });
      } catch {
        /* ignore */
      }
    }, 6000);
    return () => clearInterval(interval);
  }, [conversationId]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && nextBeforeId) {
      loadPage(nextBeforeId);
    }
  }, [loadingMore, hasMore, nextBeforeId, loadPage]);

  const appendMessage = useCallback((msg: ChatMessage) => {
    setMessages(prev => {
      const idx = prev.findIndex(m => m.id === msg.id);
      if (idx === -1) return [...prev, msg];
      const clone = [...prev];
      clone[idx] = { ...clone[idx], ...msg };
      return clone;
    });
  }, []);

  const updateMessage = useCallback((msg: ChatMessage) => {
    setMessages(prev => prev.map(m => (m.id === msg.id ? { ...m, ...msg } : m)));
  }, []);

  const removeMessage = useCallback((id: number) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  }, []);

  return {
    messages,
    initialLoading,
    loadingMore,
    hasMore,
    loadMore,
    appendMessage,
    updateMessage,
    removeMessage,
    reload: () => {
      if (conversationId) loadPage();
    },
  };
}