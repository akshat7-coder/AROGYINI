import { AlertTriangle, CalendarHeart, Droplets, Sparkles } from "lucide-react";
import Badge from "../ui/Badge.jsx";
import Skeleton from "../ui/Skeleton.jsx";
import { formatShort, relativeDays } from "../../lib/dates.js";
import { PHASE_LABELS } from "../../lib/cycle.js";

const PHASE_RING = {
  menstrual: "stroke-rose-500",
  follicular: "stroke-amber-400",
  ovulation: "stroke-teal-500",
  luteal: "stroke-indigo-400",
};

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function ProgressRing({ day, total, phase }) {
  const fraction = Math.min(1, Math.max(0, total ? day / total : 0));

  return (
    <div className="relative grid size-32 shrink-0 place-items-center">
      <svg viewBox="0 0 120 120" className="size-32 -rotate-90" aria-hidden="true">
        <circle cx="60" cy="60" r={RADIUS} className="fill-none stroke-slate-200" strokeWidth="9" />
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          className={`fill-none ${PHASE_RING[phase] ?? "stroke-brand-500"} transition-[stroke-dashoffset] duration-700`}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - fraction)}
        />
      </svg>

      <div className="absolute text-center">
        <p className="font-mono tnum text-3xl leading-none font-bold text-slate-900">{day}</p>
        <p className="mt-1 text-[11px] font-medium text-slate-500">of {total}</p>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, note, tone = "text-slate-400" }) {
  return (
    <div className="rounded-2xl bg-white/70 p-4">
      <div className="flex items-center gap-1.5">
        <Icon className={`size-3.5 ${tone}`} aria-hidden="true" />
        <p className="text-xs font-medium text-slate-500">{label}</p>
      </div>
      <p className="mt-1.5 text-sm font-semibold text-slate-800">{value}</p>
      {note ? <p className="mt-0.5 text-xs text-slate-500">{note}</p> : null}
    </div>
  );
}

export function CycleSummarySkeleton() {
  return (
    <div className="glass p-6">
      <div className="flex flex-col items-center gap-6 sm:flex-row">
        <Skeleton className="size-32 shrink-0 rounded-full" />
        <div className="w-full space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full max-w-sm" />
          <div className="grid gap-3 sm:grid-cols-3">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CycleSummaryHero({ summary }) {
  const {
    phase,
    currentCycleDay,
    averageCycleLength,
    averagePeriodLength,
    nextPeriodDate,
    daysUntilNextPeriod,
    fertileWindow,
    ovulationDate,
    irregular,
    logCount,
  } = summary;

  return (
    <section className="glass p-6">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <ProgressRing day={currentCycleDay} total={averageCycleLength} phase={phase} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-2xl font-semibold text-slate-900">
              {PHASE_LABELS[phase] ?? "Cycle"} phase
            </h2>
            <Badge tone={irregular ? "warning" : "brand"}>
              {irregular ? "Irregular" : `${averageCycleLength}-day average`}
            </Badge>
          </div>

          <p className="mt-1.5 text-sm text-slate-600">
            Day {currentCycleDay} of about {averageCycleLength}, based on your last{" "}
            {logCount === 1 ? "log" : `${logCount} logs`}. Periods last about {averagePeriodLength}{" "}
            days.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Stat
              icon={Droplets}
              tone="text-health"
              label="Next period"
              value={formatShort(nextPeriodDate)}
              note={relativeDays(daysUntilNextPeriod)}
            />
            <Stat
              icon={Sparkles}
              tone="text-career"
              label="Fertile window"
              value={`${formatShort(fertileWindow?.start)} – ${formatShort(fertileWindow?.end)}`}
              note={`Ovulation around ${formatShort(ovulationDate)}`}
            />
            <Stat
              icon={CalendarHeart}
              tone="text-legal"
              label="Cycle length"
              value={`${averageCycleLength} days`}
              note={`Period ${averagePeriodLength} days`}
            />
          </div>
        </div>
      </div>

      {irregular ? (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-amber-900">Your cycles vary quite a lot</p>
            <p className="mt-0.5 text-sm text-amber-800">
              Your recent cycles differ by more than a week, so these predictions are rough. It is
              worth speaking to a gynaecologist, especially if this is new or you also have heavy
              bleeding or a lot of pain.
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
