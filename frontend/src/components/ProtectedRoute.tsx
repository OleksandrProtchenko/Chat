import { Navigate } from "react-router-dom";
import { useAuth } from "../app/providers/useAuth";

interface Props {
  children: React.ReactElement;
}

export default function ProtectedRoute({ children }: Props) {
  const { loading, isAuthenticated } = useAuth();
  if (loading) {
    return <div className="h-screen flex items-center justify-center text-gray-400">Завантаження...</div>;
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}