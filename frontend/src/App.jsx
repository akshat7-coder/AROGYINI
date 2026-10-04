import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import AppShell from "./components/layout/AppShell.jsx";
import ProtectedRoute, { FullPageSpinner } from "./routes/ProtectedRoute.jsx";
import AdminRoute from "./routes/AdminRoute.jsx";
import Landing from "./pages/Landing.jsx";
import SignIn from "./pages/SignIn.jsx";
import SignUp from "./pages/SignUp.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Health from "./pages/Health.jsx";
import Legal from "./pages/Legal.jsx";
import Career from "./pages/Career.jsx";
import Safety from "./pages/Safety.jsx";
import Chat from "./pages/Chat.jsx";
import Profile from "./pages/Profile.jsx";
// Admin code is only ever loaded by an admin, so it is split out of the main bundle.
const AdminLayout = lazy(() => import("./components/admin/AdminLayout.jsx"));
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview.jsx"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers.jsx"));
const AdminSos = lazy(() => import("./pages/admin/AdminSos.jsx"));
const AdminChat = lazy(() => import("./pages/admin/AdminChat.jsx"));
const AdminContent = lazy(() => import("./pages/admin/AdminContent.jsx"));
import NotFound from "./pages/NotFound.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/health" element={<Health />} />
                <Route path="/legal" element={<Legal />} />
                <Route path="/career" element={<Career />} />
                <Route path="/safety" element={<Safety />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/profile" element={<Profile />} />

                <Route element={<AdminRoute />}>
                  <Route
                    path="/admin"
                    element={
                      <Suspense fallback={<FullPageSpinner />}>
                        <AdminLayout />
                      </Suspense>
                    }
                  >
                    <Route index element={<AdminOverview />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="sos" element={<AdminSos />} />
                    <Route path="chatbot" element={<AdminChat />} />
                    <Route path="content" element={<AdminContent />} />
                  </Route>
                </Route>
              </Route>
            </Route>

            <Route path="/app" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
