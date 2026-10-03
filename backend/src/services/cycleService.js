import CycleLog from "../models/CycleLog.js";
import { AppError } from "../utils/AppError.js";
import { addDays, daysBetween, toIsoDate, todayUtc, toUtcDay } from "../utils/dates.js";

export const DEFAULT_CYCLE_LENGTH = 28;
export const DEFAULT_PERIOD_LENGTH = 5;
export const MIN_CYCLE_LENGTH = 21;
export const MAX_CYCLE_LENGTH = 45;
export const IRREGULAR_SPREAD_DAYS = 7;
export const CYCLE_SAMPLE_SIZE = 6;
export const LUTEAL_PHASE_DAYS = 14;

const PHASE_TIPS = {
  menstrual: [
    "Rest when you can and keep hydrated.",
    "Iron-rich food helps with the fatigue.",
    "A hot water bag eases cramps.",
  ],
  follicular: ["Energy usually climbs now.", "A good stretch for workouts and new plans."],
  ovulation: [
    "This is your most fertile stretch.",
    "Track changes closely if you are planning or avoiding pregnancy.",
  ],
  luteal: ["PMS can begin here.", "Go easy on caffeine and salt.", "Protect your sleep."],
};

const average = (numbers) => numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const byStartDate = (a, b) => toUtcDay(a.startDate) - toUtcDay(b.startDate);

export const sortLogs = (logs) => [...logs].sort(byStartDate);

// Gaps between consecutive period starts; n logs give n-1 cycle lengths.
export function cycleLengths(sortedLogs) {
  return sortedLogs
    .slice(1)
    .map((log, i) => daysBetween(sortedLogs[i].startDate, log.startDate))
    .filter((length) => length > 0);
}

export function averageCycleLength(sortedLogs) {
  const recent = cycleLengths(sortedLogs).slice(-CYCLE_SAMPLE_SIZE);
  if (recent.length === 0) return DEFAULT_CYCLE_LENGTH;
  return clamp(Math.round(average(recent)), MIN_CYCLE_LENGTH, MAX_CYCLE_LENGTH);
}

export function averagePeriodLength(sortedLogs) {
  const lengths = sortedLogs
    .filter((log) => log.endDate)
    .map((log) => daysBetween(log.startDate, log.endDate) + 1)
    .filter((length) => length > 0);
  if (lengths.length === 0) return DEFAULT_PERIOD_LENGTH;
  return Math.max(1, Math.round(average(lengths)));
}

export function isIrregular(sortedLogs) {
  const recent = cycleLengths(sortedLogs).slice(-CYCLE_SAMPLE_SIZE);
  if (recent.length < 2) return false;
  return Math.max(...recent) - Math.min(...recent) > IRREGULAR_SPREAD_DAYS;
}

export function phaseFor({ cycleDay, periodLength, fertileStartDay, fertileEndDay }) {
  if (cycleDay <= periodLength) return "menstrual";
  if (cycleDay >= fertileStartDay && cycleDay <= fertileEndDay) return "ovulation";
  return cycleDay < fertileStartDay ? "follicular" : "luteal";
}

export function buildSummary(logs, today = todayUtc()) {
  if (logs.length === 0) {
    return {
      hasData: false,
      averageCycleLength: DEFAULT_CYCLE_LENGTH,
      averagePeriodLength: DEFAULT_PERIOD_LENGTH,
      irregular: false,
      logCount: 0,
      lastPeriodStart: null,
      nextPeriodDate: null,
      daysUntilNextPeriod: null,
      ovulationDate: null,
      fertileWindow: null,
      currentCycleDay: null,
      phase: null,
      tips: ["Log your first period to unlock predictions."],
    };
  }

  const sorted = sortLogs(logs);
  const cycleLength = averageCycleLength(sorted);
  const periodLength = averagePeriodLength(sorted);

  const lastPeriodStart = toUtcDay(sorted.at(-1).startDate);
  const nextPeriodDate = addDays(lastPeriodStart, cycleLength);
  const ovulationDate = addDays(nextPeriodDate, -LUTEAL_PHASE_DAYS);
  const fertileStart = addDays(ovulationDate, -5);
  const fertileEnd = addDays(ovulationDate, 1);

  const currentCycleDay = daysBetween(lastPeriodStart, today) + 1;
  const phase = phaseFor({
    cycleDay: currentCycleDay,
    periodLength,
    fertileStartDay: daysBetween(lastPeriodStart, fertileStart) + 1,
    fertileEndDay: daysBetween(lastPeriodStart, fertileEnd) + 1,
  });

  return {
    hasData: true,
    averageCycleLength: cycleLength,
    averagePeriodLength: periodLength,
    irregular: isIrregular(sorted),
    logCount: sorted.length,
    lastPeriodStart: toIsoDate(lastPeriodStart),
    nextPeriodDate: toIsoDate(nextPeriodDate),
    daysUntilNextPeriod: daysBetween(today, nextPeriodDate),
    ovulationDate: toIsoDate(ovulationDate),
    fertileWindow: { start: toIsoDate(fertileStart), end: toIsoDate(fertileEnd) },
    currentCycleDay,
    phase,
    tips: PHASE_TIPS[phase],
  };
}

function assertValidRange(startDate, endDate) {
  if (daysBetween(todayUtc(), startDate) > 0) {
    throw new AppError(400, "FUTURE_START_DATE", "Start date cannot be in the future");
  }
  if (endDate && daysBetween(startDate, endDate) < 0) {
    throw new AppError(400, "INVALID_DATE_RANGE", "End date cannot be before the start date");
  }
}

// A log with no endDate is an ongoing period, so it occupies just its start day.
async function assertNoOverlap(userId, startDate, endDate, excludeId) {
  const start = toUtcDay(startDate);
  const end = toUtcDay(endDate ?? startDate);
  const clash = await CycleLog.findOne({
    user: userId,
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    startDate: { $lte: end },
    $expr: { $gte: [{ $ifNull: ["$endDate", "$startDate"] }, start] },
  });
  if (clash) {
    throw new AppError(409, "CYCLE_OVERLAP", "This period overlaps a log you already have");
  }
}

export async function listCycles(userId, { page, limit, skip }) {
  const filter = { user: userId };
  const [logs, total] = await Promise.all([
    CycleLog.find(filter).sort({ startDate: -1 }).skip(skip).limit(limit),
    CycleLog.countDocuments(filter),
  ]);
  return { logs, meta: { page, limit, total } };
}

export async function createCycle(userId, payload) {
  assertValidRange(payload.startDate, payload.endDate);
  await assertNoOverlap(userId, payload.startDate, payload.endDate);
  return CycleLog.create({ ...payload, user: userId });
}

export async function updateCycle(userId, id, payload) {
  const log = await CycleLog.findOne({ _id: id, user: userId });
  if (!log) throw new AppError(404, "NOT_FOUND", "Cycle log not found");

  const startDate = payload.startDate ?? log.startDate;
  const endDate = "endDate" in payload ? payload.endDate : log.endDate;
  assertValidRange(startDate, endDate);
  await assertNoOverlap(userId, startDate, endDate, id);

  Object.assign(log, payload);
  await log.save();
  return log;
}

export async function deleteCycle(userId, id) {
  const log = await CycleLog.findOneAndDelete({ _id: id, user: userId });
  if (!log) throw new AppError(404, "NOT_FOUND", "Cycle log not found");
  return log;
}

export async function getSummary(userId) {
  const logs = await CycleLog.find({ user: userId }).sort({ startDate: 1 });
  return buildSummary(logs);
}
