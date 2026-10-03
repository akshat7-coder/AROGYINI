import { Link } from "react-router";
import { ArrowRight, Briefcase, HeartPulse, MessageCircleHeart, Phone, Scale, ShieldAlert } from "lucide-react";
import Card from "../components/ui/Card.jsx";
import { useAuth } from "../context/authContext.js";

const PILLARS = [
  {
    to: "/health",
    icon: HeartPulse,
    title: "Health",
    tint: "bg-rose-50 text-health",
    description: "Track your cycle and see what is coming.",
  },
  {
    to: "/legal",
    icon: Scale,
    title: "Legal",
    tint: "bg-indigo-50 text-legal",
    description: "Your rights, and drafts you can file.",
  },
  {
    to: "/career",
    icon: Briefcase,
    title: "Career",
    tint: "bg-teal-50 text-career",
    description: "Jobs, returnships and scholarships.",
  },
  {
    to: "/safety",
    icon: ShieldAlert,
    title: "Safety",
    tint: "bg-rose-50 text-safety",
    description: "SOS, siren and a fake call.",
  },
];

const QUICK_NUMBERS = [
  { number: "112", label: "Emergency" },
  { number: "181", label: "Women Helpline" },
  { number: "1091", label: "Women Police" },
  { number: "1930", label: "Cyber Crime" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const firstName = user?.name?.trim()?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-5">
      <Card>
        <p className="text-brand-700 text-xs font-semibold tracking-wide uppercase">Welcome back</p>
        <h2 className="font-display mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">
          Hello, {firstName}
        </h2>
        <p className="mt-2 max-w-xl text-sm text-slate-600">
          Everything is in one place. Start wherever you need to, and the assistant can point you in
          the right direction if you are not sure.
        </p>

        <Link
          to="/chat"
          className="text-brand-700 focus-ring mt-4 inline-flex items-center gap-1.5 rounded-full text-sm font-semibold hover:underline"
        >
          <MessageCircleHeart className="size-4" aria-hidden="true" />
          Ask the assistant
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </Card>

      <section aria-labelledby="pillars" className="grid gap-4 sm:grid-cols-2">
        <h2 id="pillars" className="sr-only">
          The four pillars
        </h2>
        {PILLARS.map(({ to, icon: Icon, title, description, tint }) => (
          <Link key={to} to={to} className="focus-ring glass hover-lift block rounded-3xl p-6">
            <span className={`mb-4 grid size-11 place-items-center rounded-2xl ${tint}`}>
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <h3 className="flex items-center gap-1.5 text-lg font-semibold text-slate-800">
              {title}
              <ArrowRight className="size-4 text-slate-300" aria-hidden="true" />
            </h3>
            <p className="mt-1 text-sm text-slate-600">{description}</p>
          </Link>
        ))}
      </section>

      <Card as="section" aria-labelledby="numbers">
        <div className="mb-4 flex items-center gap-2.5">
          <Phone className="text-safety size-5" aria-hidden="true" />
          <h2 id="numbers" className="text-base font-semibold text-slate-800">
            Numbers worth saving
          </h2>
        </div>

        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUICK_NUMBERS.map(({ number, label }) => (
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
      </Card>
    </div>
  );
}
