import { useEffect, useMemo } from "react";
import { ChatHeader } from "../features/chat/components/ChatHeader";
import { MessageList } from "../features/chat/components/MessageList";
import { MessageComposer } from "../features/chat/components/MessageComposer";
import { formatDate } from "../utils/formatDate";
import { useChatController } from "../features/chat/hooks/useChatController";
import { DeleteMessageModal } from "../features/chat/components/DeleteMessageModal";
import { DeleteAttachmentModal } from "../features/chat/components/DeleteAttachmentModal";

interface UserMe {
  id: number;
  username: string;
  email?: string;
  gender?: string;
}
interface UserShort {
  id: number;
  username: string;
  email?: string;
  gender?: string;
}

interface ChatWindowProps {
  conversationId: number;
  currentUser: UserMe;
  peerUser: UserShort;
}

export default function ChatWindow({ conversationId, currentUser, peerUser }: ChatWindowProps) {
  const c = useChatController({
    conversationId,
    currentUserId: currentUser.id
  });

  useEffect(() => {
    if (!c.showScrollToBottom) {
      c.markRead(c.lastMessageIdRef.current);
    }
  }, [c.showScrollToBottom, c]);

  const deleteMsg = c.deleteMsg;
  const deleteAttInfo = c.deleteAtt;

  const deleteAttachmentIsMine = useMemo(() => {
    if (!deleteAttInfo) return false;
    const msg = c.messages.find(m => m.id === deleteAttInfo.msgId);
    return !!msg && msg.sender_id === currentUser.id;
  }, [deleteAttInfo, c.messages, currentUser.id]);

  return (
    <div className="flex flex-col h-full w-full min-h-0">
      <ChatHeader peerUsername={peerUser.username} />

      <MessageList
        messages={c.messages}
        currentUserId={currentUser.id}
        peerUsername={peerUser.username}
        containerRef={c.containerRef}
        bottomRef={c.bottomRef}
        showScrollToBottom={c.showScrollToBottom}
        onScrollToBottom={() => {
          c.scrollToBottom(true);
            c.markRead(c.lastMessageIdRef.current);
        }}
        initialLoading={c.initialLoading}
        loadingMore={c.loadingMore}
        onEdit={c.startEdit}
        onDelete={m => c.setDeleteMsg(m)}
        onDeleteAttachment={(att, id) => c.setDeleteAtt({ att, msgId: id })}
        onDownloadAttachment={c.downloadAttachment}
        editingId={c.editingId}
        editingText={c.editingText}
        onEditingTextChange={c.setEditingText}
        onSaveEdit={c.saveEdit}
        onCancelEdit={c.cancelEdit}
        formatDate={formatDate}
      />

      <MessageComposer
        value={c.messageText}
        onChange={c.setMessageText}
        onSend={e => {
          void c.sendMessage(e as React.FormEvent);
        }}
        pending={c.pending}
        disabled={c.sending}
      />

      <DeleteMessageModal
        open={!!deleteMsg}
        message={deleteMsg}
        currentUserId={currentUser.id}
        onClose={() => c.setDeleteMsg(null)}
        onDeleteMine={m => {
          c.deleteMine(m);
          c.setDeleteMsg(null);
        }}
        onDeleteAll={m => {
          c.deleteAll(m);
          c.setDeleteMsg(null);
        }}
      />

      <DeleteAttachmentModal
        open={!!deleteAttInfo}
        attachmentInfo={deleteAttInfo}
        isMine={deleteAttachmentIsMine}
        onClose={() => c.setDeleteAtt(null)}
        onDeleteMine={() => {
          if (deleteAttInfo) {
            c.deleteAttachmentMine(deleteAttInfo.att, deleteAttInfo.msgId);
            c.setDeleteAtt(null);
          }
        }}
        onDeleteAll={() => {
          if (deleteAttInfo) {
            c.deleteAttachmentAll(deleteAttInfo.att, deleteAttInfo.msgId);
            c.setDeleteAtt(null);
          }
        }}
      />
    </div>
  );
}