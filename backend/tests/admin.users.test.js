import request from "supertest";
import app from "../src/app.js";
import User from "../src/models/User.js";
import { createUser, createAdmin, authHeader } from "./helpers.js";

describe("admin route access", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).get("/api/admin/users");

    expect(res.status).toBe(401);
  });

  it("returns 403 for a normal user", async () => {
    const user = await createUser();
    const res = await request(app).get("/api/admin/users").set(authHeader(user));

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });
});

describe("GET /api/admin/users", () => {
  it("lists users with pagination meta", async () => {
    const admin = await createAdmin();
    await createUser({ name: "Asha Rao" });
    await createUser({ name: "Bela Das" });

    const res = await request(app).get("/api/admin/users?page=1&limit=2").set(authHeader(admin));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta).toEqual({ page: 1, limit: 2, total: 3 });
    expect(res.body.data[0]).not.toHaveProperty("passwordHash");
  });

  it("searches by name or email", async () => {
    const admin = await createAdmin();
    await createUser({ name: "Asha Rao", email: "asha@example.com" });
    await createUser({ name: "Bela Das", email: "bela@example.com" });

    const byName = await request(app).get("/api/admin/users?search=asha").set(authHeader(admin));
    expect(byName.body.data).toHaveLength(1);
    expect(byName.body.data[0].name).toBe("Asha Rao");

    const byEmail = await request(app).get("/api/admin/users?search=bela@example").set(authHeader(admin));
    expect(byEmail.body.data).toHaveLength(1);
  });

  it("filters by role", async () => {
    const admin = await createAdmin();
    await createUser();

    const res = await request(app).get("/api/admin/users?role=admin").set(authHeader(admin));

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe(admin.id);
  });

  it("rejects an unknown role filter", async () => {
    const admin = await createAdmin();
    const res = await request(app).get("/api/admin/users?role=superuser").set(authHeader(admin));

    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/admin/users/:id/role", () => {
  it("promotes a user to admin", async () => {
    const admin = await createAdmin();
    const user = await createUser();

    const res = await request(app)
      .patch(`/api/admin/users/${user.id}/role`)
      .set(authHeader(admin))
      .send({ role: "admin" });

    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe("admin");
  });

  it("refuses to change the admin's own role", async () => {
    const admin = await createAdmin();

    const res = await request(app)
      .patch(`/api/admin/users/${admin.id}/role`)
      .set(authHeader(admin))
      .send({ role: "user" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("SELF_MODIFICATION_FORBIDDEN");
    const reloaded = await User.findById(admin.id);
    expect(reloaded.role).toBe("admin");
  });

  it("returns 404 for an unknown user", async () => {
    const admin = await createAdmin();
    const res = await request(app)
      .patch("/api/admin/users/64b7f0000000000000000000/role")
      .set(authHeader(admin))
      .send({ role: "admin" });

    expect(res.status).toBe(404);
  });

  it("returns 400 for a malformed id", async () => {
    const admin = await createAdmin();
    const res = await request(app).patch("/api/admin/users/nope/role").set(authHeader(admin)).send({ role: "admin" });

    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/admin/users/:id/status", () => {
  it("deactivates a user, who is then locked out", async () => {
    const admin = await createAdmin();
    const user = await createUser();
    const userHeader = authHeader(user);

    const res = await request(app)
      .patch(`/api/admin/users/${user.id}/status`)
      .set(authHeader(admin))
      .send({ isActive: false });

    expect(res.status).toBe(200);
    expect(res.body.data.user.isActive).toBe(false);

    const locked = await request(app).get("/api/auth/me").set(userHeader);
    expect(locked.status).toBe(403);
  });

  it("refuses to deactivate the admin's own account", async () => {
    const admin = await createAdmin();

    const res = await request(app)
      .patch(`/api/admin/users/${admin.id}/status`)
      .set(authHeader(admin))
      .send({ isActive: false });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("SELF_MODIFICATION_FORBIDDEN");
  });
});

describe("GET /api/admin/stats", () => {
  it("counts users, active users, admins and active SOS events", async () => {
    const admin = await createAdmin();
    await createUser();
    await createUser({ isActive: false });

    const res = await request(app).get("/api/admin/stats").set(authHeader(admin));

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ users: 3, activeUsers: 2, admins: 1, activeSos: 0 });
  });
});
