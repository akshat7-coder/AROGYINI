import request from "supertest";
import app from "../src/app.js";
import User from "../src/models/User.js";
import { createUser, authHeader } from "./helpers.js";

const credentials = { name: "Asha Rao", email: "Asha@Example.com ", password: "Secret123" };

describe("POST /api/auth/signup", () => {
  it("creates a user, returns a token and never leaks the password hash", async () => {
    const res = await request(app).post("/api/auth/signup").send(credentials);

    expect(res.status).toBe(201);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user).toMatchObject({ email: "asha@example.com", role: "user", isActive: true });
    expect(res.body.data.user.id).toEqual(expect.any(String));
    expect(res.body.data.user).not.toHaveProperty("passwordHash");
    expect(res.body.data.user).not.toHaveProperty("_id");
  });

  it("ignores a role sent in the body", async () => {
    const res = await request(app).post("/api/auth/signup").send({ ...credentials, role: "admin" });

    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe("user");
    const stored = await User.findOne({ email: "asha@example.com" });
    expect(stored.role).toBe("user");
  });

  it("rejects a duplicate email regardless of casing", async () => {
    await request(app).post("/api/auth/signup").send(credentials);
    const res = await request(app).post("/api/auth/signup").send({ ...credentials, email: "ASHA@example.com" });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("EMAIL_IN_USE");
  });

  it("rejects a password without a number", async () => {
    const res = await request(app).post("/api/auth/signup").send({ ...credentials, password: "onlyletters" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.details[0]).toMatchObject({ field: "password" });
  });

  it("rejects an invalid email", async () => {
    const res = await request(app).post("/api/auth/signup").send({ ...credentials, email: "not-an-email" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("POST /api/auth/signin", () => {
  it("signs in and stamps lastLoginAt", async () => {
    const user = await createUser({ email: "signin@example.com", password: "Secret123" });
    expect(user.lastLoginAt).toBeUndefined();

    const res = await request(app).post("/api/auth/signin").send({ email: "signin@example.com", password: "Secret123" });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toEqual(expect.any(String));
    const reloaded = await User.findById(user.id);
    expect(reloaded.lastLoginAt).toBeInstanceOf(Date);
  });

  it("returns a generic error for a wrong password", async () => {
    await createUser({ email: "signin@example.com", password: "Secret123" });
    const res = await request(app).post("/api/auth/signin").send({ email: "signin@example.com", password: "Wrong123" });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe("Invalid email or password");
  });

  it("returns the same generic error for an unknown email", async () => {
    const res = await request(app).post("/api/auth/signin").send({ email: "nobody@example.com", password: "Secret123" });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe("Invalid email or password");
  });

  it("blocks a deactivated account with 403", async () => {
    await createUser({ email: "off@example.com", password: "Secret123", isActive: false });
    const res = await request(app).post("/api/auth/signin").send({ email: "off@example.com", password: "Secret123" });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("ACCOUNT_INACTIVE");
  });
});

describe("GET /api/auth/me", () => {
  it("returns the current user with a valid token", async () => {
    const user = await createUser({ email: "me@example.com" });
    const res = await request(app).get("/api/auth/me").set(authHeader(user));

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe("me@example.com");
  });

  it("returns 401 without a token", async () => {
    const res = await request(app).get("/api/auth/me");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("returns 401 for a malformed token", async () => {
    const res = await request(app).get("/api/auth/me").set({ Authorization: "Bearer not.a.jwt" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_TOKEN");
  });

  it("returns 403 when the account was deactivated after the token was issued", async () => {
    const user = await createUser();
    const header = authHeader(user);
    await User.findByIdAndUpdate(user.id, { isActive: false });

    const res = await request(app).get("/api/auth/me").set(header);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("ACCOUNT_INACTIVE");
  });
});

describe("PATCH /api/auth/me", () => {
  it("updates profile fields only", async () => {
    const user = await createUser({ email: "profile@example.com" });
    const res = await request(app)
      .patch("/api/auth/me")
      .set(authHeader(user))
      .send({ name: "Asha R", city: "Pune", bloodGroup: "B+", email: "hacker@example.com", role: "admin" });

    expect(res.status).toBe(200);
    expect(res.body.data.user).toMatchObject({ name: "Asha R", city: "Pune", bloodGroup: "B+" });
    expect(res.body.data.user.email).toBe("profile@example.com");
    expect(res.body.data.user.role).toBe("user");
  });

  it("rejects an empty update", async () => {
    const user = await createUser();
    const res = await request(app).patch("/api/auth/me").set(authHeader(user)).send({});

    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/auth/password", () => {
  it("requires the correct current password", async () => {
    const user = await createUser({ password: "Secret123" });
    const res = await request(app)
      .patch("/api/auth/password")
      .set(authHeader(user))
      .send({ currentPassword: "Wrong123", newPassword: "Brandnew1" });

    expect(res.status).toBe(401);
  });

  it("changes the password so the new one signs in", async () => {
    const user = await createUser({ email: "pw@example.com", password: "Secret123" });
    const res = await request(app)
      .patch("/api/auth/password")
      .set(authHeader(user))
      .send({ currentPassword: "Secret123", newPassword: "Brandnew1" });

    expect(res.status).toBe(200);

    const old = await request(app).post("/api/auth/signin").send({ email: "pw@example.com", password: "Secret123" });
    expect(old.status).toBe(401);

    const fresh = await request(app).post("/api/auth/signin").send({ email: "pw@example.com", password: "Brandnew1" });
    expect(fresh.status).toBe(200);
  });
});
