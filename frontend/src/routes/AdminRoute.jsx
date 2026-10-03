import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/authContext.js";
import { FullPageSpinner } from "./ProtectedRoute.jsx";

export default function AdminRoute() {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) return <FullPageSpinner />;
  if (!isAuthenticated) return <Navigate to="/signin" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
