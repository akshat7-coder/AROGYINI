import { Link } from "react-router";
import {
  ArrowRight,
  Award,
  Briefcase,
  Compass,
  HeartPulse,
  Lock,
  MessageCircleHeart,
  Phone,
  Scale,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Button from "../components/ui/Button.jsx";
import Logo from "../components/brand/Logo.jsx";
import HeroArt, { Sprig } from "../components/brand/HeroArt.jsx";
import useReveal from "../hooks/useReveal.js";
import { useAuth } from "../context/authContext.js";

const PILLARS = [
  {
    icon: HeartPulse,
    title: "Health Care",
    tint: "bg-rose-50/80 text-health",
    accent: "text-health",
    description:
      "Track your cycle and get predictions you can plan around: next period, fertile window, and the phase you are in today.",
  },
  {
    icon: Scale,
    title: "Legal Awareness",
    tint: "bg-violet-50/80 text-legal",
    accent: "text-legal",
    description:
      "Plain-language guides to the POSH Act, domestic violence, dowry, maternity benefits and Zero FIR, plus ready complaint drafts.",
  },
  {
    icon: Briefcase,
    title: "Career Opportunities",
    tint: "bg-teal-50/80 text-career",
    accent: "text-career",
    description:
      "Jobs, remote roles and returnships for women coming back after a break, with scholarships and schemes worth applying to.",
  },
  {
    icon: ShieldAlert,
    title: "Safety & Support",
    tint: "bg-orange-50/80 text-safety",
    accent: "text-safety",
    description:
      "One tap texts your live location to up to five emergency contacts. A siren and a fake call are there when you need them.",
  },
];

const REASONS = [
  { icon: ShieldCheck, title: "Trusted", text: "Reliable and verified information" },
  { icon: Sparkles, title: "Personalized", text: "Guidance tailored to your needs" },
  { icon: Search, title: "Accessible", text: "Easy to use, anytime, anywhere" },
  { icon: Award, title: "Empowering", text: "Helping women make informed choices" },
  { icon: Lock, title: "Secure", text: "Your privacy and safety come first" },
  { icon: Compass, title: "Holistic", text: "Health, legal, career and safety together" },
];

const HELPLINES = [
  { number: "112", label: "Emergency" },
  { number: "181", label: "Women Helpline" },
  { number: "1091", label: "Women Police" },
  { number: "1930", label: "Cyber Crime" },
  { number: "15100", label: "Legal Aid" },
  { number: "1800-599-0019", label: "Mental Health" },
];

const NAV_LINKS = [
  ["Health Care", "#pillars"],
  ["Legal Awareness", "#pillars"],
  ["Career", "#pillars"],
  ["Why Arogyini", "#why"],
  ["Helplines", "#helplines"],
];

function SectionHeading({ id, title, subtitle }) {
  return (
    <div className="mb-8 text-center">
      <h2 id={id} className="flex items-center justify-center gap-3 text-2xl font-bold sm:text-3xl">
        <Sprig className="text-brand-300 size-5" flip />
        {title}
        <Sprig className="text-brand-300 size-5" />
      </h2>
      {subtitle ? <p className="mt-2 text-sm text-slate-500">{subtitle}</p> : null}
    </div>
  );
}

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const scope = useReveal();

  return (
    <div className="app-bg" ref={scope}>
      <div className="app-blobs" aria-hidden="true">
        <div className="app-blob bg-brand-200/50 -top-32 -left-20 size-96" />
        <div className="app-blob size-80 bg-amber-100/60 top-24 -right-24" />
        <div className="app-blob bg-brand-100/70 bottom-32 left-1/3 size-72" />
      </div>

      <div className="relative px-4 pt-4 sm:px-6">
        <header className="glass-strong sticky top-3 z-40 mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-full px-4 py-2.5 sm:px-6">
          <Link to="/" className="focus-ring rounded-2xl">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Sections">
            {NAV_LINKS.map(([label, href]) => (
              <a
                key={label}
                href={href}
                className="focus-ring hover:text-brand-700 rounded-full px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-white/70"
              >
                {label}
              </a>
            ))}
          </nav>

          <nav className="flex shrink-0 items-center gap-2" aria-label="Account">
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button size="sm">Open app</Button>
              </Link>
            ) : (
              <>
                <Link to="/signin">
                  <Button variant="secondary" size="sm">
                    Login
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm">Register</Button>
                </Link>
              </>
            )}
          </nav>
        </header>

        <main className="mx-auto max-w-6xl">
          <section
            data-reveal-group
            className="grid items-center gap-8 py-12 sm:py-20 lg:grid-cols-[1.05fr_0.95fr]"
          >
            <div className="text-center lg:text-left">
              <h1
                data-reveal
                className="reveal font-display text-brand-600 text-5xl font-bold tracking-wide sm:text-7xl"
              >
                AROGYINI
              </h1>
              <p data-reveal className="reveal font-script text-ink-soft mt-3 text-2xl sm:text-3xl">
                Empowering Women Through
              </p>
              <p data-reveal className="reveal font-display text-ink mt-1 text-2xl font-bold sm:text-3xl">
                Health, Safety, Awareness &amp; Opportunity
              </p>
              <p
                data-reveal
                className="reveal mx-auto mt-5 max-w-lg text-base leading-relaxed text-slate-600 lg:mx-0"
              >
                A unified digital platform providing reliable guidance, personalized assistance,
                emergency support, legal awareness and career opportunities.
              </p>

              <div
                data-reveal
                className="reveal mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start"
              >
                <Link to={isAuthenticated ? "/dashboard" : "/signup"}>
                  <Button size="lg">
                    {isAuthenticated ? "Go to dashboard" : "Explore Arogyini"}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Button>
                </Link>
                <Link to="/signin">
                  <Button variant="secondary" size="lg">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>

            <HeroArt data-reveal className="reveal mx-auto w-full max-w-md" />
          </section>

          <section id="pillars" aria-labelledby="pillars-title" data-reveal-group className="pb-16 sm:pb-24">
            <SectionHeading
              id="pillars-title"
              title="Our Four Pillars"
              subtitle="Empowering every woman through knowledge, support and opportunity"
            />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {PILLARS.map(({ icon: Icon, title, description, tint, accent }) => (
                <article
                  key={title}
                  data-reveal
                  className="reveal glass hover-lift flex flex-col p-6 text-center"
                >
                  <span className={`mx-auto mb-4 grid size-14 place-items-center rounded-full ${tint}`}>
                    <Icon className="size-6" aria-hidden="true" />
                  </span>
                  <h3 className={`text-base font-bold ${accent}`}>{title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{description}</p>
                  <Link
                    to={isAuthenticated ? "/dashboard" : "/signup"}
                    className={`focus-ring mt-4 inline-flex items-center justify-center gap-1.5 rounded-full text-sm font-semibold transition-all hover:gap-2.5 ${accent}`}
                  >
                    Explore
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </article>
              ))}
            </div>
          </section>

          <section id="why" aria-labelledby="why-title" data-reveal-group className="pb-16 sm:pb-24">
            <SectionHeading id="why-title" title="Why Arogyini?" />

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {REASONS.map(({ icon: Icon, title, text }) => (
                <div key={title} data-reveal className="reveal text-center">
                  <span className="bg-brand-100/80 text-brand-600 mx-auto mb-3 grid size-12 place-items-center rounded-full">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="text-sm font-bold">{title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{text}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="helplines" aria-labelledby="helplines-title" data-reveal-group className="pb-16">
            <div data-reveal className="reveal glass p-6 sm:p-8">
              <div className="mb-5 flex items-center justify-center gap-2.5">
                <Phone className="text-safety size-5" aria-hidden="true" />
                <h2 id="helplines-title" className="text-xl font-bold">
                  Helplines, any time
                </h2>
              </div>

              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {HELPLINES.map(({ number, label }) => (
                  <li key={number} className="rounded-2xl bg-white/70 px-3 py-3 text-center">
                    <a
                      href={`tel:${number}`}
                      className="focus-ring font-mono tnum text-ink block text-base font-semibold hover:underline"
                    >
                      {number}
                    </a>
                    <span className="mt-0.5 block text-xs text-slate-500">{label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </main>

        <footer className="mx-auto flex max-w-6xl flex-col items-center gap-2 pb-10 text-center text-xs text-slate-500">
          <Logo tagline={false} className="mb-2 opacity-80" />
          <p className="flex items-center gap-1.5">
            <MessageCircleHeart className="text-brand-500 size-4" aria-hidden="true" />
            AROGYINI gives information and support, not medical or legal advice.
          </p>
          <p>In an emergency, call 112.</p>
        </footer>
      </div>
    </div>
  );
}
