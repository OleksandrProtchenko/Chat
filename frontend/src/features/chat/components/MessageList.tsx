import React from "react";
import type { ChatMessage, MessageAttachment } from "../hooks/useMessages";
import { MessageItem } from "./MessageItem";
import type { RefObject } from "react";

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId: number;
  peerUsername: string;
  containerRef: RefObject<HTMLDivElement>;
  bottomRef: RefObject<HTMLDivElement>;
  showScrollToBottom: boolean;
  onScrollToBottom: () => void;
  initialLoading: boolean;
  loadingMore: boolean;
  onEdit: (m: ChatMessage) => void;
  onDelete: (m: ChatMessage) => void;
  onDeleteAttachment: (att: MessageAttachment, msgId: number) => void;
  onDownloadAttachment: (att: MessageAttachment) => void;
  editingId: number | null;
  editingText: string;
  onEditingTextChange: (v: string) => void;
  onSaveEdit: (m: ChatMessage) => void;
  onCancelEdit: () => void;
  formatDate: (s: string | null | undefined) => string;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  containerRef,
  bottomRef,
  showScrollToBottom,
  onScrollToBottom,
  initialLoading,
  loadingMore,
  ...rest
}) => {
  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
      {initialLoading && <div className="text-xs text-gray-400">Завантаження...</div>}
      {messages.map(m => (
        <MessageItem key={m.id} message={m} {...rest} />
      ))}
      {loadingMore && <div className="text-xs text-gray-400">Завантаження...</div>}
      <div ref={bottomRef} />
      {showScrollToBottom && (
        <button
          className="fixed bottom-4 right-4 bg-blue-600 text-white rounded-full px-3 py-1 text-xs shadow"
          onClick={onScrollToBottom}
        >
          Вниз
        </button>
      )}
    </div>
  );
};