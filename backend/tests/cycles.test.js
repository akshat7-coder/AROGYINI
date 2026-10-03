import request from "supertest";
import app from "../src/app.js";
import CycleLog from "../src/models/CycleLog.js";
import { createUser, authHeader } from "./helpers.js";
import { addDays, toIsoDate, todayUtc } from "../src/utils/dates.js";

const firstLog = { startDate: "2026-01-01", endDate: "2026-01-05", flow: "medium" };

describe("cycle log CRUD", () => {
  it("requires authentication", async () => {
    expect((await request(app).get("/api/cycles")).status).toBe(401);
    expect((await request(app).get("/api/cycles/summary")).status).toBe(401);
  });

  it("creates a log and normalises the dates to UTC days", async () => {
    const user = await createUser();
    const res = await request(app)
      .post("/api/cycles")
      .set(authHeader(user))
      .send({ ...firstLog, symptoms: ["cramps", "fatigue"], mood: "low", notes: "Heavier than usual" });

    expect(res.status).toBe(201);
    expect(res.body.data.log).toMatchObject({
      startDate: "2026-01-01T00:00:00.000Z",
      endDate: "2026-01-05T00:00:00.000Z",
      flow: "medium",
      symptoms: ["cramps", "fatigue"],
      mood: "low",
    });
  });

  it("accepts a log with no end date yet", async () => {
    const user = await createUser();
    const res = await request(app).post("/api/cycles").set(authHeader(user)).send({ startDate: "2026-01-01" });

    expect(res.status).toBe(201);
    expect(res.body.data.log.endDate).toBeUndefined();
    expect(res.body.data.log.flow).toBe("medium");
  });

  it("lists the caller's logs newest first, paginated", async () => {
    const user = await createUser();
    const other = await createUser();
    await CycleLog.create({ user: other.id, startDate: new Date("2026-02-01") });
    for (const startDate of ["2026-01-01", "2026-01-29", "2026-02-26"]) {
      await request(app).post("/api/cycles").set(authHeader(user)).send({ startDate });
    }

    const res = await request(app).get("/api/cycles?page=1&limit=2").set(authHeader(user));

    expect(res.status).toBe(200);
    expect(res.body.meta).toEqual({ page: 1, limit: 2, total: 3 });
    expect(res.body.data.map((l) => l.startDate.slice(0, 10))).toEqual(["2026-02-26", "2026-01-29"]);
  });

  it("updates a log", async () => {
    const user = await createUser();
    const { body } = await request(app).post("/api/cycles").set(authHeader(user)).send(firstLog);

    const res = await request(app)
      .patch(`/api/cycles/${body.data.log.id}`)
      .set(authHeader(user))
      .send({ flow: "heavy", endDate: "2026-01-07", symptoms: ["backache"] });

    expect(res.status).toBe(200);
    expect(res.body.data.log).toMatchObject({ flow: "heavy", endDate: "2026-01-07T00:00:00.000Z" });
    expect(res.body.data.log.symptoms).toEqual(["backache"]);
  });

  it("deletes a log", async () => {
    const user = await createUser();
    const { body } = await request(app).post("/api/cycles").set(authHeader(user)).send(firstLog);

    const res = await request(app).delete(`/api/cycles/${body.data.log.id}`).set(authHeader(user));

    expect(res.status).toBe(204);
    expect(await CycleLog.countDocuments({ user: user.id })).toBe(0);
  });

  it("rejects an empty update", async () => {
    const user = await createUser();
    const { body } = await request(app).post("/api/cycles").set(authHeader(user)).send(firstLog);

    const res = await request(app).patch(`/api/cycles/${body.data.log.id}`).set(authHeader(user)).send({});

    expect(res.status).toBe(400);
  });
});

describe("cycle log validation", () => {
  it("rejects a start date in the future with 400", async () => {
    const user = await createUser();
    const tomorrow = toIsoDate(addDays(todayUtc(), 1));

    const res = await request(app).post("/api/cycles").set(authHeader(user)).send({ startDate: tomorrow });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("FUTURE_START_DATE");
  });

  it("accepts a start date of today", async () => {
    const user = await createUser();
    const res = await request(app)
      .post("/api/cycles")
      .set(authHeader(user))
      .send({ startDate: toIsoDate(todayUtc()) });

    expect(res.status).toBe(201);
  });

  it("rejects an end date before the start date with 400", async () => {
    const user = await createUser();
    const res = await request(app)
      .post("/api/cycles")
      .set(authHeader(user))
      .send({ startDate: "2026-01-05", endDate: "2026-01-01" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_DATE_RANGE");
  });

  it("rejects an unparseable date and an unknown flow with 400", async () => {
    const user = await createUser();

    const badDate = await request(app).post("/api/cycles").set(authHeader(user)).send({ startDate: "last tuesday" });
    expect(badDate.status).toBe(400);
    expect(badDate.body.error.code).toBe("VALIDATION_ERROR");

    const badFlow = await request(app)
      .post("/api/cycles")
      .set(authHeader(user))
      .send({ startDate: "2026-01-01", flow: "torrential" });
    expect(badFlow.status).toBe(400);
  });

  it("catches a cross-field problem introduced by a PATCH", async () => {
    const user = await createUser();
    const { body } = await request(app).post("/api/cycles").set(authHeader(user)).send(firstLog);

    const res = await request(app)
      .patch(`/api/cycles/${body.data.log.id}`)
      .set(authHeader(user))
      .send({ endDate: "2025-12-20" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_DATE_RANGE");
  });
});

describe("overlap rules", () => {
  it("rejects a log overlapping an existing range with 409", async () => {
    const user = await createUser();
    await request(app).post("/api/cycles").set(authHeader(user)).send(firstLog);

    const res = await request(app)
      .post("/api/cycles")
      .set(authHeader(user))
      .send({ startDate: "2026-01-03", endDate: "2026-01-07" });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("CYCLE_OVERLAP");
  });

  it("rejects a duplicate start date", async () => {
    const user = await createUser();
    await request(app).post("/api/cycles").set(authHeader(user)).send(firstLog);

    const res = await request(app).post("/api/cycles").set(authHeader(user)).send({ startDate: "2026-01-01" });

    expect(res.status).toBe(409);
  });

  it("rejects a log that fully contains an existing one", async () => {
    const user = await createUser();
    await request(app).post("/api/cycles").set(authHeader(user)).send(firstLog);

    const res = await request(app)
      .post("/api/cycles")
      .set(authHeader(user))
      .send({ startDate: "2025-12-28", endDate: "2026-01-10" });

    expect(res.status).toBe(409);
  });

  it("allows adjacent, non-overlapping logs", async () => {
    const user = await createUser();
    await request(app).post("/api/cycles").set(authHeader(user)).send(firstLog);

    const res = await request(app)
      .post("/api/cycles")
      .set(authHeader(user))
      .send({ startDate: "2026-01-06", endDate: "2026-01-10" });

    expect(res.status).toBe(201);
  });

  it("does not treat another user's log as an overlap", async () => {
    const user = await createUser();
    const other = await createUser();
    await request(app).post("/api/cycles").set(authHeader(other)).send(firstLog);

    const res = await request(app).post("/api/cycles").set(authHeader(user)).send(firstLog);

    expect(res.status).toBe(201);
  });

  it("does not count the log being edited as its own overlap", async () => {
    const user = await createUser();
    const { body } = await request(app).post("/api/cycles").set(authHeader(user)).send(firstLog);

    const res = await request(app)
      .patch(`/api/cycles/${body.data.log.id}`)
      .set(authHeader(user))
      .send({ endDate: "2026-01-06" });

    expect(res.status).toBe(200);
  });

  it("rejects a PATCH that would collide with a different log", async () => {
    const user = await createUser();
    await request(app).post("/api/cycles").set(authHeader(user)).send(firstLog);
    const second = await request(app)
      .post("/api/cycles")
      .set(authHeader(user))
      .send({ startDate: "2026-01-29", endDate: "2026-02-02" });

    const res = await request(app)
      .patch(`/api/cycles/${second.body.data.log.id}`)
      .set(authHeader(user))
      .send({ startDate: "2026-01-04" });

    expect(res.status).toBe(409);
  });
});

describe("ownership", () => {
  it("returns 404 when patching or deleting another user's log", async () => {
    const owner = await createUser();
    const intruder = await createUser();
    const { body } = await request(app).post("/api/cycles").set(authHeader(owner)).send(firstLog);
    const id = body.data.log.id;

    expect((await request(app).patch(`/api/cycles/${id}`).set(authHeader(intruder)).send({ flow: "light" })).status).toBe(404);
    expect((await request(app).delete(`/api/cycles/${id}`).set(authHeader(intruder))).status).toBe(404);
    expect((await CycleLog.findById(id)).flow).toBe("medium");
  });

  it("keeps summaries separate per user", async () => {
    const user = await createUser();
    const other = await createUser();
    await request(app).post("/api/cycles").set(authHeader(user)).send(firstLog);

    const mine = await request(app).get("/api/cycles/summary").set(authHeader(user));
    const theirs = await request(app).get("/api/cycles/summary").set(authHeader(other));

    expect(mine.body.data.hasData).toBe(true);
    expect(theirs.body.data.hasData).toBe(false);
  });
});

describe("GET /api/cycles/summary", () => {
  it("returns defaults with hasData false when there are no logs", async () => {
    const user = await createUser();
    const res = await request(app).get("/api/cycles/summary").set(authHeader(user));

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      hasData: false,
      averageCycleLength: 28,
      averagePeriodLength: 5,
      irregular: false,
      nextPeriodDate: null,
      phase: null,
    });
  });

  it("computes a full summary from three logs", async () => {
    const user = await createUser();
    for (const log of [
      { startDate: "2026-01-01", endDate: "2026-01-05" },
      { startDate: "2026-01-29", endDate: "2026-02-02" },
      { startDate: "2026-02-26", endDate: "2026-03-02" },
    ]) {
      expect((await request(app).post("/api/cycles").set(authHeader(user)).send(log)).status).toBe(201);
    }

    const res = await request(app).get("/api/cycles/summary").set(authHeader(user));

    expect(res.body.data).toMatchObject({
      hasData: true,
      logCount: 3,
      averageCycleLength: 28,
      averagePeriodLength: 5,
      irregular: false,
      lastPeriodStart: "2026-02-26",
      nextPeriodDate: "2026-03-26",
      ovulationDate: "2026-03-12",
    });
    expect(res.body.data.fertileWindow).toEqual({ start: "2026-03-07", end: "2026-03-13" });
    expect(res.body.data.tips.length).toBeGreaterThan(0);
    expect(["menstrual", "follicular", "ovulation", "luteal"]).toContain(res.body.data.phase);
  });

  it("flags irregular cycles", async () => {
    const user = await createUser();
    for (const startDate of ["2026-01-01", "2026-01-29", "2026-02-16"]) {
      await request(app).post("/api/cycles").set(authHeader(user)).send({ startDate });
    }

    const res = await request(app).get("/api/cycles/summary").set(authHeader(user));

    expect(res.body.data.irregular).toBe(true);
    expect(res.body.data.averageCycleLength).toBe(23);
  });
});
