import { jest } from "@jest/globals";
import axios from "axios";
import request from "supertest";
import app from "../src/app.js";
import Message from "../src/models/Message.js";
import { normaliseSources, MAX_SOURCES } from "../src/services/chat/providers/ragBotProvider.js";
import { createUser, authHeader } from "./helpers.js";

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

async function startConversation(user) {
  const res = await request(app).post("/api/chat/conversations").set(authHeader(user)).send({});
  return res.body.data.conversation;
}

const send = (user, conversationId, content) =>
  request(app).post(`/api/chat/conversations/${conversationId}/messages`).set(authHeader(user)).send({ content });

afterEach(() => {
  axios.defaults.adapter = realAdapter;
});

describe("normaliseSources", () => {
  it("keeps well-formed entries", () => {
    expect(normaliseSources([{ title: "POSH Act, 2013", source: "posh.txt" }])).toEqual([
      { title: "POSH Act, 2013", source: "posh.txt" },
    ]);
  });

  it("returns an empty array for anything that is not an array", () => {
    for (const value of [undefined, null, "posh.txt", 7, {}, true]) {
      expect(normaliseSources(value)).toEqual([]);
    }
  });

  it("drops entries that are not objects", () => {
    expect(normaliseSources(["a string", 5, null, undefined, [], { title: "Kept" }])).toEqual([
      { title: "Kept", source: "" },
    ]);
  });

  it("drops entries with neither a title nor a source", () => {
    expect(normaliseSources([{ title: "   ", source: "" }, { page: 4 }])).toEqual([]);
  });

  it("falls back to source when title is missing", () => {
    expect(normaliseSources([{ source: "dowry.txt" }])).toEqual([{ title: "dowry.txt", source: "dowry.txt" }]);
  });

  it("trims strings and ignores non-string fields", () => {
    expect(normaliseSources([{ title: "  Spaced  ", source: 42 }])).toEqual([{ title: "Spaced", source: "" }]);
  });

  it("caps each field at 200 characters", () => {
    const [only] = normaliseSources([{ title: "x".repeat(500), source: "y".repeat(500) }]);
    expect(only.title).toHaveLength(200);
    expect(only.source).toHaveLength(200);
  });

  it(`keeps at most ${MAX_SOURCES} entries`, () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ title: `Act ${i}`, source: `${i}.txt` }));
    expect(normaliseSources(many)).toHaveLength(MAX_SOURCES);
  });
});

describe("sources on a chat answer", () => {
  it("saves and returns the sources a bot sends", async () => {
    const user = await createUser();
    const conversation = await startConversation(user);
    stubAxios(() => ({
      answer: "Section 3 of the POSH Act covers this.",
      sources: [
        { title: "POSH Act, 2013", source: "posh.txt" },
        { title: "Dowry Prohibition Act, 1961", source: "dowry.txt" },
      ],
    }));

    const res = await send(user, conversation.id, "what counts as sexual harassment at work");

    expect(res.status).toBe(201);
    expect(res.body.data.message.bot).toBe("legal");
    expect(res.body.data.message.sources).toEqual([
      { title: "POSH Act, 2013", source: "posh.txt" },
      { title: "Dowry Prohibition Act, 1961", source: "dowry.txt" },
    ]);

    const stored = await Message.findById(res.body.data.message.id);
    expect(stored.sources.map((s) => s.title)).toEqual(["POSH Act, 2013", "Dowry Prohibition Act, 1961"]);
  });

  it("returns an empty list when the bot sends no sources", async () => {
    const user = await createUser();
    const conversation = await startConversation(user);
    stubAxios(() => ({ answer: "Drink water and rest." }));

    const res = await send(user, conversation.id, "my period is late and I have cramps");

    expect(res.status).toBe(201);
    expect(res.body.data.message.sources).toEqual([]);
  });

  it("discards malformed sources but still returns the answer", async () => {
    const user = await createUser();
    const conversation = await startConversation(user);
    stubAxios(() => ({
      answer: "You may file a Zero FIR.",
      sources: ["just a string", { page: 3 }, { title: "  " }, { title: "Zero FIR", source: "law.txt" }],
    }));

    const res = await send(user, conversation.id, "how do I file an FIR for dowry harassment");

    expect(res.status).toBe(201);
    expect(res.body.data.message.content).toContain("Zero FIR");
    expect(res.body.data.message.sources).toEqual([{ title: "Zero FIR", source: "law.txt" }]);
  });

  it("survives sources sent as an object instead of an array", async () => {
    const user = await createUser();
    const conversation = await startConversation(user);
    stubAxios(() => ({ answer: "Iron-rich food helps.", sources: { title: "Medical book" } }));

    const res = await send(user, conversation.id, "what causes anaemia during my period");

    expect(res.status).toBe(201);
    expect(res.body.data.message.sources).toEqual([]);
  });

  it("leaves sources empty for a general LLM answer", async () => {
    const user = await createUser();
    const conversation = await startConversation(user);
    stubAxios(() => ({ choices: [{ message: { content: "General answer." } }] }));

    const res = await send(user, conversation.id, "what is the weather like today");

    expect(res.status).toBe(201);
    expect(res.body.data.message.sources).toEqual([]);
  });
});
