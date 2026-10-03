export const DAY_MS = 24 * 60 * 60 * 1000;

// The backend stores and returns cycle dates as UTC days, so all comparison here is UTC too.
export function toUtcDay(value) {
  const date = value instanceof Date ? value : new Date(value);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export const isoDay = (value) => (value ? toUtcDay(value).toISOString().slice(0, 10) : null);
export const todayIso = () => isoDay(new Date());
export const addDays = (value, days) => new Date(toUtcDay(value).getTime() + days * DAY_MS);
export const daysBetween = (from, to) => Math.round((toUtcDay(to) - toUtcDay(from)) / DAY_MS);

// Inclusive list of ISO day strings, capped so a bad range cannot spin forever.
export function isoRange(start, end, max = 400) {
  if (!start) return [];
  const last = end ?? start;
  const total = Math.min(Math.max(daysBetween(start, last), 0), max);
  return Array.from({ length: total + 1 }, (_, index) => isoDay(addDays(start, index)));
}

const OPTIONS = { timeZone: "UTC" };

export const formatShort = (value) =>
  value ? toUtcDay(value).toLocaleDateString("en-IN", { ...OPTIONS, day: "numeric", month: "short" }) : "";

export const formatLong = (value) =>
  value
    ? toUtcDay(value).toLocaleDateString("en-IN", { ...OPTIONS, day: "numeric", month: "long", year: "numeric" })
    : "";

export const formatMonthYear = (value) =>
  toUtcDay(value).toLocaleDateString("en-IN", { ...OPTIONS, month: "long", year: "numeric" });

// Monday-first grid: six rows of seven always, so the calendar never changes height.
export function monthGrid(year, month) {
  const first = new Date(Date.UTC(year, month, 1));
  const offset = (first.getUTCDay() + 6) % 7;
  const start = addDays(first, -offset);
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

export const relativeDays = (days) => {
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  return days > 0 ? `in ${days} days` : `${Math.abs(days)} days ago`;
};
