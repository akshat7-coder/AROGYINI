import { Link } from "react-router";
import Logo from "../components/brand/Logo.jsx";
import HeroArt from "../components/brand/HeroArt.jsx";
import useReveal from "../hooks/useReveal.js";

export default function AuthLayout({ title, subtitle, children, footer }) {
  const scope = useReveal();

  return (
    <div className="app-bg grid place-items-center px-4 py-10" ref={scope}>
      <div className="app-blobs" aria-hidden="true">
        <div className="app-blob bg-brand-200/50 -top-24 -left-20 size-80" />
        <div className="app-blob size-72 bg-amber-100/60 -right-20 bottom-0" />
      </div>

      <div
        data-reveal-group
        className="relative grid w-full max-w-4xl items-center gap-10 lg:grid-cols-2"
      >
        {/* Art panel: desktop only, the form is the whole page on mobile. */}
        <div data-reveal className="reveal hidden text-center lg:block">
          <HeroArt className="mx-auto w-full max-w-sm" />
          <p className="font-script text-ink-soft mt-4 text-2xl">Empowering Women Through</p>
          <p className="font-display text-ink mt-1 text-xl font-bold">
            Health, Safety, Awareness &amp; Opportunity
          </p>
        </div>

        <div className="mx-auto w-full max-w-md">
          <Link to="/" className="focus-ring mb-6 flex justify-center rounded-2xl lg:justify-start">
            <Logo />
          </Link>

          <div data-reveal className="reveal glass-strong p-7">
            <h1 className="text-2xl font-bold">{title}</h1>
            {subtitle ? <p className="mt-1.5 text-sm text-slate-600">{subtitle}</p> : null}
            <div className="mt-6">{children}</div>
          </div>

          {footer ? <div className="mt-5 text-center text-sm text-slate-600">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}
