import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import Card, { CardHeader } from "../ui/Card.jsx";
import { addDays, formatMonthYear, isoDay, isoRange, monthGrid, todayIso } from "../../lib/dates.js";

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const LEGEND = [
  { label: "Period", className: "bg-rose-500" },
  { label: "Predicted", className: "border-2 border-dashed border-rose-400 bg-rose-50" },
  { label: "Fertile", className: "bg-teal-100" },
  { label: "Ovulation", className: "bg-teal-500" },
];

export default function CycleCalendar({ logs = [], summary }) {
  const today = todayIso();
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getUTCFullYear(), month: now.getUTCMonth() };
  });

  const marks = useMemo(() => {
    const logged = new Set();
    for (const log of logs) {
      for (const day of isoRange(log.startDate, log.endDate)) logged.add(day);
    }

    const predicted = new Set();
    if (summary?.nextPeriodDate) {
      const length = Math.max(1, summary.averagePeriodLength ?? 5);
      for (const day of isoRange(summary.nextPeriodDate, addDays(summary.nextPeriodDate, length - 1))) {
        predicted.add(day);
      }
    }

    const fertile = new Set(isoRange(summary?.fertileWindow?.start, summary?.fertileWindow?.end));

    return { logged, predicted, fertile, ovulation: isoDay(summary?.ovulationDate) };
  }, [logs, summary]);

  const days = useMemo(() => monthGrid(cursor.year, cursor.month), [cursor]);
  const monthLabel = formatMonthYear(new Date(Date.UTC(cursor.year, cursor.month, 1)));

  const shift = (delta) =>
    setCursor(({ year, month }) => {
      const next = new Date(Date.UTC(year, month + delta, 1));
      return { year: next.getUTCFullYear(), month: next.getUTCMonth() };
    });

  return (
    <Card as="section">
      <CardHeader
        title="Your calendar"
        description="Logged days are solid, predictions are outlined."
        icon={CalendarDays}
        action={
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => shift(-1)}
              aria-label="Previous month"
              className="focus-ring grid size-9 place-items-center rounded-full text-slate-500 transition hover:bg-slate-900/5"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => shift(1)}
              aria-label="Next month"
              className="focus-ring grid size-9 place-items-center rounded-full text-slate-500 transition hover:bg-slate-900/5"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </div>
        }
      />

      <p className="mb-3 text-center text-sm font-semibold text-slate-700" aria-live="polite">
        {monthLabel}
      </p>

      <div className="grid grid-cols-7 gap-1" role="grid" aria-label={`Cycle calendar for ${monthLabel}`}>
        {WEEKDAYS.map((weekday) => (
          <div key={weekday} className="pb-1 text-center text-[11px] font-semibold text-slate-400">
            {weekday}
          </div>
        ))}

        {days.map((date) => {
          const key = isoDay(date);
          const inMonth = date.getUTCMonth() === cursor.month;
          const isToday = key === today;
          const isLogged = marks.logged.has(key);
          const isPredicted = !isLogged && marks.predicted.has(key);
          const isOvulation = !isLogged && key === marks.ovulation;
          const isFertile = !isLogged && !isOvulation && marks.fertile.has(key);

          const states = [
            isLogged && "period",
            isPredicted && "predicted period",
            isOvulation && "ovulation",
            isFertile && "fertile",
            isToday && "today",
          ].filter(Boolean);

          let tone = "text-slate-600";
          if (isLogged) tone = "bg-rose-500 text-white font-semibold";
          else if (isPredicted) tone = "border-2 border-dashed border-rose-400 bg-rose-50 text-rose-700";
          else if (isOvulation) tone = "bg-teal-500 text-white font-semibold";
          else if (isFertile) tone = "bg-teal-100 text-teal-800";

          return (
            <div
              key={key}
              role="gridcell"
              aria-label={states.length > 0 ? `${key}: ${states.join(", ")}` : key}
              className={`grid aspect-square place-items-center rounded-xl text-sm transition
                ${tone}
                ${inMonth ? "" : "opacity-30"}
                ${isToday ? "ring-2 ring-slate-900 ring-offset-1" : ""}`}
            >
              <span className="tnum">{date.getUTCDate()}</span>
            </div>
          );
        })}
      </div>

      <ul className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        {LEGEND.map(({ label, className }) => (
          <li key={label} className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className={`size-3.5 rounded ${className}`} aria-hidden="true" />
            {label}
          </li>
        ))}
        <li className="flex items-center gap-1.5 text-xs text-slate-600">
          <span className="size-3.5 rounded ring-2 ring-slate-900" aria-hidden="true" />
          Today
        </li>
      </ul>
    </Card>
  );
}
