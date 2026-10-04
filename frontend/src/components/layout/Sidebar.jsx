import { NavLink, useNavigate } from "react-router";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import Logo, { LogoMark } from "../brand/Logo.jsx";
import { NAV_ITEMS, SECONDARY_NAV_ITEMS } from "./navigation.js";
import { useAuth } from "../../context/authContext.js";

function Item({ to, label, icon: Icon, accent, collapsed }) {
  return (
    <NavLink
      to={to}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `focus-ring group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition
         ${collapsed ? "justify-center" : ""}
         ${isActive ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:bg-white/70"}`
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={`size-5 shrink-0 ${isActive ? accent : "text-slate-400 group-hover:text-slate-600"}`}
            aria-hidden="true"
          />
          {collapsed ? <span className="sr-only">{label}</span> : <span className="truncate">{label}</span>}
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar({ collapsed, onToggle }) {
  const { isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const secondary = SECONDARY_NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside
      className={`glass sticky top-4 hidden h-[calc(100dvh-2rem)] shrink-0 flex-col p-3 transition-[width] duration-200 lg:flex
        ${collapsed ? "w-[76px]" : "w-64"}`}
    >
      <div className={`mb-5 flex items-center px-1 ${collapsed ? "justify-center" : ""}`}>
        {collapsed ? <LogoMark className="text-brand-500 size-9" /> : <Logo />}
      </div>

      <nav aria-label="Main" className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <Item key={item.to} {...item} collapsed={collapsed} />
        ))}

        <div className="my-3 border-t border-white/80" />

        {secondary.map((item) => (
          <Item key={item.to} {...item} accent="text-brand-600" collapsed={collapsed} />
        ))}

        {/* Signing out used to live only behind the avatar menu, where people did not find it. */}
        <button
          type="button"
          title={collapsed ? "Sign out" : undefined}
          onClick={() => {
            logout();
            navigate("/signin", { replace: true });
          }}
          className={`focus-ring group mt-auto flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium
            text-slate-600 transition hover:bg-rose-50 hover:text-rose-700 ${collapsed ? "justify-center" : ""}`}
        >
          <LogOut className="size-5 shrink-0 text-slate-400 group-hover:text-rose-600" aria-hidden="true" />
          {collapsed ? <span className="sr-only">Sign out</span> : <span className="truncate">Sign out</span>}
        </button>
      </nav>

      <button
        type="button"
        onClick={onToggle}
        aria-expanded={!collapsed}
        className="focus-ring mt-2 flex items-center justify-center gap-2 rounded-2xl px-3 py-2 text-xs font-medium text-slate-500 transition hover:bg-white/70"
      >
        {collapsed ? (
          <ChevronRight className="size-4" aria-hidden="true" />
        ) : (
          <>
            <ChevronLeft className="size-4" aria-hidden="true" />
            Collapse
          </>
        )}
        <span className="sr-only">{collapsed ? "Expand sidebar" : "Collapse sidebar"}</span>
      </button>
    </aside>
  );
}
