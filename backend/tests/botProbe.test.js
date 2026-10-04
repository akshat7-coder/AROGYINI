import { jest } from "@jest/globals";
import axios from "axios";
import { probeBots } from "../src/server.js";
import { env } from "../src/config/env.js";

const realAdapter = axios.defaults.adapter;
let warn;

beforeEach(() => {
  warn = jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  warn.mockRestore();
  axios.defaults.adapter = realAdapter;
});

const stub = (reply) => {
  axios.defaults.adapter = jest.fn(async (config) => {
    const payload = await reply(config);
    if (payload instanceof Error) throw payload;
    return { data: payload, status: 200, statusText: "OK", headers: {}, config };
  });
};

const warnings = () => warn.mock.calls.map(([line]) => line);

describe("probeBots", () => {
  it("says nothing when both bots are ready", async () => {
    stub(() => ({ status: "ok", ready: true }));

    await probeBots();

    expect(warnings()).toEqual([]);
  });

  it("warns once per bot that is up but not ready", async () => {
    stub(() => ({ status: "ok", ready: false, reason: "the index is not built" }));

    await probeBots();

    expect(warnings()).toHaveLength(2);
    expect(warnings()[0]).toContain("medical bot");
    expect(warnings()[0]).toContain("the index is not built");
    expect(warnings()[1]).toContain("legal bot");
  });

  it("warns per unreachable bot without throwing", async () => {
    stub(() => new axios.AxiosError("connect ECONNREFUSED 127.0.0.1:5000", "ECONNREFUSED"));

    await expect(probeBots()).resolves.toBeUndefined();

    expect(warnings()).toHaveLength(2);
    expect(warnings()[0]).toContain("not reachable");
    expect(warnings()[0]).toContain("ECONNREFUSED");
  });

  it("probes the configured bot URLs with a short timeout", async () => {
    stub(() => ({ ready: true }));

    await probeBots();

    const calls = axios.defaults.adapter.mock.calls;
    expect(calls.map(([config]) => config.url)).toEqual([
      `${env.MEDICAL_BOT_URL}/health`,
      `${env.LEGAL_BOT_URL}/health`,
    ]);
    expect(calls[0][0].timeout).toBe(3000);
  });
});
