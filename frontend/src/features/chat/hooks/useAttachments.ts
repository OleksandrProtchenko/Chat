import { useState } from "react";

export interface PendingFilesApi {
  files: File[];
  add: (f: File | File[]) => void;
  remove: (index: number) => void;
  clear: () => void;
  max: number;
}

export function usePendingFiles(max = 10): PendingFilesApi {
  const [files, setFiles] = useState<File[]>([]);
  const add = (f: File | File[]) => {
    setFiles(prev => {
      const list = Array.isArray(f) ? f : [f];
      return [...prev, ...list].slice(0, max);
    });
  };
  const remove = (index: number) =>
    setFiles(prev => prev.filter((_, i) => i !== index));
  const clear = () => setFiles([]);
  return { files, add, remove, clear, max };
}