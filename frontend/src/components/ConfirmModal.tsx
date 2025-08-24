import { useEffect, useRef } from "react";

interface Action {
  label: string;
  onClick: () => void;
  variant?: "primary" | "danger" | "secondary";
  autoClose?: boolean;
}

interface ConfirmModalProps {
  open: boolean;
  title?: string;
  message?: string;
  actions: Action[];
  onClose: () => void;
}

export function ConfirmModal({ open, title, message, actions, onClose }: ConfirmModalProps) {
  const firstBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    // фокус
    setTimeout(() => firstBtnRef.current?.focus(), 10);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
      prev?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  function cls(v?: string) {
    switch (v) {
      case "danger":
        return "bg-red-600 hover:bg-red-700 text-white";
      case "secondary":
        return "bg-gray-200 hover:bg-gray-300 text-gray-800";
      default:
        return "bg-blue-600 hover:bg-blue-700 text-white";
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded shadow-lg w-full max-w-sm p-6">
        {title && <div className="font-semibold mb-3">{title}</div>}
        {message && <div className="text-sm text-gray-600 mb-4 whitespace-pre-line">{message}</div>}
        <div className="flex flex-col gap-2">
          {actions.map((a, i) => (
            <button
              key={i}
              ref={i === 0 ? firstBtnRef : null}
              className={`rounded px-4 py-2 text-sm font-medium transition ${cls(a.variant)}`}
              onClick={() => {
                a.onClick();
                if (a.autoClose !== false) onClose();
              }}
              type="button"
            >
              {a.label}
            </button>
          ))}
          <button
            className="mt-1 rounded px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200"
            onClick={onClose}
            type="button"
          >
            Скасувати
          </button>
        </div>
      </div>
    </div>
  );
}