import { useAuth } from "@/contexts/AuthContext";
import { Redirect, Route } from "wouter";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Or your loading component
  }

  if (!user) {
    return <Redirect to="/" />;
  }

  return <>{children}</>;
}
