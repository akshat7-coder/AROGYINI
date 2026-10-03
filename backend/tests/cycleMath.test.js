import {
  averageCycleLength,
  averagePeriodLength,
  buildSummary,
  cycleLengths,
  isIrregular,
  phaseFor,
  sortLogs,
  DEFAULT_CYCLE_LENGTH,
  DEFAULT_PERIOD_LENGTH,
  MIN_CYCLE_LENGTH,
  MAX_CYCLE_LENGTH,
} from "../src/services/cycleService.js";
import { toUtcDay } from "../src/utils/dates.js";

const log = (startDate, endDate) => ({ startDate: toUtcDay(startDate), endDate: endDate ? toUtcDay(endDate) : undefined });

describe("cycleLengths", () => {
  it("is empty for 0 or 1 logs", () => {
    expect(cycleLengths([])).toEqual([]);
    expect(cycleLengths([log("2026-01-01")])).toEqual([]);
  });

  it("measures the gap between consecutive starts", () => {
    const logs = sortLogs([log("2026-01-01"), log("2026-01-29"), log("2026-02-27")]);
    expect(cycleLengths(logs)).toEqual([28, 29]);
  });
});

describe("averageCycleLength", () => {
  it("defaults to 28 with no completed cycle", () => {
    expect(averageCycleLength([])).toBe(DEFAULT_CYCLE_LENGTH);
    expect(averageCycleLength([log("2026-01-01")])).toBe(DEFAULT_CYCLE_LENGTH);
  });

  it("averages and rounds several cycles", () => {
    const logs = sortLogs([log("2026-01-01"), log("2026-01-29"), log("2026-02-27")]);
    expect(averageCycleLength(logs)).toBe(29); // mean of 28 and 29, rounded
  });

  it("uses only the last 6 cycles", () => {
    // one 45-day outlier followed by seven 28-day cycles pushes the outlier out of the window
    const starts = ["2026-01-01", "2026-02-15"];
    let cursor = new Date(Date.UTC(2026, 1, 15));
    for (let i = 0; i < 7; i += 1) {
      cursor = new Date(cursor.getTime() + 28 * 86400000);
      starts.push(cursor.toISOString().slice(0, 10));
    }
    expect(averageCycleLength(sortLogs(starts.map((s) => log(s))))).toBe(28);
  });

  it("clamps below 21 and above 45", () => {
    const short = sortLogs([log("2026-01-01"), log("2026-01-06"), log("2026-01-11")]);
    expect(averageCycleLength(short)).toBe(MIN_CYCLE_LENGTH);

    const long = sortLogs([log("2026-01-01"), log("2026-05-01")]);
    expect(averageCycleLength(long)).toBe(MAX_CYCLE_LENGTH);
  });

  it("ignores duplicate start dates that would give a zero-length cycle", () => {
    const logs = sortLogs([log("2026-01-01"), log("2026-01-01"), log("2026-01-29")]);
    expect(averageCycleLength(logs)).toBe(28);
  });
});

describe("averagePeriodLength", () => {
  it("defaults to 5 when nothing has an end date", () => {
    expect(averagePeriodLength([])).toBe(DEFAULT_PERIOD_LENGTH);
    expect(averagePeriodLength([log("2026-01-01")])).toBe(DEFAULT_PERIOD_LENGTH);
  });

  it("counts both end days as part of the period", () => {
    expect(averagePeriodLength([log("2026-01-01", "2026-01-05")])).toBe(5);
  });

  it("averages across logs and skips ones still open", () => {
    const logs = [log("2026-01-01", "2026-01-04"), log("2026-01-29", "2026-02-03"), log("2026-02-27")];
    expect(averagePeriodLength(logs)).toBe(5); // mean of 4 and 6
  });
});

describe("isIrregular", () => {
  it("is false without at least two cycles to compare", () => {
    expect(isIrregular([])).toBe(false);
    expect(isIrregular(sortLogs([log("2026-01-01"), log("2026-01-29")]))).toBe(false);
  });

  it("is false when cycles vary by 7 days or less", () => {
    const logs = sortLogs([log("2026-01-01"), log("2026-01-29"), log("2026-02-21")]); // 28 then 23
    expect(cycleLengths(logs)).toEqual([28, 23]);
    expect(isIrregular(logs)).toBe(false);
  });

  it("is true when cycles vary by more than 7 days", () => {
    const logs = sortLogs([log("2026-01-01"), log("2026-01-29"), log("2026-02-16")]); // 28 then 18
    expect(isIrregular(logs)).toBe(true);
  });
});

describe("phaseFor", () => {
  const window = { periodLength: 5, fertileStartDay: 10, fertileEndDay: 16 };

  it.each([
    [1, "menstrual"],
    [5, "menstrual"],
    [6, "follicular"],
    [9, "follicular"],
    [10, "ovulation"],
    [16, "ovulation"],
    [17, "luteal"],
    [40, "luteal"],
  ])("day %i is %s", (cycleDay, expected) => {
    expect(phaseFor({ cycleDay, ...window })).toBe(expected);
  });
});

describe("buildSummary", () => {
  it("reports hasData false with defaults and no predictions", () => {
    const summary = buildSummary([]);

    expect(summary).toMatchObject({
      hasData: false,
      averageCycleLength: 28,
      averagePeriodLength: 5,
      irregular: false,
      logCount: 0,
      nextPeriodDate: null,
      ovulationDate: null,
      fertileWindow: null,
      phase: null,
    });
    expect(summary.tips).toHaveLength(1);
  });

  it("predicts from a single log using the defaults", () => {
    const summary = buildSummary([log("2026-03-01", "2026-03-05")], toUtcDay("2026-03-03"));

    expect(summary).toMatchObject({
      hasData: true,
      averageCycleLength: 28,
      averagePeriodLength: 5,
      irregular: false,
      logCount: 1,
      lastPeriodStart: "2026-03-01",
      nextPeriodDate: "2026-03-29",
      daysUntilNextPeriod: 26,
      ovulationDate: "2026-03-15",
      currentCycleDay: 3,
      phase: "menstrual",
    });
    expect(summary.fertileWindow).toEqual({ start: "2026-03-10", end: "2026-03-16" });
  });

  it("derives ovulation 14 days before the next period and the fertile window around it", () => {
    const logs = [log("2026-01-01", "2026-01-05"), log("2026-01-29", "2026-02-02")];
    const summary = buildSummary(logs, toUtcDay("2026-02-10"));

    expect(summary.averageCycleLength).toBe(28);
    expect(summary.nextPeriodDate).toBe("2026-02-26");
    expect(summary.ovulationDate).toBe("2026-02-12");
    expect(summary.fertileWindow).toEqual({ start: "2026-02-07", end: "2026-02-13" });
    expect(summary.currentCycleDay).toBe(13);
    expect(summary.phase).toBe("ovulation");
  });

  it("flags irregular cycles and still predicts", () => {
    const logs = [log("2026-01-01"), log("2026-01-29"), log("2026-02-16")];
    const summary = buildSummary(logs, toUtcDay("2026-02-20"));

    expect(summary.irregular).toBe(true);
    expect(summary.averageCycleLength).toBe(23); // mean of 28 and 18
    expect(summary.nextPeriodDate).toBe("2026-03-11");
  });

  it("reports a negative daysUntilNextPeriod when a period is overdue", () => {
    const summary = buildSummary([log("2026-01-01", "2026-01-05")], toUtcDay("2026-02-05"));

    expect(summary.nextPeriodDate).toBe("2026-01-29");
    expect(summary.daysUntilNextPeriod).toBe(-7);
    expect(summary.currentCycleDay).toBe(36);
    expect(summary.phase).toBe("luteal");
  });

  it("is order independent", () => {
    const ascending = [log("2026-01-01"), log("2026-01-29"), log("2026-02-26")];
    const shuffled = [ascending[2], ascending[0], ascending[1]];

    expect(buildSummary(shuffled, toUtcDay("2026-03-01"))).toEqual(
      buildSummary(ascending, toUtcDay("2026-03-01"))
    );
  });

  it("attaches tips for the current phase", () => {
    const summary = buildSummary([log("2026-03-01", "2026-03-05")], toUtcDay("2026-03-02"));

    expect(summary.phase).toBe("menstrual");
    expect(summary.tips.length).toBeGreaterThan(1);
    expect(summary.tips.join(" ")).toContain("cramps");
  });
});
