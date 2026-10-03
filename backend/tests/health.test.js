import request from "supertest";
import app from "../src/app.js";

describe("GET /api/health", () => {
  it("reports status, uptime, timestamp and a connected db", async () => {
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({ status: "ok", db: "connected" });
    expect(typeof res.body.data.uptime).toBe("number");
    expect(Number.isNaN(Date.parse(res.body.data.timestamp))).toBe(false);
  });
});

describe("error handling", () => {
  it("returns 404 in the error envelope for an unknown route", async () => {
    const res = await request(app).get("/api/nope");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      error: { code: "NOT_FOUND", message: expect.stringContaining("/api/nope"), details: [] },
    });
  });

  it("returns 400 INVALID_JSON for a malformed body", async () => {
    const res = await request(app).post("/api/health").set("Content-Type", "application/json").send("{oops");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_JSON");
  });
});
