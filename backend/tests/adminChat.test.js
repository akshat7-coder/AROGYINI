import { jest } from "@jest/globals";
import axios from "axios";
import request from "supertest";
import app from "../src/app.js";
import Message from "../src/models/Message.js";
import ChatIssue from "../src/models/ChatIssue.js";
import BotConfig from "../src/models/BotConfig.js";
import { env } from "../src/config/env.js";
import { createUser, createAdmin, authHeader } from "./helpers.js";

const realAdapter = axios.defaults.adapter;

function stubAxios(reply) {
  const adapter = jest.fn(async (config) => {
    const payload = await reply(config);
    if (payload instanceof Error) throw payload;
    return { data: payload, status: 200, statusText: "OK", headers: {}, config };
  });
  axios.defaults.adapter = adapter;
  return adapter;
}

const botAnswer = (answer) => () => ({ answer });

afterEach(() => {
  axios.defaults.adapter = realAdapter;
});

// Produces a conversation whose assistant message failed, plus its open issue.
async function withFailedMessage() {
  const user = await createUser();
  const { body: convo } = await request(app).post("/api/chat/conversations").set(authHeader(user)).send({});
  const conversationId = convo.data.conversation.id;

  stubAxios(() => new axios.AxiosError("upstream exploded", "ERR_BAD_RESPONSE"));
  const { body } = await request(app)
    .post(`/api/chat/conversations/${conversationId}/messages`)
    .set(authHeader(user))
    .send({ content: "my period is late and I have cramps" });

  const issue = await ChatIssue.findOne({ message: body.data.message.id });
  return { user, conversationId, message: body.data.message, issue };
}

describe("RBAC on admin chat routes", () => {
  it("returns 401 without a token", async () => {
    expect((await request(app).get("/api/admin/chat/issues")).status).toBe(401);
    expect((await request(app).get("/api/admin/chat/bots")).status).toBe(401);
  });

  it("returns 403 for a normal user on every admin chat route", async () => {
    const { user, issue } = await withFailedMessage();
    const header = authHeader(user);

    const calls = [
      request(app).get("/api/admin/chat/issues").set(header),
      request(app).patch(`/api/admin/chat/issues/${issue.id}`).set(header).send({ status: "resolved" }),
      request(app).post(`/api/admin/chat/issues/${issue.id}/retry`).set(header),
      request(app).get("/api/admin/chat/bots").set(header),
      request(app).patch("/api/admin/chat/bots/medical").set(header).send({ enabled: false }),
      request(app).post("/api/admin/chat/bots/medical/test").set(header),
    ];
    for (const res of await Promise.all(calls)) expect(res.status).toBe(403);

    expect((await ChatIssue.findById(issue.id)).status).toBe("open");
  });
});

describe("GET /api/admin/chat/issues", () => {
  it("lists issues with the user, message and conversation populated", async () => {
    const admin = await createAdmin();
    await withFailedMessage();

    const res = await request(app).get("/api/admin/chat/issues").set(authHeader(admin));

    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(1);
    const [issue] = res.body.data;
    expect(issue.user).toMatchObject({ name: expect.any(String), email: expect.any(String) });
    expect(issue.user).not.toHaveProperty("passwordHash");
    expect(issue.message).toMatchObject({ role: "assistant", status: "failed" });
    expect(issue.conversation).toHaveProperty("title");
  });

  it("filters by status and type", async () => {
    const admin = await createAdmin();
    const { user, message } = await withFailedMessage();
    await request(app)
      .post(`/api/chat/messages/${message.id}/report`)
      .set(authHeader(user))
      .send({ reason: "The answer was unhelpful." });

    const all = await request(app).get("/api/admin/chat/issues").set(authHeader(admin));
    expect(all.body.meta.total).toBe(2);

    const reports = await request(app).get("/api/admin/chat/issues?type=user_report").set(authHeader(admin));
    expect(reports.body.meta.total).toBe(1);

    const errors = await request(app).get("/api/admin/chat/issues?type=provider_error").set(authHeader(admin));
    expect(errors.body.meta.total).toBe(1);

    const open = await request(app).get("/api/admin/chat/issues?status=open").set(authHeader(admin));
    expect(open.body.meta.total).toBe(2);

    const resolved = await request(app).get("/api/admin/chat/issues?status=resolved").set(authHeader(admin));
    expect(resolved.body.meta.total).toBe(0);
  });

  it("rejects an unknown filter value", async () => {
    const admin = await createAdmin();
    expect((await request(app).get("/api/admin/chat/issues?status=pending").set(authHeader(admin))).status).toBe(400);
    expect((await request(app).get("/api/admin/chat/issues?type=whatever").set(authHeader(admin))).status).toBe(400);
  });
});

describe("PATCH /api/admin/chat/issues/:id", () => {
  it("sets the status with a note, stamping who resolved it", async () => {
    const admin = await createAdmin();
    const { issue } = await withFailedMessage();

    const progress = await request(app)
      .patch(`/api/admin/chat/issues/${issue.id}`)
      .set(authHeader(admin))
      .send({ status: "in_progress", adminNote: "Chasing the bot owner." });
    expect(progress.status).toBe(200);
    expect(progress.body.data.issue).toMatchObject({ status: "in_progress", adminNote: "Chasing the bot owner." });
    expect(progress.body.data.issue.resolvedAt).toBeUndefined();

    const resolved = await request(app)
      .patch(`/api/admin/chat/issues/${issue.id}`)
      .set(authHeader(admin))
      .send({ status: "resolved", adminNote: "Bot was restarted." });
    expect(resolved.body.data.issue.status).toBe("resolved");
    expect(resolved.body.data.issue.resolvedBy).toBe(admin.id);
    expect(resolved.body.data.issue.resolvedAt).toEqual(expect.any(String));
  });

  it("rejects an empty body, a bad status and an unknown id", async () => {
    const admin = await createAdmin();
    const { issue } = await withFailedMessage();

    expect((await request(app).patch(`/api/admin/chat/issues/${issue.id}`).set(authHeader(admin)).send({})).status).toBe(400);
    expect(
      (await request(app).patch(`/api/admin/chat/issues/${issue.id}`).set(authHeader(admin)).send({ status: "done" })).status
    ).toBe(400);
    expect(
      (await request(app)
        .patch("/api/admin/chat/issues/64b7f0000000000000000000")
        .set(authHeader(admin))
        .send({ status: "resolved" })).status
    ).toBe(404);
  });
});

describe("POST /api/admin/chat/issues/:id/retry", () => {
  it("re-calls the provider, replaces the content and resolves the issue", async () => {
    const admin = await createAdmin();
    const { issue, message } = await withFailedMessage();

    const adapter = stubAxios(botAnswer("A proper answer on the second attempt."));
    const res = await request(app).post(`/api/admin/chat/issues/${issue.id}/retry`).set(authHeader(admin));

    expect(res.status).toBe(200);
    expect(res.body.data.message).toMatchObject({ status: "ok", bot: "medical" });
    expect(res.body.data.message.content).toBe("A proper answer on the second attempt.");
    expect(res.body.data.issue).toMatchObject({ status: "resolved" });
    expect(res.body.data.issue.resolvedBy).toBe(admin.id);

    // the stored message is replaced, not duplicated
    const stored = await Message.findById(message.id);
    expect(stored.content).toBe("A proper answer on the second attempt.");
    expect(stored.status).toBe("ok");
    expect(await Message.countDocuments({ conversation: stored.conversation })).toBe(2);

    // it re-asked the original question
    expect(JSON.parse(adapter.mock.calls[0][0].data)).toEqual({
      question: "my period is late and I have cramps",
    });
  });

  it("lets the user see the repaired answer", async () => {
    const admin = await createAdmin();
    const { user, conversationId, issue } = await withFailedMessage();

    stubAxios(botAnswer("Repaired answer."));
    await request(app).post(`/api/admin/chat/issues/${issue.id}/retry`).set(authHeader(admin));

    const res = await request(app).get(`/api/chat/conversations/${conversationId}`).set(authHeader(user));
    expect(res.body.data.messages[1].content).toBe("Repaired answer.");
    expect(res.body.data.messages[1].status).toBe("ok");
  });

  it("returns 502 and leaves the issue open when the retry also fails", async () => {
    const admin = await createAdmin();
    const { issue } = await withFailedMessage();

    stubAxios(() => new axios.AxiosError("still down", "ERR_BAD_RESPONSE"));
    const res = await request(app).post(`/api/admin/chat/issues/${issue.id}/retry`).set(authHeader(admin));

    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe("RETRY_FAILED");
    expect((await ChatIssue.findById(issue.id)).status).toBe("open");
  });

  it("returns 404 for an unknown issue and when the message is gone", async () => {
    const admin = await createAdmin();
    const { issue, message } = await withFailedMessage();

    expect(
      (await request(app).post("/api/admin/chat/issues/64b7f0000000000000000000/retry").set(authHeader(admin))).status
    ).toBe(404);

    await Message.deleteOne({ _id: message.id });
    expect((await request(app).post(`/api/admin/chat/issues/${issue.id}/retry`).set(authHeader(admin))).status).toBe(404);
  });
});

describe("admin bot configuration", () => {
  it("lists all three bots, showing whether each comes from env or the database", async () => {
    const admin = await createAdmin();
    await BotConfig.create({ key: "legal", name: "Legal assistant", url: "http://127.0.0.1:8002", enabled: false });

    const res = await request(app).get("/api/admin/chat/bots").set(authHeader(admin));

    expect(res.status).toBe(200);
    expect(res.body.data.bots.map((b) => b.key)).toEqual(["medical", "legal", "general"]);
    const byKey = Object.fromEntries(res.body.data.bots.map((b) => [b.key, b]));
    expect(byKey.legal).toMatchObject({ source: "database", enabled: false });
    expect(byKey.medical).toMatchObject({ source: "env", enabled: true, url: env.MEDICAL_BOT_URL });
  });

  it("creates the config row on first edit and updates it after", async () => {
    const admin = await createAdmin();

    const first = await request(app)
      .patch("/api/admin/chat/bots/medical")
      .set(authHeader(admin))
      .send({ url: "http://127.0.0.1:5001", timeoutMs: 8000 });
    expect(first.status).toBe(200);
    expect(first.body.data.bot).toMatchObject({ key: "medical", url: "http://127.0.0.1:5001", timeoutMs: 8000 });

    const second = await request(app)
      .patch("/api/admin/chat/bots/medical")
      .set(authHeader(admin))
      .send({ enabled: false });
    expect(second.body.data.bot).toMatchObject({ enabled: false, url: "http://127.0.0.1:5001" });
    expect(await BotConfig.countDocuments({ key: "medical" })).toBe(1);
  });

  it("validates the key and the payload", async () => {
    const admin = await createAdmin();

    expect((await request(app).patch("/api/admin/chat/bots/oracle").set(authHeader(admin)).send({ enabled: false })).status).toBe(400);
    expect((await request(app).patch("/api/admin/chat/bots/medical").set(authHeader(admin)).send({})).status).toBe(400);
    expect(
      (await request(app).patch("/api/admin/chat/bots/medical").set(authHeader(admin)).send({ url: "nope" })).status
    ).toBe(400);
    expect(
      (await request(app).patch("/api/admin/chat/bots/medical").set(authHeader(admin)).send({ timeoutMs: 10 })).status
    ).toBe(400);
  });

  it("pings a RAG bot and reports ok with a latency", async () => {
    const admin = await createAdmin();
    const adapter = stubAxios(botAnswer("pong from the medical bot"));

    const res = await request(app).post("/api/admin/chat/bots/medical/test").set(authHeader(admin));

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ key: "medical", ok: true, url: env.MEDICAL_BOT_URL });
    expect(typeof res.body.data.latencyMs).toBe("number");
    expect(res.body.data.preview).toContain("pong");
    expect(JSON.parse(adapter.mock.calls[0][0].data)).toEqual({ question: "ping" });
  });

  it("reports ok false with the error when the bot is unreachable", async () => {
    const admin = await createAdmin();
    stubAxios(() => new axios.AxiosError("connect ECONNREFUSED 127.0.0.1:5000", "ECONNREFUSED"));

    const res = await request(app).post("/api/admin/chat/bots/medical/test").set(authHeader(admin));

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ key: "medical", ok: false });
    expect(res.body.data.error).toContain("ECONNREFUSED");
  });

  it("explains that the general bot has no API key configured", async () => {
    const admin = await createAdmin();

    const res = await request(app).post("/api/admin/chat/bots/general/test").set(authHeader(admin));

    expect(res.body.data).toMatchObject({ key: "general", ok: false });
    expect(res.body.data.error).toContain("LLM_API_KEY");
  });

  it("tests the general bot against the LLM when a key is set", async () => {
    const admin = await createAdmin();
    const adapter = stubAxios(() => ({ choices: [{ message: { content: "pong" } }] }));
    const originalKey = env.LLM_API_KEY;
    env.LLM_API_KEY = "test-key";

    try {
      const res = await request(app).post("/api/admin/chat/bots/general/test").set(authHeader(admin));

      expect(res.body.data).toMatchObject({ key: "general", ok: true });
      expect(adapter.mock.calls[0][0].url).toBe(`${env.LLM_API_URL}/chat/completions`);
    } finally {
      env.LLM_API_KEY = originalKey;
    }
  });

  it("uses an admin-edited URL for the test ping", async () => {
    const admin = await createAdmin();
    await request(app)
      .patch("/api/admin/chat/bots/legal")
      .set(authHeader(admin))
      .send({ url: "http://127.0.0.1:9100" });
    const adapter = stubAxios(botAnswer("pong"));

    await request(app).post("/api/admin/chat/bots/legal/test").set(authHeader(admin));

    expect(adapter.mock.calls[0][0].url).toBe("http://127.0.0.1:9100/ask");
  });
});

describe("GET /api/admin/stats", () => {
  it("counts open chat issues", async () => {
    const admin = await createAdmin();
    const { issue } = await withFailedMessage();

    const before = await request(app).get("/api/admin/stats").set(authHeader(admin));
    expect(before.body.data.openIssues).toBe(1);

    await request(app).patch(`/api/admin/chat/issues/${issue.id}`).set(authHeader(admin)).send({ status: "resolved" });

    const after = await request(app).get("/api/admin/stats").set(authHeader(admin));
    expect(after.body.data.openIssues).toBe(0);
  });
});
