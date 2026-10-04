import { NavLink, Outlet } from "react-router";
import { BarChart3, Bot, FolderCog, ShieldAlert, Users } from "lucide-react";

const SECTIONS = [
  { to: "/admin", label: "Overview", icon: BarChart3, end: true },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/sos", label: "SOS", icon: ShieldAlert },
  { to: "/admin/chatbot", label: "Chatbot", icon: Bot },
  { to: "/admin/content", label: "Content", icon: FolderCog },
];

export default function AdminLayout() {
  return (
    <div className="space-y-5">
      <nav aria-label="Admin sections" className="glass flex gap-1 overflow-x-auto p-1.5">
        {SECTIONS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `focus-ring flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition
               ${isActive ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:bg-white/60"}`
            }
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  );
}
