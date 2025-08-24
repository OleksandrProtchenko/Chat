import { createContext } from "react";

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  gender?: "male" | "female" | string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  refresh: () => Promise<void>;
  logout: () => void;
  updateUser: (u: AuthUser) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);