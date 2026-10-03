export const DAY_MS = 24 * 60 * 60 * 1000;

// Everything is reduced to a UTC midnight "day" so cycle maths never drifts with timezones.
export function toUtcDay(value) {
  const date = value instanceof Date ? value : new Date(value);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export const todayUtc = () => toUtcDay(new Date());

export const addDays = (value, days) => new Date(toUtcDay(value).getTime() + days * DAY_MS);

export const daysBetween = (from, to) => Math.round((toUtcDay(to) - toUtcDay(from)) / DAY_MS);

export const toIsoDate = (value) => (value ? toUtcDay(value).toISOString().slice(0, 10) : null);

export const formatIstDateTime = (value = new Date()) =>
  new Date(value).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });

export const formatIstDate = (value = new Date()) =>
  new Date(value).toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
