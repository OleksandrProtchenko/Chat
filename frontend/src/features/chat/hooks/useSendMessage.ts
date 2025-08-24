import { useState } from "react";
import { apiFetch } from "../../../utils/api";
import type { PendingFilesApi } from "./useAttachments.js";

interface Options {
  conversationId: number;
  pending: PendingFilesApi;
  afterSuccess: () => void;
}

export function useSendMessage({ conversationId, pending, afterSuccess }: Options) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  async function send(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!text.trim() && pending.files.length === 0) return;
    setSending(true);
    try {
      const form = new FormData();
      form.append("conversation_id", String(conversationId));
      form.append("content", text.trim());
      pending.files.forEach((f: File) => form.append("files", f));
      const res = await apiFetch("/messages/send", { method: "POST", body: form });
      if (res.ok) {
        setText("");
        pending.clear();
        afterSuccess();
      }
    } finally {
      setSending(false);
    }
  }

  return { text, setText, send, sending };
}