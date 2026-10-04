import { jest } from "@jest/globals";
import axios from "axios";
import * as ragBot from "../src/services/chat/providers/ragBotProvider.js";
import * as llm from "../src/services/chat/providers/openAiCompatibleProvider.js";
import { answerFor, APOLOGY } from "../src/services/chat/providers/fallbackProvider.js";
import * as consoleProvider from "../src/services/sms/consoleProvider.js";
import { providerName, providerFor, sendSms, getSentMessages, clearSentMessages } from "../src/services/sms/index.js";
import { ALWAYS_FAILS } from "../src/services/sms/memoryProvider.js";
import { env } from "../src/config/env.js";
import { normalisePhone, isE164 } from "../src/utils/phone.js";
import { parsePagination } from "../src/utils/pagination.js";
import { formatIstDate, formatIstDateTime, toIsoDate, daysBetween, addDays } from "../src/utils/dates.js";

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

afterEach(() => {
  axios.defaults.adapter = realAdapter;
});

describe("ragBotProvider", () => {
  it("posts the question and returns the trimmed answer with its sources", async () => {
    const adapter = stubAxios(() => ({ answer: "  An answer.  ", sources: [{ title: "Act", source: "a.txt" }] }));

    const result = await ragBot.ask({ url: "http://bot.test", timeoutMs: 1234, question: "hello" });

    expect(result).toEqual({ answer: "An answer.", sources: [{ title: "Act", source: "a.txt" }] });
    expect(adapter.mock.calls[0][0].url).toBe("http://bot.test/ask");
    expect(adapter.mock.calls[0][0].timeout).toBe(1234);
  });

  it("returns an empty sources list when the bot omits it", async () => {
    stubAxios(() => ({ answer: "An answer." }));

    const result = await ragBot.ask({ url: "http://bot.test", timeoutMs: 100, question: "hello" });

    expect(result).toEqual({ answer: "An answer.", sources: [] });
  });

  it("gets ready and the reason from /health", async () => {
    const adapter = stubAxios(() => ({ status: "ok", ready: true, reason: "ok", chunks: 12 }));

    const result = await ragBot.health({ url: "http://bot.test///", timeoutMs: 500 });

    expect(result).toMatchObject({ ready: true, reason: "ok" });
    expect(result.details.chunks).toBe(12);
    expect(adapter.mock.calls[0][0].url).toBe("http://bot.test/health");
    expect(adapter.mock.calls[0][0].method).toBe("get");
  });

  it("treats a missing or non-true ready flag as not ready", async () => {
    for (const payload of [{ status: "ok" }, { ready: "yes" }, { ready: false, reason: "no index" }]) {
      stubAxios(() => payload);
      expect((await ragBot.health({ url: "http://bot.test", timeoutMs: 500 })).ready).toBe(false);
    }
  });

  it("strips trailing slashes from the configured URL", async () => {
    const adapter = stubAxios(() => ({ answer: "ok" }));

    await ragBot.ask({ url: "http://bot.test///", timeoutMs: 100, question: "hello" });

    expect(adapter.mock.calls[0][0].url).toBe("http://bot.test/ask");
  });

  it.each([
    ["an empty answer", { answer: "   " }],
    ["a missing answer field", { something: true }],
    ["a non-string answer", { answer: 42 }],
  ])("throws a 502 on %s", async (_label, payload) => {
    stubAxios(() => payload);

    await expect(ragBot.ask({ url: "http://bot.test", timeoutMs: 100, question: "hello" })).rejects.toMatchObject({
      statusCode: 502,
      code: "BOT_BAD_RESPONSE",
    });
  });
});

describe("openAiCompatibleProvider", () => {
  const withKey = async (fn) => {
    const original = env.LLM_API_KEY;
    env.LLM_API_KEY = "test-key";
    try {
      await fn();
    } finally {
      env.LLM_API_KEY = original;
    }
  };

  it("reports whether an API key is configured", () => {
    expect(llm.hasApiKey()).toBe(false);
    const original = env.LLM_API_KEY;
    env.LLM_API_KEY = "x";
    expect(llm.hasApiKey()).toBe(true);
    env.LLM_API_KEY = original;
  });

  it("sends the system prompt, the history and the question", async () => {
    await withKey(async () => {
      const adapter = stubAxios(() => ({ choices: [{ message: { content: " Hello. " } }] }));

      const answer = await llm.complete({
        question: "what now",
        history: [{ role: "user", content: "earlier" }, { role: "assistant", content: "reply" }],
        timeoutMs: 999,
      });

      expect(answer).toBe("Hello.");
      const body = JSON.parse(adapter.mock.calls[0][0].data);
      expect(body.messages[0]).toEqual({ role: "system", content: llm.SYSTEM_PROMPT });
      expect(body.messages[1]).toEqual({ role: "user", content: "earlier" });
      expect(body.messages.at(-1)).toEqual({ role: "user", content: "what now" });
      expect(body.model).toBe(env.LLM_MODEL);
      expect(adapter.mock.calls[0][0].timeout).toBe(999);
    });
  });

  it("trims the history to the last ten turns", async () => {
    await withKey(async () => {
      const adapter = stubAxios(() => ({ choices: [{ message: { content: "ok" } }] }));
      const history = Array.from({ length: 25 }, (_, i) => ({ role: "user", content: `m${i}` }));

      await llm.complete({ question: "now", history, timeoutMs: 100 });

      const body = JSON.parse(adapter.mock.calls[0][0].data);
      expect(body.messages).toHaveLength(llm.HISTORY_LIMIT + 2);
      expect(body.messages[1].content).toBe("m15");
    });
  });

  it("defaults to an empty history", async () => {
    await withKey(async () => {
      const adapter = stubAxios(() => ({ choices: [{ message: { content: "ok" } }] }));

      await llm.complete({ question: "solo", timeoutMs: 100 });

      expect(JSON.parse(adapter.mock.calls[0][0].data).messages).toHaveLength(2);
    });
  });

  it.each([
    ["no choices", {}],
    ["an empty choices array", { choices: [] }],
    ["a blank message", { choices: [{ message: { content: "  " } }] }],
  ])("throws a 502 on %s", async (_label, payload) => {
    await withKey(async () => {
      stubAxios(() => payload);

      await expect(llm.complete({ question: "x", timeoutMs: 100 })).rejects.toMatchObject({
        statusCode: 502,
        code: "LLM_BAD_RESPONSE",
      });
    });
  });
});

describe("fallbackProvider", () => {
  it.each([
    ["health", "Health section"],
    ["legal", "Legal section"],
    ["career", "Career section"],
    ["safety", "call 112 immediately"],
    ["general", "AROGYINI can still help"],
  ])("gives a %s answer pointing at the right section", (intent, expected) => {
    expect(answerFor(intent)).toContain(expected);
  });

  it("falls back to the general answer for an unknown or missing intent", () => {
    expect(answerFor("nonsense")).toBe(answerFor("general"));
    expect(answerFor(undefined)).toBe(answerFor("general"));
  });

  it("has an apology that still gives the emergency numbers", () => {
    expect(APOLOGY).toContain("112");
    expect(APOLOGY).toContain("181");
  });
});

describe("sms providers", () => {
  beforeEach(() => clearSentMessages());

  it("selects the memory provider under NODE_ENV=test", () => {
    expect(providerName).toBe("memory");
  });

  it("maps a provider name to a module, defaulting to console", () => {
    expect(providerFor("memory").name).toBe("memory");
    expect(providerFor("console").name).toBe("console");
    expect(providerFor("twilio").name).toBe("console");
    expect(providerFor("nonsense").name).toBe("console");
    expect(providerFor(undefined).name).toBe("console");
  });

  it("records messages and returns a unique sid", async () => {
    const first = await sendSms({ to: "+919876543210", body: "one" });
    const second = await sendSms({ to: "+919876543211", body: "two" });

    expect(first.sid).not.toBe(second.sid);
    expect(getSentMessages()).toHaveLength(2);
    expect(getSentMessages()[0]).toMatchObject({ to: "+919876543210", body: "one" });
  });

  it("throws for the magic failure number", async () => {
    await expect(sendSms({ to: ALWAYS_FAILS, body: "x" })).rejects.toThrow("Invalid recipient");
    expect(getSentMessages()).toHaveLength(0);
  });

  it("clearSentMessages empties the log", async () => {
    await sendSms({ to: "+919876543210", body: "x" });
    clearSentMessages();
    expect(getSentMessages()).toHaveLength(0);
  });

  it("the console provider logs and returns distinct sids within the same millisecond", async () => {
    const log = jest.spyOn(console, "log").mockImplementation(() => {});
    try {
      const [a, b] = await Promise.all([
        consoleProvider.send({ to: "+919876543210", body: "one" }),
        consoleProvider.send({ to: "+919876543211", body: "two" }),
      ]);

      expect(consoleProvider.name).toBe("console");
      expect(a.sid).not.toBe(b.sid);
      expect(log).toHaveBeenCalledTimes(2);
      expect(log.mock.calls[0][0]).toContain("+919876543210");
    } finally {
      log.mockRestore();
    }
  });
});

describe("phone normalisation", () => {
  it.each([
    ["98765 43210", "+919876543210"],
    ["098765-43210", "+919876543210"],
    ["+91 98765 43210", "+919876543210"],
    ["00919876543210", "+919876543210"],
    ["9876543210", "+919876543210"],
    ["(98765) 43210", "+919876543210"],
    ["+1 555 010 9999", "+15550109999"],
  ])("normalises %s to %s", (input, expected) => {
    expect(normalisePhone(input)).toBe(expected);
  });

  it("returns an empty string for nothing usable", () => {
    expect(normalisePhone("")).toBe("");
    expect(normalisePhone(null)).toBe("");
    expect(normalisePhone(undefined)).toBe("");
    expect(normalisePhone("abc")).toBe("");
  });

  it("accepts a different default country code", () => {
    expect(normalisePhone("5550109999", "+1")).toBe("+15550109999");
  });

  it("validates E.164", () => {
    expect(isE164("+919876543210")).toBe(true);
    expect(isE164("9876543210")).toBe(false);
    expect(isE164("+0123456789")).toBe(false);
    expect(isE164("+12345")).toBe(false);
  });
});

describe("pagination parser", () => {
  it("defaults to page 1 and limit 20", () => {
    expect(parsePagination({})).toEqual({ page: 1, limit: 20, skip: 0 });
    expect(parsePagination()).toEqual({ page: 1, limit: 20, skip: 0 });
  });

  it("computes skip from page and limit", () => {
    expect(parsePagination({ page: 3, limit: 10 })).toEqual({ page: 3, limit: 10, skip: 20 });
  });

  it("clamps nonsense into range", () => {
    expect(parsePagination({ page: 0, limit: 0 })).toMatchObject({ page: 1, limit: 20 });
    expect(parsePagination({ page: -5 })).toMatchObject({ page: 1 });
    expect(parsePagination({ limit: 5000 })).toMatchObject({ limit: 100 });
    expect(parsePagination({ page: "abc", limit: "xyz" })).toEqual({ page: 1, limit: 20, skip: 0 });
  });

  it("honours custom defaults and caps", () => {
    expect(parsePagination({}, { defaultLimit: 5 })).toMatchObject({ limit: 5 });
    expect(parsePagination({ limit: 50 }, { maxLimit: 25 })).toMatchObject({ limit: 25 });
  });
});

describe("date helpers", () => {
  it("formats IST dates and date-times", () => {
    // 22:00 UTC is already the next day in IST (UTC+5:30)
    expect(formatIstDate("2026-10-03T22:00:00Z")).toBe("04 October 2026");
    expect(formatIstDateTime("2026-10-03T13:11:00Z")).toContain("2026");
    expect(formatIstDate()).toEqual(expect.any(String));
    expect(formatIstDateTime()).toEqual(expect.any(String));
  });

  it("converts to an ISO day and returns null for nothing", () => {
    expect(toIsoDate("2026-10-03T22:00:00Z")).toBe("2026-10-03");
    expect(toIsoDate(null)).toBeNull();
    expect(toIsoDate(undefined)).toBeNull();
  });

  it("counts whole days in both directions", () => {
    expect(daysBetween("2026-01-01", "2026-01-29")).toBe(28);
    expect(daysBetween("2026-01-29", "2026-01-01")).toBe(-28);
    expect(daysBetween("2026-01-01", "2026-01-01")).toBe(0);
  });

  it("adds and subtracts days across a month boundary", () => {
    expect(toIsoDate(addDays("2026-01-29", 5))).toBe("2026-02-03");
    expect(toIsoDate(addDays("2026-02-03", -5))).toBe("2026-01-29");
  });
});
