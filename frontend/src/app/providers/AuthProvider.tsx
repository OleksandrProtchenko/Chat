import React, { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../../utils/api";
import { AuthContext } from "./AuthContext";
import type { AuthUser } from "./AuthContext";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch("/users/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("unauthorized");
      const data = await res.json();
      setUser(data);
    } catch {
      localStorage.removeItem("access_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function logout() {
    localStorage.removeItem("access_token");
    setUser(null);
    window.location.href = "/login";
  }

  function updateUser(u: AuthUser) {
    setUser(u);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        refresh,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};