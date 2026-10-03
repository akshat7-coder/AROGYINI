import { Link } from "react-router";
import { ArrowRight, Briefcase, HeartPulse, MessageCircleHeart, Phone, Scale, ShieldAlert } from "lucide-react";
import Button from "../components/ui/Button.jsx";
import { useAuth } from "../context/authContext.js";

const PILLARS = [
  {
    icon: HeartPulse,
    title: "Health",
    tint: "bg-rose-50 text-health",
    description:
      "Track your cycle and get predictions you can plan around: next period, fertile window, and the phase you are in today.",
  },
  {
    icon: Scale,
    title: "Legal",
    tint: "bg-indigo-50 text-legal",
    description:
      "Plain-language guides to the POSH Act, domestic violence, dowry, maternity benefits and Zero FIR, plus ready complaint drafts.",
  },
  {
    icon: Briefcase,
    title: "Career",
    tint: "bg-teal-50 text-career",
    description:
      "Jobs, remote roles and returnships for women coming back after a break, with scholarships and schemes worth applying to.",
  },
  {
    icon: ShieldAlert,
    title: "Safety",
    tint: "bg-rose-50 text-safety",
    description:
      "One tap texts your live location to up to five emergency contacts. A siren and a fake call are there when you need them.",
  },
];

const HELPLINES = [
  { number: "112", label: "Emergency" },
  { number: "181", label: "Women Helpline" },
  { number: "1091", label: "Women Police" },
  { number: "1930", label: "Cyber Crime" },
  { number: "15100", label: "Legal Aid" },
  { number: "1800-599-0019", label: "Mental Health" },
];

export default function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="app-bg">
      <div className="app-blob bg-brand-200/40 -top-32 -left-20 size-96" />
      <div className="app-blob size-80 bg-teal-200/35 top-20 -right-24" />
      <div className="app-blob size-72 bg-amber-100/50 bottom-32 left-1/3" />

      <div className="relative mx-auto max-w-6xl px-5 py-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="bg-brand-600 grid size-10 place-items-center rounded-2xl text-lg font-bold text-white">
              A
            </span>
            <span className="font-display text-xl font-semibold text-slate-800">AROGYINI</span>
          </div>

          <nav className="flex items-center gap-2" aria-label="Account">
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button size="sm">Open app</Button>
              </Link>
            ) : (
              <>
                <Link to="/signin">
                  <Button variant="ghost" size="sm">
                    Sign in
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm">Get started</Button>
                </Link>
              </>
            )}
          </nav>
        </header>

        <section className="py-16 text-center sm:py-24">
          <p className="text-brand-700 bg-brand-50 mb-5 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold">
            <span className="bg-brand-500 size-1.5 rounded-full" aria-hidden="true" />
            Built for women in India
          </p>

          <h1 className="font-display mx-auto max-w-3xl text-4xl leading-tight font-semibold text-slate-900 sm:text-6xl">
            Your health, your rights, your work, your safety
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base text-slate-600 sm:text-lg">
            One calm place for the things that matter: a period tracker that actually predicts, legal
            help in plain language, work that fits your life, and an SOS that reaches the people who
            will come.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to={isAuthenticated ? "/dashboard" : "/signup"}>
              <Button size="lg">
                {isAuthenticated ? "Go to dashboard" : "Create a free account"}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </Link>
            <Link to="/signin">
              <Button variant="secondary" size="lg">
                I already have an account
              </Button>
            </Link>
          </div>
        </section>

        <section aria-labelledby="pillars" className="pb-16">
          <h2 id="pillars" className="sr-only">
            What AROGYINI does
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {PILLARS.map(({ icon: Icon, title, description, tint }) => (
              <article key={title} className="glass hover-lift p-6">
                <span className={`mb-4 grid size-11 place-items-center rounded-2xl ${tint}`}>
                  <Icon className="size-5.5" aria-hidden="true" />
                </span>
                <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="helplines" className="glass mb-12 p-6">
          <div className="mb-4 flex items-center gap-2.5">
            <Phone className="text-safety size-5" aria-hidden="true" />
            <h2 id="helplines" className="text-base font-semibold text-slate-800">
              Helplines, any time
            </h2>
          </div>

          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {HELPLINES.map(({ number, label }) => (
              <li key={number} className="rounded-2xl bg-white/70 px-3 py-2.5 text-center">
                <a
                  href={`tel:${number}`}
                  className="focus-ring font-mono tnum block text-base font-semibold text-slate-900 hover:underline"
                >
                  {number}
                </a>
                <span className="mt-0.5 block text-xs text-slate-500">{label}</span>
              </li>
            ))}
          </ul>
        </section>

        <footer className="flex flex-col items-center gap-2 pb-10 text-center text-xs text-slate-500">
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
