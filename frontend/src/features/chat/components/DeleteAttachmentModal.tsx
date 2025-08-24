import { ConfirmModal } from "../../../components/ConfirmModal";
import type { MessageAttachment } from "../hooks/useMessages";

interface Props {
  open: boolean;
  attachmentInfo: { att: MessageAttachment; msgId: number } | null;
  isMine: boolean;
  onClose: () => void;
  onDeleteMine: () => void;
  onDeleteAll: () => void;
}

export function DeleteAttachmentModal({
  open,
  attachmentInfo,
  isMine,
  onClose,
  onDeleteMine,
  onDeleteAll
}: Props) {
  return (
    <ConfirmModal
      open={open}
      title="Видалити файл"
      message={
        attachmentInfo
          ? `Файл: ${attachmentInfo.att.filename || attachmentInfo.att.name || "file"}`
          : ""
      }
      actions={[
        {
          label: "Видалити у себе",
          variant: "secondary",
          onClick: onDeleteMine
        },
        ...(isMine
          ? [{
              label: "Видалити у всіх",
              variant: "danger" as const,
              onClick: onDeleteAll
            }]
          : [])
      ]}
      onClose={onClose}
    />
  );
}