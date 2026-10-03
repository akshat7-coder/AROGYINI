import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import AppShell from "./components/layout/AppShell.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
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
import AdminHome from "./pages/admin/AdminHome.jsx";
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
                  <Route path="/admin" element={<AdminHome />} />
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
