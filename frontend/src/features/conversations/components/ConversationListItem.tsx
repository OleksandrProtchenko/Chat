import React from "react";
import type { Conversation } from "../ConversationsContext";

interface ConversationListItemProps {
  conversation: Conversation;
  selected: boolean;
  onSelect: (id: number) => void;
  onDeleteRequest: (id: number) => void;
  onCloseMobile?: () => void;
}

function avatarLetter(name: string) {
  return name?.trim()?.[0]?.toUpperCase() || "?";
}
function lastMessagePreview(conv: Conversation) {
  if (conv.last_message) return conv.last_message;
  if (conv.unread_count > 0) return "Нове повідомлення";
  return "Немає повідомлень";
}

export const ConversationListItem: React.FC<ConversationListItemProps> = ({
  conversation,
  selected,
  onSelect,
  onDeleteRequest,
  onCloseMobile
}) => {
  const unread = conversation.unread_count > 0;
  return (
    <li className="group relative">
      <button
        className={`w-full flex items-center gap-3 rounded-lg px-3 py-3 text-left transition cursor-pointer ${
          selected
            ? "bg-blue-100 border border-blue-400 shadow-sm"
            : "border border-black bg-white hover:border-blue-500 focus:border-blue-500"
        }`}
        onClick={() => {
          onSelect(conversation.id);
          onCloseMobile?.();
        }}
        type="button"
      >
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${
            selected
              ? "bg-blue-600 text-white"
              : "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
          }`}
        >
          {avatarLetter(conversation.user.username)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-semibold text-sm ${selected ? "text-blue-700" : "text-gray-800"}`}>
              {conversation.user.username}
            </span>
            {unread && (
              <span className="ml-auto inline-block rounded-full bg-blue-600 text-white text-[10px] px-2 py-0.5 font-medium">
                {conversation.unread_count}
              </span>
            )}
          </div>
          <div
            className={`text-xs mt-0.5 truncate ${selected ? "text-blue-600" : "text-gray-500"}`}
            title={lastMessagePreview(conversation)}
          >
            {lastMessagePreview(conversation)}
          </div>
        </div>
        <div className="flex flex-col items-end">
          <button
            className="opacity-0 group-hover:opacity-100 transition text-red-500 hover:text-red-700 text-sm px-1 cursor-pointer"
            title="Видалити співрозмовника"
            onClick={e => {
              e.stopPropagation();
              onDeleteRequest(conversation.id);
            }}
            type="button"
          >
            🗑
          </button>
        </div>
      </button>
      <div className="mx-3 h-px bg-gray-100 last:hidden" />
    </li>
  );
};