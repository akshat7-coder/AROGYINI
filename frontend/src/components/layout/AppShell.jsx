import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router";
import Sidebar from "./Sidebar.jsx";
import SosButton from "../sos/SosButton.jsx";
import SosModal from "../sos/SosModal.jsx";
import { SosProvider } from "../../context/SosContext.jsx";
import TopBar from "./TopBar.jsx";
import { MOBILE_NAV_ITEMS, NAV_ITEMS, SECONDARY_NAV_ITEMS } from "./navigation.js";

const COLLAPSE_KEY = "arogyini_sidebar_collapsed";
const ALL_ROUTES = [...NAV_ITEMS, ...SECONDARY_NAV_ITEMS];

function titleFor(pathname) {
  const match = ALL_ROUTES.filter((item) => pathname.startsWith(item.to)).sort(
    (a, b) => b.to.length - a.to.length
  )[0];
  return match?.label ?? "AROGYINI";
}

export default function AppShell() {
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === "true");

  useEffect(() => {
    localStorage.setItem(COLLAPSE_KEY, String(collapsed));
  }, [collapsed]);

  return (
    <SosProvider>
    <div className="app-bg">
      <div className="app-blob bg-brand-200/35 -top-24 -left-24 size-80" />
      <div className="app-blob size-72 bg-teal-200/30 top-1/3 -right-24" />
      <div className="app-blob size-72 bg-amber-100/40 bottom-0 left-1/4" />

      <a
        href="#main"
        className="focus-ring sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-60 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold"
      >
        Skip to content
      </a>

      <div className="relative mx-auto flex max-w-7xl gap-4 p-4">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />

        <div className="min-w-0 flex-1">
          <TopBar title={titleFor(pathname)} />
          {/* pb-24 leaves room for the mobile tab bar */}
          <main id="main" className="pb-24 lg:pb-6">
            <Outlet />
          </main>
        </div>
      </div>

      <nav
        aria-label="Main"
        className="glass-strong fixed inset-x-3 bottom-3 z-40 flex items-stretch justify-around gap-1 rounded-3xl p-1.5 lg:hidden"
      >
        {MOBILE_NAV_ITEMS.map(({ to, label, icon: Icon, accent }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `focus-ring flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[11px] font-medium transition
               ${isActive ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`size-5 ${isActive ? accent : "text-slate-400"}`} aria-hidden="true" />
                <span className="truncate">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <SosButton />
      <SosModal />
    </div>
    </SosProvider>
  );
}
