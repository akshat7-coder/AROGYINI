import request from "supertest";
import app from "../src/app.js";
import EmergencyContact from "../src/models/EmergencyContact.js";
import SosEvent from "../src/models/SosEvent.js";
import { getSentMessages, clearSentMessages, providerName } from "../src/services/sms/index.js";
import { ALWAYS_FAILS } from "../src/services/sms/memoryProvider.js";
import { createUser, createAdmin, authHeader } from "./helpers.js";

const location = { latitude: 18.5204, longitude: 73.8567, accuracy: 12 };

async function withContacts(count = 3) {
  const user = await createUser({ name: "Asha Rao" });
  await EmergencyContact.insertMany(
    Array.from({ length: count }, (_, i) => ({
      user: user.id,
      name: `Contact ${i}`,
      phone: `+919000000${String(i).padStart(3, "0")}`,
      priority: i + 1,
    }))
  );
  return user;
}

beforeEach(() => clearSentMessages());

describe("sms provider wiring", () => {
  it("uses the in-memory provider under NODE_ENV=test", () => {
    expect(providerName).toBe("memory");
  });
});

// The web client sends Content-Type: application/json on bodyless PATCHes. A zero-length
// payload must be treated as {}, not rejected as invalid JSON.
describe("bodyless requests from the web client", () => {
  it("resolves with an empty JSON object body", async () => {
    const user = await withContacts(1);
    const { body } = await request(app).post("/api/sos").set(authHeader(user)).send(location);

    const res = await request(app)
      .patch(`/api/sos/${body.data.event.id}/resolve?notify=true`)
      .set(authHeader(user))
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.data.event.status).toBe("resolved");
  });

  it("cancels with no body at all but a JSON content type", async () => {
    const user = await withContacts(1);
    const { body } = await request(app).post("/api/sos").set(authHeader(user)).send(location);

    const res = await request(app)
      .patch(`/api/sos/${body.data.event.id}/cancel`)
      .set(authHeader(user))
      .set("Content-Type", "application/json")
      .set("Content-Length", "0")
      .send();

    expect(res.status).toBe(200);
    expect(res.body.data.event.status).toBe("cancelled");
  });

  it("still rejects a body that really is malformed JSON", async () => {
    const user = await createUser();
    const res = await request(app)
      .patch("/api/cycles/64b7f0000000000000000000")
      .set(authHeader(user))
      .set("Content-Type", "application/json")
      .send("{ not json");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_JSON");
  });
});

// Every SOS route must be behind authenticate. A commit once dropped `router.use(authenticate)`
// from the router, which left all of these open and crashed the per-user rate limiter.
describe("SOS routes reject unauthenticated callers", () => {
  const id = "64b7f0000000000000000000";

  it.each([
    ["post", "/api/sos"],
    ["get", "/api/sos"],
    ["get", `/api/sos/${id}`],
    ["patch", `/api/sos/${id}/resolve`],
    ["patch", `/api/sos/${id}/cancel`],
  ])("%s %s returns 401 without a token", async (method, path) => {
    expect((await request(app)[method](path).send({})).status).toBe(401);
  });
});

describe("POST /api/sos", () => {
  it("requires authentication", async () => {
    expect((await request(app).post("/api/sos").send(location)).status).toBe(401);
  });

  it("refuses to trigger with no emergency contacts", async () => {
    const user = await createUser();
    const res = await request(app).post("/api/sos").set(authHeader(user)).send(location);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("NO_CONTACTS");
    expect(getSentMessages()).toHaveLength(0);
  });

  it("sends exactly one SMS per contact, with the maps link and IST time", async () => {
    const user = await withContacts(3);
    const res = await request(app).post("/api/sos").set(authHeader(user)).send(location);

    expect(res.status).toBe(201);
    expect(res.body.data.event.mapsUrl).toBe("https://maps.google.com/?q=18.5204,73.8567");
    expect(res.body.data.event.status).toBe("active");

    const messages = getSentMessages();
    expect(messages).toHaveLength(3);
    expect(messages.map((m) => m.to).sort()).toEqual(["+919000000000", "+919000000001", "+919000000002"]);
    expect(messages[0].body).toContain("EMERGENCY: Asha Rao needs help.");
    expect(messages[0].body).toContain("https://maps.google.com/?q=18.5204,73.8567");
    expect(messages[0].body).toMatch(/Call 112\.$/);
  });

  it("records a sent notification per contact with the provider sid", async () => {
    const user = await withContacts(2);
    const res = await request(app).post("/api/sos").set(authHeader(user)).send(location);

    expect(res.body.data.event.notifications).toHaveLength(2);
    for (const notification of res.body.data.event.notifications) {
      expect(notification.status).toBe("sent");
      expect(notification.providerSid).toEqual(expect.any(String));
    }
  });

  it("appends an optional message", async () => {
    const user = await withContacts(1);
    await request(app).post("/api/sos").set(authHeader(user)).send({ ...location, message: "Near the bus stand" });

    expect(getSentMessages()[0].body).toContain("Note: Near the bus stand");
  });

  it("returns the existing active event on a second trigger without resending", async () => {
    const user = await withContacts(2);
    const first = await request(app).post("/api/sos").set(authHeader(user)).send(location);
    const second = await request(app).post("/api/sos").set(authHeader(user)).send(location);

    expect(second.status).toBe(200);
    expect(second.body.data.alreadyActive).toBe(true);
    expect(second.body.data.event.id).toBe(first.body.data.event.id);
    expect(getSentMessages()).toHaveLength(2);
    expect(await SosEvent.countDocuments({ user: user.id })).toBe(1);
  });

  it("rejects an out-of-range latitude", async () => {
    const user = await withContacts(1);
    const res = await request(app).post("/api/sos").set(authHeader(user)).send({ ...location, latitude: 120 });

    expect(res.status).toBe(400);
  });

  it("records one contact as failed without stopping the others", async () => {
    const user = await createUser({ name: "Asha Rao" });
    await EmergencyContact.insertMany([
      { user: user.id, name: "Broken", phone: ALWAYS_FAILS, priority: 1 },
      { user: user.id, name: "Maa", phone: "+919000000001", priority: 2 },
    ]);

    const res = await request(app).post("/api/sos").set(authHeader(user)).send(location);

    expect(res.status).toBe(201);
    const { notifications } = res.body.data.event;
    expect(notifications.map((n) => n.status)).toEqual(["failed", "sent"]);
    expect(notifications[0].error).toContain("Invalid recipient");
    expect(notifications[1].providerSid).toEqual(expect.any(String));
    // the healthy contact still received its message
    expect(getSentMessages().map((m) => m.to)).toEqual(["+919000000001"]);
  });
});

describe("SOS history and ownership", () => {
  it("lists only the caller's events, paginated", async () => {
    const user = await withContacts(1);
    const other = await withContacts(1);
    await request(app).post("/api/sos").set(authHeader(user)).send(location);
    await request(app).post("/api/sos").set(authHeader(other)).send(location);

    const res = await request(app).get("/api/sos?page=1&limit=10").set(authHeader(user));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta).toEqual({ page: 1, limit: 10, total: 1 });
  });

  it("returns 404 for another user's event", async () => {
    const owner = await withContacts(1);
    const intruder = await createUser();
    const { body } = await request(app).post("/api/sos").set(authHeader(owner)).send(location);

    const res = await request(app).get(`/api/sos/${body.data.event.id}`).set(authHeader(intruder));

    expect(res.status).toBe(404);
  });

  it("cannot resolve another user's event", async () => {
    const owner = await withContacts(1);
    const intruder = await createUser();
    const { body } = await request(app).post("/api/sos").set(authHeader(owner)).send(location);

    const res = await request(app).patch(`/api/sos/${body.data.event.id}/resolve`).set(authHeader(intruder));

    expect(res.status).toBe(404);
    expect((await SosEvent.findById(body.data.event.id)).status).toBe("active");
  });
});

describe("resolve and cancel", () => {
  it("resolves an active event and stamps resolvedAt", async () => {
    const user = await withContacts(1);
    const { body } = await request(app).post("/api/sos").set(authHeader(user)).send(location);

    const res = await request(app).patch(`/api/sos/${body.data.event.id}/resolve`).set(authHeader(user));

    expect(res.status).toBe(200);
    expect(res.body.data.event.status).toBe("resolved");
    expect(res.body.data.event.resolvedAt).toEqual(expect.any(String));
  });

  it("sends a safe-now SMS to every contact only when notify=true", async () => {
    const user = await withContacts(2);
    const { body } = await request(app).post("/api/sos").set(authHeader(user)).send(location);
    clearSentMessages();

    await request(app).patch(`/api/sos/${body.data.event.id}/resolve?notify=true`).set(authHeader(user));

    const messages = getSentMessages();
    expect(messages).toHaveLength(2);
    expect(messages[0].body).toContain("Asha Rao is safe now");
  });

  it("does not notify by default", async () => {
    const user = await withContacts(2);
    const { body } = await request(app).post("/api/sos").set(authHeader(user)).send(location);
    clearSentMessages();

    await request(app).patch(`/api/sos/${body.data.event.id}/resolve`).set(authHeader(user));

    expect(getSentMessages()).toHaveLength(0);
  });

  it("cancels an active event", async () => {
    const user = await withContacts(1);
    const { body } = await request(app).post("/api/sos").set(authHeader(user)).send(location);

    const res = await request(app).patch(`/api/sos/${body.data.event.id}/cancel`).set(authHeader(user));

    expect(res.status).toBe(200);
    expect(res.body.data.event.status).toBe("cancelled");
  });

  it("returns 404 when resolving an already resolved event", async () => {
    const user = await withContacts(1);
    const { body } = await request(app).post("/api/sos").set(authHeader(user)).send(location);
    await request(app).patch(`/api/sos/${body.data.event.id}/resolve`).set(authHeader(user));

    const again = await request(app).patch(`/api/sos/${body.data.event.id}/resolve`).set(authHeader(user));

    expect(again.status).toBe(404);
  });

  it("lets a new SOS be triggered once the previous one is closed", async () => {
    const user = await withContacts(1);
    const first = await request(app).post("/api/sos").set(authHeader(user)).send(location);
    await request(app).patch(`/api/sos/${first.body.data.event.id}/cancel`).set(authHeader(user));

    const second = await request(app).post("/api/sos").set(authHeader(user)).send(location);

    expect(second.status).toBe(201);
    expect(second.body.data.event.id).not.toBe(first.body.data.event.id);
  });
});

describe("admin SOS oversight", () => {
  it("is forbidden for a normal user", async () => {
    const user = await createUser();
    expect((await request(app).get("/api/admin/sos").set(authHeader(user))).status).toBe(403);
  });

  it("lists every user's events with the user populated, filterable by status", async () => {
    const admin = await createAdmin();
    const a = await withContacts(1);
    const b = await withContacts(1);
    const eventA = await request(app).post("/api/sos").set(authHeader(a)).send(location);
    await request(app).post("/api/sos").set(authHeader(b)).send(location);
    await request(app).patch(`/api/sos/${eventA.body.data.event.id}/cancel`).set(authHeader(a));

    const all = await request(app).get("/api/admin/sos").set(authHeader(admin));
    expect(all.status).toBe(200);
    expect(all.body.meta.total).toBe(2);
    expect(all.body.data[0].user).toMatchObject({ name: expect.any(String) });

    const active = await request(app).get("/api/admin/sos?status=active").set(authHeader(admin));
    expect(active.body.meta.total).toBe(1);
  });

  it("resolves any user's event", async () => {
    const admin = await createAdmin();
    const user = await withContacts(1);
    const { body } = await request(app).post("/api/sos").set(authHeader(user)).send(location);

    const res = await request(app).patch(`/api/admin/sos/${body.data.event.id}/resolve`).set(authHeader(admin));

    expect(res.status).toBe(200);
    expect(res.body.data.event.status).toBe("resolved");
  });

  it("counts active SOS events in /api/admin/stats", async () => {
    const admin = await createAdmin();
    const user = await withContacts(1);
    await request(app).post("/api/sos").set(authHeader(user)).send(location);

    const res = await request(app).get("/api/admin/stats").set(authHeader(admin));

    expect(res.body.data.activeSos).toBe(1);
  });
});

describe("GET /api/safety/helplines", () => {
  it("is public and includes the core India numbers", async () => {
    const res = await request(app).get("/api/safety/helplines");

    expect(res.status).toBe(200);
    const numbers = res.body.data.helplines.map((h) => h.number);
    expect(numbers).toEqual(
      expect.arrayContaining(["112", "181", "1091", "1930", "15100", "7827170170", "108", "1800-599-0019"])
    );
  });
});
