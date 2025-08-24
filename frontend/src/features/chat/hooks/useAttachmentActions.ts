import { apiFetch } from "../../../utils/api";
import type { ChatMessage, MessageAttachment } from "./useMessages";

export function useAttachmentActions(
  messages: ChatMessage[],
  updateMessage: (m: ChatMessage) => void
) {
  function toNum(v: number | string): number {
    return typeof v === "number" ? v : Number.parseInt(v, 10);
  }

  async function callDelete(att: MessageAttachment, scope: "me" | "all") {
    const res = await apiFetch(`/messages/attachments/${att.id}?scope=${scope}`, { method: "DELETE" });
    return res.ok;
  }

  function prune(msgId: number, attId: number) {
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;
    updateMessage({
      ...msg,
      attachments: (msg.attachments || []).filter(a => toNum(a.id as number | string) !== attId)
    });
  }

  async function deleteAttachmentMine(att: MessageAttachment, msgId: number | string) {
    const mid = toNum(msgId);
    const aid = toNum(att.id as number | string);
    if (mid >= 0 && aid >= 0 && await callDelete(att, "me")) prune(mid, aid);
  }

  async function deleteAttachmentAll(att: MessageAttachment, msgId: number | string) {
    const mid = toNum(msgId);
    const aid = toNum(att.id as number | string);
    if (mid >= 0 && aid >= 0 && await callDelete(att, "all")) prune(mid, aid);
  }

  async function downloadAttachment(att: MessageAttachment) {
    const res = await apiFetch(`/messages/attachments/${att.id}`);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const filename =
      (("filename" in att) && typeof (att as { filename?: unknown }).filename === "string" && (att as { filename: string }).filename) ||
      (("name" in att) && typeof (att as { name?: unknown }).name === "string" && (att as { name: string }).name) ||
      `file-${att.id}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return { deleteAttachmentMine, deleteAttachmentAll, downloadAttachment };
}