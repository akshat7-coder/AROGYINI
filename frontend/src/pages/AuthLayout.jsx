import { Link } from "react-router";

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="app-bg grid place-items-center px-4 py-10">
      <div className="app-blob bg-brand-200/40 -top-24 -left-20 size-80" />
      <div className="app-blob size-72 bg-teal-200/35 -right-20 bottom-0" />

      <div className="relative w-full max-w-md">
        <Link
          to="/"
          className="focus-ring mb-6 flex items-center justify-center gap-2.5 rounded-full"
        >
          <span className="bg-brand-600 grid size-10 place-items-center rounded-2xl text-lg font-bold text-white">
            A
          </span>
          <span className="font-display text-xl font-semibold text-slate-800">AROGYINI</span>
        </Link>

        <div className="glass p-7">
          <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
          {subtitle ? <p className="mt-1.5 text-sm text-slate-600">{subtitle}</p> : null}
          <div className="mt-6">{children}</div>
        </div>

        {footer ? <div className="mt-5 text-center text-sm text-slate-600">{footer}</div> : null}
      </div>
    </div>
  );
}
