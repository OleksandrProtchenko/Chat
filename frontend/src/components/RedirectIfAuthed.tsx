import { Navigate } from "react-router-dom";
import { useAuth } from "../app/providers/useAuth";

interface Props {
  children: React.ReactElement;
}

export function RedirectIfAuthed({ children }: Props) {
  const { loading, isAuthenticated } = useAuth();
  if (loading) return children;
  if (isAuthenticated) return <Navigate to="/app" replace />;
  return children;
}