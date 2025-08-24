import React from "react";
import type { ChatMessage, MessageAttachment } from "../hooks/useMessages";

interface MessageItemProps {
  message: ChatMessage;
  currentUserId: number;
  peerUsername: string;
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

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  currentUserId,
  onEdit,
  onDelete,
  onDeleteAttachment,
  onDownloadAttachment,
  editingId,
  editingText,
  onEditingTextChange,
  onSaveEdit,
  onCancelEdit,
  formatDate
}) => {
  const mine = message.sender_id === currentUserId;
  const editing = editingId === message.id;

  return (
    <div
      className={`flex flex-col max-w-[70%] ${
        mine ? "ml-auto items-end" : "items-start"
      }`}
    >
      <div
        className={`px-3 py-2 rounded text-sm whitespace-pre-wrap break-words ${
          mine ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"
        }`}
      >
        {editing ? (
          <textarea
            className="w-56 text-black text-xs p-1 rounded border"
            value={editingText}
            onChange={e => onEditingTextChange(e.target.value)}
          />
        ) : (
          message.content || " "
        )}
      </div>
      {message.attachments?.length ? (
        <div className="flex flex-col gap-1 mt-1 w-full">
          {message.attachments.map(att => (
            <div
              key={att.id}
              className="flex items-center gap-2 text-xs bg-gray-50 border rounded px-2 py-1"
            >
              <span className="truncate max-w-[150px]">
                {att.filename || att.name || `file-${att.id}`}
              </span>
              <button
                type="button"
                className="text-blue-600 hover:underline"
                onClick={() => onDownloadAttachment(att)}
              >
                Завантажити
              </button>
              <button
                type="button"
                className="text-red-500 hover:underline"
                onClick={() => onDeleteAttachment(att, message.id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : null}
      <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
        <span>{formatDate(message.created_at)}</span>
        {mine && !editing && (
          <button
            type="button"
            className="hover:underline"
            onClick={() => onEdit(message)}
          >
            Редагувати
          </button>
        )}
        {!editing && (
            <button
              type="button"
              className="hover:underline text-red-500"
              onClick={() => onDelete(message)}
            >
              Видалити
            </button>
        )}
        {editing && (
          <>
            <button
              type="button"
              className="hover:underline text-green-600"
              onClick={() => onSaveEdit(message)}
            >
              Зберегти
            </button>
            <button
              type="button"
              className="hover:underline"
              onClick={onCancelEdit}
            >
              Скасувати
            </button>
          </>
        )}
      </div>
    </div>
  );
};