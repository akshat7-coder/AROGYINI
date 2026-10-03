import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ChevronDown, LogOut, Settings, ShieldAlert, User } from "lucide-react";
import { useAuth } from "../../context/authContext.js";
import { useSos } from "../../context/sosContext.js";
import SosBanner from "../sos/SosBanner.jsx";

function UserMenu() {
  const { user, isAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => event.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const initial = user?.name?.trim()?.[0]?.toUpperCase() ?? "?";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="focus-ring flex items-center gap-2 rounded-full border border-white/80 bg-white/70 py-1 pr-2 pl-1 transition hover:bg-white"
      >
        <span className="bg-brand-100 text-brand-700 grid size-8 place-items-center rounded-full text-sm font-semibold">
          {initial}
        </span>
        <span className="hidden max-w-28 truncate text-sm font-medium text-slate-700 sm:block">
          {user?.name}
        </span>
        <ChevronDown className="size-4 text-slate-400" aria-hidden="true" />
      </button>

      {open ? (
        <div
          role="menu"
          className="glass-strong absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl p-1.5"
        >
          <div className="px-3 py-2">
            <p className="truncate text-sm font-semibold text-slate-800">{user?.name}</p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
          </div>
          <div className="my-1 border-t border-slate-200/70" />

          <Link
            to="/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="focus-ring flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-900/5"
          >
            <User className="size-4 text-slate-400" aria-hidden="true" />
            Profile
          </Link>

          {isAdmin ? (
            <Link
              to="/admin"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="focus-ring flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-900/5"
            >
              <Settings className="size-4 text-slate-400" aria-hidden="true" />
              Admin
            </Link>
          ) : null}

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              logout();
              navigate("/signin", { replace: true });
            }}
            className="focus-ring flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-rose-600 transition hover:bg-rose-50"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function TopBar({ title }) {
  const { openModal } = useSos();

  return (
    <header className="glass sticky top-0 z-40 mb-6 overflow-hidden">
      <SosBanner />

      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <h1 className="truncate text-xl font-semibold text-slate-800 sm:text-2xl">{title}</h1>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={openModal}
            className="focus-ring bg-safety inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-bold text-white shadow-sm transition hover:brightness-110 sm:px-4"
          >
            <ShieldAlert className="size-4" aria-hidden="true" />
            SOS
          </button>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
