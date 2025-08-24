import { useState } from "react";
import type { ChatMessage } from "./useMessages";

export interface UseMessageEditing {
  editingId: number | null;
  editingText: string;
  startEdit: (msg: ChatMessage) => void;
  setEditingText: (v: string) => void;
  cancelEdit: () => void;
  consumeEdit: () => { id: number; content: string } | null;
}

export function useMessageEditing(): UseMessageEditing {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");

  function startEdit(msg: ChatMessage) {
    setEditingId(msg.id);
    setEditingText(msg.content);
  }
  function cancelEdit() {
    setEditingId(null);
    setEditingText("");
  }
  function consumeEdit() {
    if (editingId == null) return null;
    const data = { id: editingId, content: editingText.trim() };
    return data;
  }

  return { editingId, editingText, startEdit, setEditingText, cancelEdit, consumeEdit };
}