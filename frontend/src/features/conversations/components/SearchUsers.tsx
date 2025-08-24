import React from "react";
import type { UserSearchItem } from "../hooks/useUserSearch";

interface SearchUsersProps {
  value: string;
  onChange: (v: string) => void;
  loading: boolean;
  error: string | null;
  results: UserSearchItem[];
  onSelectUser: (id: number) => void;
}

export const SearchUsers: React.FC<SearchUsersProps> = ({
  value,
  onChange,
  loading,
  error,
  results,
  onSelectUser
}) => {
  return (
    <div className="p-4 pb-3 border-b bg-gray-50">
      <input
        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-200 text-sm"
        placeholder="Пошук по нікнейму або пошті"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      {loading && <div className="mt-2 text-xs text-gray-400">Завантаження...</div>}
      {results.length > 0 && (
        <div className="mt-2 bg-white border rounded shadow-sm max-h-60 overflow-y-auto">
          {results.map(u => (
            <button
              type="button"
              key={u.id}
              onClick={() => onSelectUser(u.id)}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded"
            >
              <div className="font-medium text-sm">{u.username ?? `User #${u.id}`}</div>
              {u.email && <div className="text-[11px] text-gray-500">{u.email}</div>}
            </button>
          ))}
        </div>
      )}
      {error && <div className="text-red-500 text-xs mt-2">{error}</div>}
    </div>
  );
};