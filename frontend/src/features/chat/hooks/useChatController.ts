import { useEffect, useRef, useState, useCallback } from "react";
import { useMessages, type ChatMessage, type MessageAttachment } from "./useMessages";
import { useMessageEditing } from "./useMessageEditing";
import { usePendingFiles } from "./useAttachments.js";
import { useMessageViewport } from "./useMessageViewport";
import { useConversations } from "../../conversations/useConversations";
import { useChatRead } from "./useChatRead";
import { useChatWs } from "./useChatWs";
import { useSendMessage } from "./useSendMessage";
import { useAttachmentActions } from "./useAttachmentActions";
import { useMessageDeletion } from "./useMessageDeletion";
import { apiFetch } from "../../../utils/api";

export interface UseChatControllerParams {
  conversationId: number;
  currentUserId: number;
}

export function useChatController({ conversationId, currentUserId }: UseChatControllerParams) {
  const {
    messages,
    initialLoading,
    loadingMore,
    hasMore,
    loadMore,
    appendMessage,
    updateMessage,
    removeMessage,
    reload
  } = useMessages(conversationId);

  const { refresh, setUnreadZero } = useConversations();

  const {
    editingId,
    editingText,
    startEdit,
    setEditingText,
    cancelEdit,
    consumeEdit
  } = useMessageEditing();

  const pending = usePendingFiles(10);

  const {
    text: messageText,
    setText: setMessageText,
    send: sendMessage,
    sending
  } = useSendMessage({
    conversationId,
    pending,
    afterSuccess: () => {
      reload();
      requestAnimationFrame(() => scrollToBottom(true));
    }
  });

  const {
    deleteAttachmentMine,
    deleteAttachmentAll,
    downloadAttachment
  } = useAttachmentActions(messages, updateMessage);

  const removeMessageByMsg = (m: ChatMessage) => removeMessage(m.id);
  const { deleteMine, deleteAll } = useMessageDeletion(removeMessageByMsg);

  const [deleteMsg, setDeleteMsg] = useState<ChatMessage | null>(null);
  const [deleteAtt, setDeleteAtt] = useState<{ att: MessageAttachment; msgId: number } | null>(null);

  const lastMessageId = messages.length ? messages[messages.length - 1].id : undefined;
  const lastMessageIdRef = useRef<number | undefined>(lastMessageId);
  lastMessageIdRef.current = lastMessageId;

  const { markRead } = useChatRead(conversationId);

  const {
    containerRef,
    bottomRef,
    showScrollToBottom,
    scrollToBottom
  } = useMessageViewport({
    loadMore,
    hasMore,
    loadingMore,
    initialLoading,
    onReachBottom: () => markRead(lastMessageIdRef.current),
    onNeedReadCheck: () => markRead(lastMessageIdRef.current),
    messages
  });

  useChatWs({
    conversationId,
    appendMessage,
    onActiveConversationMessage: msg => {
      if (!showScrollToBottom) {
        markRead(msg.id);
      }
    },
    onOtherConversationUpdated: () => refresh(),
    setActiveUnreadZero: () => setUnreadZero(conversationId),
    onRemoveMessage: (id: number) => removeMessage(id)
  });

  useEffect(() => {
    if (!showScrollToBottom && lastMessageId !== undefined) {
      markRead(lastMessageId);
    }
  }, [showScrollToBottom, lastMessageId, markRead]);

  const convoRef = useRef(conversationId);
  useEffect(() => {
    if (convoRef.current !== conversationId) {
      convoRef.current = conversationId;
      cancelEdit();
      pending.clear();
      setDeleteMsg(null);
      setDeleteAtt(null);
      if (lastMessageIdRef.current !== undefined) {
        markRead(lastMessageIdRef.current);
      }
      refresh();
    }
  }, [conversationId, cancelEdit, pending, markRead, refresh]);

  const saveEdit = useCallback(async (msg: ChatMessage) => {
    const data = consumeEdit();
    if (!data || data.content.trim() === "") return;
    const res = await apiFetch(`/messages/${data.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: data.content })
    });
    if (res.ok) {
      const editedAt = new Date().toISOString();
      updateMessage({ ...msg, content: data.content, edited_at: editedAt, updated_at: editedAt });
      cancelEdit();
    }
  }, [consumeEdit, updateMessage, cancelEdit]);

  return {
    messages,
    initialLoading,
    loadingMore,
    hasMore,
    showScrollToBottom,
    messageText,
    editingId,
    editingText,
    deleteMsg,
    deleteAtt,
    pending,
    sending,
    containerRef,
    bottomRef,
    currentUserId,
    lastMessageIdRef,
    setMessageText,
    sendMessage,
    startEdit,
    setEditingText,
    cancelEdit,
    saveEdit,
    setDeleteMsg,
    setDeleteAtt,
    deleteMine,
    deleteAll,
    deleteAttachmentMine,
    deleteAttachmentAll,
    downloadAttachment,
    scrollToBottom,
    markRead
  };
}