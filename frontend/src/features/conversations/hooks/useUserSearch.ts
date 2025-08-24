import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../../../utils/api";

export interface UserSearchItem {
  id: number;
  username?: string;
  email?: string;
  gender?: string;
}

interface UseUserSearchOptions {
  minLength?: number;
  delayMs?: number;
}

interface UseUserSearchResult {
  query: string;
  setQuery: (v: string) => void;
  results: UserSearchItem[];
  loading: boolean;
  error: string | null;
}

export function useUserSearch(
  { minLength = 2, delayMs = 400 }: UseUserSearchOptions = {}
): UseUserSearchResult {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tRef = useRef<number | null>(null);

  useEffect(() => {
    if (tRef.current !== null) {
      clearTimeout(tRef.current);
      tRef.current = null;
    }
    if (query.trim().length < minLength) {
      setResults([]);
      setError(null);
      return;
    }
    tRef.current = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch(`/conversations/search-users?q=${encodeURIComponent(query.trim())}`);
        if (!res.ok) {
            setError(`Помилка пошуку (${res.status})`);
            setResults([]);
            return;
        }
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      } catch {
        setError("Мережа недоступна");
      } finally {
        setLoading(false);
      }
    }, delayMs);
    return () => {
      if (tRef.current !== null) {
        clearTimeout(tRef.current);
        tRef.current = null;
      }
    };
  }, [query, minLength, delayMs]);

  return { query, setQuery, results, loading, error };
}