import { jest } from "@jest/globals";
import axios from "axios";
import request from "supertest";
import app from "../src/app.js";
import Conversation from "../src/models/Conversation.js";
import Message from "../src/models/Message.js";
import ChatIssue from "../src/models/ChatIssue.js";
import BotConfig from "../src/models/BotConfig.js";
import { env } from "../src/config/env.js";
import { detect, routeToBot } from "../src/services/chat/intentService.js";
import { createUser, authHeader } from "./helpers.js";

const realAdapter = axios.defaults.adapter;

// Stub adapter: records every request and replies with whatever `reply` produces.
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
const llmAnswer = (content) => () => ({ choices: [{ message: { content } }] });

async function startConversation(user) {
  const res = await request(app).post("/api/chat/conversations").set(authHeader(user)).send({});
  return res.body.data.conversation;
}

const send = (user, conversationId, body) =>
  request(app).post(`/api/chat/conversations/${conversationId}/messages`).set(authHeader(user)).send(body);

afterEach(() => {
  axios.defaults.adapter = realAdapter;
});

describe("intentService", () => {
  it.each([
    ["my period is late and I have cramps", "health"],
    ["mujhe mahavari me dard hai", "health"],
    ["how do I file an FIR against my husband for dowry", "legal"],
    ["dahej ke liye shikayat kaise karu", "legal"],
    ["looking for a returnship after a career break", "career"],
    ["someone is following me home every evening", "safety"],
    ["what is the weather like today", "general"],
  ])("routes %s to %s", (content, expected) => {
    expect(detect(content).intent).toBe(expected);
  });

  // The indexed reference is a general medical encyclopedia, so clinical terms outside the
  // women's-health keyword list must still reach the medical bot, not the general fallback.
  it.each([
    ["Acute poststreptococcal glomerulonephritis", "medical"],
    ["thrombosis", "medical"],
    ["appendectomy", "medical"],
    ["neuropathy in my feet", "medical"],
    ["what is diabetes", "medical"],
    ["I have a bad headache and fever", "medical"],
    ["what is PCOD", "medical"],
  ])("sends the clinical question %s to the medical bot", (content, expected) => {
    expect(routeToBot(detect(content).intent)).toBe(expected);
  });

  it.each([
    ["which returnship programmes take women in tech", "career"],
    ["how do I file a POSH complaint at work", "legal"],
    ["someone is following me home right now", "safety"],
    ["what is the weather today", "general"],
  ])("still routes %s to %s", (content, expected) => {
    expect(detect(content).intent).toBe(expected);
  });

  it.each([
    ["bachao koi mera peecha kar raha hai", true],
    ["madad karo please", true],
    ["help me I am being followed", true],
    ["I was attacked near the bus stand", true],
    ["what are my maternity leave rights", false],
    ["my period is late", false],
  ])("flags emergency in %s as %s", (content, expected) => {
    expect(detect(content).emergency).toBe(expected);
  });

  it("maps intents to bots, and an explicit bot overrides", () => {
    expect(routeToBot("health")).toBe("medical");
    expect(routeToBot("legal")).toBe("legal");
    expect(routeToBot("career")).toBe("general");
    expect(routeToBot("safety")).toBe("general");
    expect(routeToBot("general")).toBe("general");
    expect(routeToBot("health", "legal")).toBe("legal");
  });
});

describe("conversations", () => {
  it("requires authentication everywhere", async () => {
    expect((await request(app).get("/api/chat/bots")).status).toBe(401);
    expect((await request(app).get("/api/chat/conversations")).status).toBe(401);
    expect((await request(app).post("/api/chat/conversations").send({})).status).toBe(401);
  });

  it("creates and lists conversations, newest activity first", async () => {
    const user = await createUser();
    const first = await startConversation(user);
    const second = await startConversation(user);
    await Conversation.updateOne({ _id: first.id }, { lastMessageAt: new Date(Date.now() + 1000) });

    const res = await request(app).get("/api/chat/conversations").set(authHeader(user));

    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(2);
    expect(res.body.data.map((c) => c.id)).toEqual([first.id, second.id]);
    expect(second.title).toBe("New conversation");
  });

  it("titles the conversation from the first message, capped at 60 characters", async () => {
    stubAxios(botAnswer("Cycles vary."));
    const user = await createUser();
    const conversation = await startConversation(user);
    const question = "My period is late by two weeks and I am worried about what that could mean for me";

    const res = await send(user, conversation.id, { content: question });

    expect(res.status).toBe(201);
    expect(res.body.data.conversation.title).toBe(question.slice(0, 60));
    expect(res.body.data.conversation.title.length).toBe(60);
  });

  it("returns a conversation with its messages in order", async () => {
    stubAxios(botAnswer("An answer."));
    const user = await createUser();
    const conversation = await startConversation(user);
    await send(user, conversation.id, { content: "my period is late" });

    const res = await request(app).get(`/api/chat/conversations/${conversation.id}`).set(authHeader(user));

    expect(res.status).toBe(200);
    expect(res.body.data.messages.map((m) => m.role)).toEqual(["user", "assistant"]);
    expect(res.body.data.messages[1].content).toBe("An answer.");
  });

  it("deletes a conversation with its messages and issues", async () => {
    stubAxios(() => new Error("boom"));
    const user = await createUser();
    const conversation = await startConversation(user);
    await send(user, conversation.id, { content: "my period is late" });
    expect(await ChatIssue.countDocuments({ conversation: conversation.id })).toBe(1);

    const res = await request(app).delete(`/api/chat/conversations/${conversation.id}`).set(authHeader(user));

    expect(res.status).toBe(204);
    expect(await Conversation.findById(conversation.id)).toBeNull();
    expect(await Message.countDocuments({ conversation: conversation.id })).toBe(0);
    expect(await ChatIssue.countDocuments({ conversation: conversation.id })).toBe(0);
  });

  it("enforces ownership on read, send and delete", async () => {
    const owner = await createUser();
    const intruder = await createUser();
    const conversation = await startConversation(owner);
    const header = authHeader(intruder);

    expect((await request(app).get(`/api/chat/conversations/${conversation.id}`).set(header)).status).toBe(404);
    expect((await send(intruder, conversation.id, { content: "hello there" })).status).toBe(404);
    expect((await request(app).delete(`/api/chat/conversations/${conversation.id}`).set(header)).status).toBe(404);
    expect(await Conversation.findById(conversation.id)).not.toBeNull();
  });

  it("lists only enabled bots for the picker", async () => {
    const user = await createUser();
    await BotConfig.create({ key: "medical", name: "Medical assistant", enabled: false });

    const res = await request(app).get("/api/chat/bots").set(authHeader(user));

    expect(res.status).toBe(200);
    expect(res.body.data.bots.map((b) => b.key).sort()).toEqual(["general", "legal"]);
  });
});

describe("routing a message to the right provider", () => {
  it("sends a health question to the medical bot URL", async () => {
    const adapter = stubAxios(botAnswer("Track your cycle for a few months."));
    const user = await createUser();
    const conversation = await startConversation(user);

    const res = await send(user, conversation.id, { content: "my period is late and I have cramps" });

    expect(res.status).toBe(201);
    expect(res.body.data.message).toMatchObject({ bot: "medical", intent: "health", status: "ok" });
    expect(res.body.data.message.content).toBe("Track your cycle for a few months.");

    const [config] = adapter.mock.calls[0];
    expect(config.url).toBe(`${env.MEDICAL_BOT_URL}/ask`);
    expect(config.method).toBe("post");
    expect(JSON.parse(config.data)).toEqual({ question: "my period is late and I have cramps" });
    expect(config.timeout).toBe(env.BOT_TIMEOUT_MS);
  });

  it("sends a legal question to the legal bot URL", async () => {
    const adapter = stubAxios(botAnswer("You may file a Zero FIR."));
    const user = await createUser();
    const conversation = await startConversation(user);

    const res = await send(user, conversation.id, { content: "how do I file an FIR for dowry harassment" });

    expect(res.body.data.message).toMatchObject({ bot: "legal", intent: "legal" });
    expect(adapter.mock.calls[0][0].url).toBe(`${env.LEGAL_BOT_URL}/ask`);
  });

  it("honours an explicit bot override", async () => {
    const adapter = stubAxios(botAnswer("Legal answer."));
    const user = await createUser();
    const conversation = await startConversation(user);

    // a health question, explicitly forced to the legal bot
    const res = await send(user, conversation.id, { content: "my period is late", bot: "legal" });

    expect(res.body.data.message.bot).toBe("legal");
    expect(res.body.data.message.intent).toBe("health");
    expect(adapter.mock.calls[0][0].url).toBe(`${env.LEGAL_BOT_URL}/ask`);
  });

  it("falls back to general when the routed bot is disabled", async () => {
    await BotConfig.create({ key: "medical", name: "Medical assistant", enabled: false });
    const adapter = stubAxios(llmAnswer("General answer."));
    const originalKey = env.LLM_API_KEY;
    env.LLM_API_KEY = "test-key";

    try {
      const user = await createUser();
      const conversation = await startConversation(user);
      const res = await send(user, conversation.id, { content: "my period is late and I have cramps" });

      expect(res.body.data.message).toMatchObject({ bot: "general", intent: "health" });
      expect(adapter.mock.calls[0][0].url).toBe(`${env.LLM_API_URL}/chat/completions`);
    } finally {
      env.LLM_API_KEY = originalKey;
    }
  });

  it("uses a stored bot URL and timeout over the env defaults", async () => {
    await BotConfig.create({
      key: "medical",
      name: "Medical assistant",
      url: "http://127.0.0.1:9999/custom",
      timeoutMs: 5000,
    });
    const adapter = stubAxios(botAnswer("Custom host answer."));
    const user = await createUser();
    const conversation = await startConversation(user);

    await send(user, conversation.id, { content: "my period is late" });

    expect(adapter.mock.calls[0][0].url).toBe("http://127.0.0.1:9999/custom/ask");
    expect(adapter.mock.calls[0][0].timeout).toBe(5000);
  });

  it("sends the system prompt and the last ten messages to the LLM", async () => {
    const adapter = stubAxios(llmAnswer("Noted."));
    const originalKey = env.LLM_API_KEY;
    env.LLM_API_KEY = "test-key";

    try {
      const user = await createUser();
      const conversation = await startConversation(user);
      for (let i = 0; i < 7; i += 1) {
        await send(user, conversation.id, { content: `question number ${i} about jobs` });
      }

      const body = JSON.parse(adapter.mock.calls.at(-1)[0].data);
      expect(body.model).toBe(env.LLM_MODEL);
      expect(body.messages[0].role).toBe("system");
      expect(body.messages[0].content).toContain("AROGYINI");
      expect(body.messages.length).toBeLessThanOrEqual(12);
      expect(body.messages.at(-1)).toEqual({ role: "user", content: "question number 6 about jobs" });
      expect(adapter.mock.calls.at(-1)[0].headers.Authorization).toBe("Bearer test-key");
    } finally {
      env.LLM_API_KEY = originalKey;
    }
  });

  it("uses the built-in fallback answer when no LLM key is configured", async () => {
    const adapter = stubAxios(llmAnswer("should not be called"));
    const user = await createUser();
    const conversation = await startConversation(user);

    const res = await send(user, conversation.id, { content: "looking for a returnship after a career break" });

    expect(res.status).toBe(201);
    expect(res.body.data.message).toMatchObject({ bot: "fallback", intent: "career", status: "ok" });
    expect(res.body.data.message.content).toContain("Career section");
    expect(adapter).not.toHaveBeenCalled();
  });
});

describe("emergency handling", () => {
  it("prepends the safety notice and sets the emergency flag", async () => {
    const user = await createUser();
    const conversation = await startConversation(user);

    // a safety emergency routes to general, which with no LLM key uses the built-in answer
    const res = await send(user, conversation.id, { content: "bachao someone is following me" });

    const { message, userMessage } = res.body.data;
    expect(message).toMatchObject({ emergency: true, intent: "safety", bot: "fallback", status: "ok" });
    expect(userMessage.emergency).toBe(true);
    expect(message.content).toContain("call 112 now");
    expect(message.content).toContain("181");
    expect(message.content).toContain("1091");
    expect(message.content).toContain("SOS button");
  });

  it("puts the notice before a bot answer rather than replacing it", async () => {
    stubAxios(botAnswer("Here is some guidance."));
    const user = await createUser();
    const conversation = await startConversation(user);

    // health keywords route to the medical bot, the emergency phrase still raises the flag
    const res = await send(user, conversation.id, { content: "bachao I am bleeding heavily and in pain" });

    const { message } = res.body.data;
    expect(message).toMatchObject({ emergency: true, intent: "health", bot: "medical" });
    expect(message.content).toContain("Here is some guidance.");
    expect(message.content.indexOf("112")).toBeLessThan(message.content.indexOf("Here is some guidance."));
  });

  it("does not add the notice to an ordinary question", async () => {
    stubAxios(botAnswer("Cycles vary by a few days."));
    const user = await createUser();
    const conversation = await startConversation(user);

    const res = await send(user, conversation.id, { content: "my period is late" });

    expect(res.body.data.message.emergency).toBe(false);
    expect(res.body.data.message.content).not.toContain("call 112 now");
  });
});

describe("provider failure handling", () => {
  it("records a provider_error issue and still answers with 200-level status", async () => {
    stubAxios(() => new axios.AxiosError("Request failed with status code 502", "ERR_BAD_RESPONSE"));
    const user = await createUser();
    const conversation = await startConversation(user);

    const res = await send(user, conversation.id, { content: "my period is late" });

    expect(res.status).toBe(201);
    expect(res.body.data.message).toMatchObject({ status: "failed", bot: "medical" });
    expect(res.body.data.message.content).toContain("could not get an answer");
    expect(res.body.data.message.content).toContain("112");

    const issue = await ChatIssue.findOne({ message: res.body.data.message.id });
    expect(issue).toMatchObject({ type: "provider_error", status: "open" });
    expect(issue.reason).toContain("medical");
  });

  it("records a timeout issue when the provider times out", async () => {
    stubAxios(() => new axios.AxiosError("timeout of 30000ms exceeded", "ECONNABORTED"));
    const user = await createUser();
    const conversation = await startConversation(user);

    const res = await send(user, conversation.id, { content: "how do I file an FIR" });

    expect(res.status).toBe(201);
    expect(res.body.data.message.status).toBe("failed");
    const issue = await ChatIssue.findOne({ message: res.body.data.message.id });
    expect(issue.type).toBe("timeout");
  });

  it("records an issue when the bot returns no answer field", async () => {
    stubAxios(() => ({ something_else: true }));
    const user = await createUser();
    const conversation = await startConversation(user);

    const res = await send(user, conversation.id, { content: "my period is late" });

    expect(res.body.data.message.status).toBe("failed");
    expect((await ChatIssue.findOne({ message: res.body.data.message.id })).type).toBe("provider_error");
  });

  it("keeps a failed exchange out of the history sent to the LLM", async () => {
    const user = await createUser();
    const conversation = await startConversation(user);
    stubAxios(() => new Error("down"));
    await send(user, conversation.id, { content: "my period is late" });

    const adapter = stubAxios(llmAnswer("Fresh answer."));
    const originalKey = env.LLM_API_KEY;
    env.LLM_API_KEY = "test-key";
    try {
      await send(user, conversation.id, { content: "what jobs are available" });
      const body = JSON.parse(adapter.mock.calls[0][0].data);
      expect(body.messages.some((m) => m.content.includes("could not get an answer"))).toBe(false);
    } finally {
      env.LLM_API_KEY = originalKey;
    }
  });
});

describe("message validation and sanitising", () => {
  it("strips HTML and collapses whitespace before storing or forwarding", async () => {
    const adapter = stubAxios(botAnswer("ok"));
    const user = await createUser();
    const conversation = await startConversation(user);

    const res = await send(user, conversation.id, {
      content: "  <b>my</b>   period   <script>alert(1)</script> is late  ",
    });

    expect(res.body.data.userMessage.content).toBe("my period alert(1) is late");
    expect(JSON.parse(adapter.mock.calls[0][0].data).question).toBe("my period alert(1) is late");
  });

  it("rejects an empty, whitespace-only or tag-only message", async () => {
    const user = await createUser();
    const conversation = await startConversation(user);

    for (const content of ["", "   ", "<br>"]) {
      const res = await send(user, conversation.id, { content });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    }
  });

  it("rejects a message longer than 2000 characters", async () => {
    const user = await createUser();
    const conversation = await startConversation(user);

    const res = await send(user, conversation.id, { content: "a".repeat(2001) });

    expect(res.status).toBe(400);
  });

  it("rejects an unknown bot value", async () => {
    const user = await createUser();
    const conversation = await startConversation(user);

    expect((await send(user, conversation.id, { content: "hello there", bot: "oracle" })).status).toBe(400);
  });

  it("records latency on the assistant message", async () => {
    stubAxios(botAnswer("ok"));
    const user = await createUser();
    const conversation = await startConversation(user);

    const res = await send(user, conversation.id, { content: "my period is late" });

    expect(typeof res.body.data.message.latencyMs).toBe("number");
    expect(res.body.data.message.latencyMs).toBeGreaterThanOrEqual(0);
  });
});

describe("reporting a message", () => {
  it("creates a user_report issue for an assistant message", async () => {
    stubAxios(botAnswer("Possibly inaccurate answer."));
    const user = await createUser();
    const conversation = await startConversation(user);
    const { body } = await send(user, conversation.id, { content: "my period is late" });

    const res = await request(app)
      .post(`/api/chat/messages/${body.data.message.id}/report`)
      .set(authHeader(user))
      .send({ reason: "This advice looks wrong and could be harmful." });

    expect(res.status).toBe(201);
    expect(res.body.data.issue).toMatchObject({ type: "user_report", status: "open" });
    expect(res.body.data.issue.reason).toContain("looks wrong");
  });

  it("refuses to report a user's own message", async () => {
    stubAxios(botAnswer("ok"));
    const user = await createUser();
    const conversation = await startConversation(user);
    const { body } = await send(user, conversation.id, { content: "my period is late" });

    const res = await request(app)
      .post(`/api/chat/messages/${body.data.userMessage.id}/report`)
      .set(authHeader(user))
      .send({ reason: "testing the guard" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("NOT_REPORTABLE");
  });

  it("refuses to report a message in someone else's conversation", async () => {
    stubAxios(botAnswer("ok"));
    const owner = await createUser();
    const intruder = await createUser();
    const conversation = await startConversation(owner);
    const { body } = await send(owner, conversation.id, { content: "my period is late" });

    const res = await request(app)
      .post(`/api/chat/messages/${body.data.message.id}/report`)
      .set(authHeader(intruder))
      .send({ reason: "not my conversation" });

    expect(res.status).toBe(404);
    expect(await ChatIssue.countDocuments({ type: "user_report" })).toBe(0);
  });

  it("validates the reason and the message id", async () => {
    stubAxios(botAnswer("ok"));
    const user = await createUser();
    const conversation = await startConversation(user);
    const { body } = await send(user, conversation.id, { content: "my period is late" });

    const short = await request(app)
      .post(`/api/chat/messages/${body.data.message.id}/report`)
      .set(authHeader(user))
      .send({ reason: "x" });
    expect(short.status).toBe(400);

    const missing = await request(app)
      .post("/api/chat/messages/64b7f0000000000000000000/report")
      .set(authHeader(user))
      .send({ reason: "a good enough reason" });
    expect(missing.status).toBe(404);
  });
});
