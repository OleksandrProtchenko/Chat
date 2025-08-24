import React from "react";
import type { Conversation } from "../ConversationsContext";
import { ConversationListItem } from "./ConversationListItem";

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId: number | null;
  onSelect: (id: number) => void;
  onDeleteRequest: (id: number) => void;
  onCloseMobile?: () => void;
  hideEmpty?: boolean;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversationId,
  onSelect,
  onDeleteRequest,
  onCloseMobile,
  hideEmpty = true
}) => {
  const visible = hideEmpty
    ? conversations.filter(
        c => !(c.last_message_id === null && c.last_message === null && c.unread_count === 0)
      )
    : conversations;

  if (visible.length === 0) {
    return <div className="text-gray-400 text-sm px-2">Немає співрозмовників</div>;
  }
  return (
    <ul className="space-y-2">
      {visible.map(c => (
        <ConversationListItem
          key={c.id}
            conversation={c}
          selected={c.id === selectedConversationId}
          onSelect={onSelect}
          onDeleteRequest={onDeleteRequest}
          onCloseMobile={onCloseMobile}
        />
      ))}
    </ul>
  );
};