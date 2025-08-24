import { ConfirmModal } from "../../../components/ConfirmModal";
import type { ChatMessage } from "../hooks/useMessages";

interface Props {
  open: boolean;
  message: ChatMessage | null;
  currentUserId: number;
  onClose: () => void;
  onDeleteMine: (m: ChatMessage) => void;
  onDeleteAll: (m: ChatMessage) => void;
}

export function DeleteMessageModal({
  open,
  message,
  currentUserId,
  onClose,
  onDeleteMine,
  onDeleteAll
}: Props) {
  return (
    <ConfirmModal
      open={open}
      title="Видалити повідомлення"
      message={message ? `Повідомлення:\n"${message.content || "..."}"` : ""}
      actions={[
        {
          label: "Видалити у себе",
          variant: "secondary",
          onClick: () => {
            if (message) onDeleteMine(message);
          }
        },
        ...(message && message.sender_id === currentUserId
          ? [{
              label: "Видалити у всіх",
              variant: "danger" as const,
              onClick: () => {
                if (message) onDeleteAll(message);
              }
            }]
          : [])
      ]}
      onClose={onClose}
    />
  );
}