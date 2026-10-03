import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../context/authContext.js";
import Spinner from "../components/ui/Spinner.jsx";

export function FullPageSpinner() {
  return (
    <div className="app-bg grid place-items-center">
      <div className="text-brand-600 flex flex-col items-center gap-3">
        <Spinner className="size-7" label="Loading" />
        <p className="text-sm font-medium text-slate-500">Loading AROGYINI…</p>
      </div>
    </div>
  );
}

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageSpinner />;
  // Remember where they were headed so sign-in can send them back.
  if (!isAuthenticated) return <Navigate to="/signin" replace state={{ from: location }} />;
  return <Outlet />;
}
