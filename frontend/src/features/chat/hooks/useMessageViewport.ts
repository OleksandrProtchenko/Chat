import { useRef, useState, useEffect, useCallback } from "react";
import type { ChatMessage } from "./useMessages";

interface ViewportOptions {
  loadMore: () => void;
  hasMore: boolean;
  loadingMore: boolean;
  initialLoading: boolean;
  onReachBottom: () => void;
  onNeedReadCheck: () => void;
  messages: ChatMessage[];
}

export interface ViewportApi {
  containerRef: React.RefObject<HTMLDivElement>;
  bottomRef: React.RefObject<HTMLDivElement>;
  showScrollToBottom: boolean;
  scrollToBottom: (smooth?: boolean) => void;
}

export function useMessageViewport(opts: ViewportOptions): ViewportApi {
  const {
    loadMore,
    hasMore,
    loadingMore,
    initialLoading,
    onReachBottom,
    onNeedReadCheck,
    messages
  } = opts;

  const containerRef = useRef<HTMLDivElement>(null!);
  const bottomRef = useRef<HTMLDivElement>(null!);
  const atBottomRef = useRef(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const prevScrollDataRef = useRef<{ height: number; top: number } | null>(null);
  const prevMsgCountRef = useRef(messages.length);

  const updateAtBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const threshold = 40;
    atBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  }, []);

  const scrollToBottom = useCallback((smooth?: boolean) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    requestAnimationFrame(() => {
      updateAtBottom();
      onNeedReadCheck();
    });
  }, [updateAtBottom, onNeedReadCheck]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    function handleScroll() {
      if (el.scrollTop < 100 && hasMore && !loadingMore && !initialLoading) {
        prevScrollDataRef.current = {
          height: el.scrollHeight,
          top: el.scrollTop
        };
        loadMore();
      }
      if (el.scrollTop < el.scrollHeight - el.clientHeight - 200) {
        setShowScrollToBottom(true);
      } else {
        setShowScrollToBottom(false);
      }
      updateAtBottom();
      if (atBottomRef.current) onNeedReadCheck();
    }
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [
    hasMore,
    loadingMore,
    initialLoading,
    loadMore,
    updateAtBottom,
    onNeedReadCheck
  ]);

  const restoreAfterPrepend = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!prevScrollDataRef.current) return;
    const prev = prevScrollDataRef.current;
    const delta = el.scrollHeight - prev.height;
    el.scrollTop = prev.top + delta;
    prevScrollDataRef.current = null;
  };

  useEffect(() => {
    if (messages.length > prevMsgCountRef.current) {
      restoreAfterPrepend();
    }
    prevMsgCountRef.current = messages.length;
  }, [messages]);

  useEffect(() => {
    if (atBottomRef.current) {
      scrollToBottom(false);
      onReachBottom();
    }
  }, [messages, scrollToBottom, onReachBottom]);

  return {
    containerRef,
    bottomRef,
    showScrollToBottom,
    scrollToBottom
  };
}