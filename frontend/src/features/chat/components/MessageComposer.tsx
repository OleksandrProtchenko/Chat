import React, { useCallback } from "react";
import type { PendingFilesApi } from "../hooks/useAttachments.js";

type SendEvent =
  | React.FormEvent<HTMLFormElement>
  | React.KeyboardEvent<HTMLTextAreaElement>
  | React.SyntheticEvent
  | KeyboardEvent
  | undefined;

interface MessageComposerProps {
  value: string;
  onChange: (v: string) => void;
  onSend: (e?: SendEvent) => void | Promise<void>;
  pending: PendingFilesApi;
  disabled?: boolean;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  value,
  onChange,
  onSend,
  pending,
  disabled
}) => {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey && !e.altKey && !e.ctrlKey) {
        e.preventDefault();
        if (!disabled && (value.trim() || pending.files.length > 0)) {
          void onSend(e);
        }
      }
    },
    [disabled, value, pending.files.length, onSend]
  );

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        void onSend(e);
      }}
      className="p-3 border-t flex flex-col gap-2"
    >
      <textarea
        className="w-full resize-none border rounded p-2 h-24 text-sm"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Повідомлення... (Enter — відправити, Shift+Enter — новий рядок)"
      />
      {pending.files.length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs">
          {pending.files.map((f: File, i: number) => (
            <div
              key={i}
              className="px-2 py-1 rounded bg-gray-100 border flex items-center gap-2"
            >
              <span className="truncate max-w-[140px]">{f.name}</span>
              <button
                type="button"
                className="text-red-500 hover:text-red-700"
                onClick={() => pending.remove(i)}
                aria-label="Видалити файл"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            className="text-xs text-gray-500 underline"
            onClick={() => pending.clear()}
          >
            Очистити
          </button>
        </div>
      )}
      <div className="flex items-center justify-between gap-2">
        <label className="cursor-pointer text-sm text-blue-600 hover:underline">
          Додати файли
          <input
            type="file"
            multiple
            className="hidden"
            onChange={e => {
              const files = e.target.files;
              if (files && files.length > 0) {
                pending.add(Array.from(files));
              }
              e.target.value = "";
            }}
          />
        </label>
        <button
          type="submit"
          disabled={disabled || (!value.trim() && pending.files.length === 0)}
          className="bg-blue-600 text-white px-4 py-1 rounded disabled:opacity-50 text-sm"
        >
          Відправити
        </button>
      </div>
    </form>
  );
};