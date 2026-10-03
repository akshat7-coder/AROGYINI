import request from "supertest";
import app from "../src/app.js";
import EmergencyContact from "../src/models/EmergencyContact.js";
import { createUser, authHeader } from "./helpers.js";

const contact = { name: "Maa", relation: "mother", phone: "98765 43210", priority: 1 };

describe("emergency contacts", () => {
  it("requires authentication", async () => {
    expect((await request(app).get("/api/contacts")).status).toBe(401);
  });

  it("creates a contact and normalises the phone to E.164", async () => {
    const user = await createUser();
    const res = await request(app).post("/api/contacts").set(authHeader(user)).send(contact);

    expect(res.status).toBe(201);
    expect(res.body.data.contact).toMatchObject({ name: "Maa", relation: "mother", phone: "+919876543210" });
  });

  it.each([
    ["098765-43210", "+919876543210"],
    ["+91 98765 43210", "+919876543210"],
    ["00919876543210", "+919876543210"],
  ])("normalises %s to %s", async (input, expected) => {
    const user = await createUser();
    const res = await request(app).post("/api/contacts").set(authHeader(user)).send({ ...contact, phone: input });

    expect(res.status).toBe(201);
    expect(res.body.data.contact.phone).toBe(expected);
  });

  it("rejects an unusable phone number with 400", async () => {
    const user = await createUser();
    const res = await request(app).post("/api/contacts").set(authHeader(user)).send({ ...contact, phone: "12345" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("lists only the caller's contacts, ordered by priority", async () => {
    const user = await createUser();
    const other = await createUser();
    await EmergencyContact.create({ user: other.id, name: "Theirs", phone: "+919000000000" });
    await request(app).post("/api/contacts").set(authHeader(user)).send({ ...contact, priority: 3 });
    await request(app)
      .post("/api/contacts")
      .set(authHeader(user))
      .send({ name: "Papa", phone: "+919111111111", priority: 1 });

    const res = await request(app).get("/api/contacts").set(authHeader(user));

    expect(res.status).toBe(200);
    expect(res.body.data.contacts.map((c) => c.name)).toEqual(["Papa", "Maa"]);
  });

  it("rejects a 6th contact with 409", async () => {
    const user = await createUser();
    for (let i = 0; i < 5; i += 1) {
      const res = await request(app)
        .post("/api/contacts")
        .set(authHeader(user))
        .send({ name: `Contact ${i}`, phone: `+9190000000${i}` });
      expect(res.status).toBe(201);
    }

    const sixth = await request(app)
      .post("/api/contacts")
      .set(authHeader(user))
      .send({ name: "Sixth", phone: "+919555555555" });

    expect(sixth.status).toBe(409);
    expect(sixth.body.error.code).toBe("CONTACT_LIMIT_REACHED");
  });

  it("updates a contact", async () => {
    const user = await createUser();
    const { body } = await request(app).post("/api/contacts").set(authHeader(user)).send(contact);

    const res = await request(app)
      .patch(`/api/contacts/${body.data.contact.id}`)
      .set(authHeader(user))
      .send({ relation: "guardian", phone: "9000011111" });

    expect(res.status).toBe(200);
    expect(res.body.data.contact).toMatchObject({ relation: "guardian", phone: "+919000011111" });
  });

  it("deletes a contact", async () => {
    const user = await createUser();
    const { body } = await request(app).post("/api/contacts").set(authHeader(user)).send(contact);

    const res = await request(app).delete(`/api/contacts/${body.data.contact.id}`).set(authHeader(user));

    expect(res.status).toBe(204);
    expect(await EmergencyContact.countDocuments({ user: user.id })).toBe(0);
  });

  it("returns 404 when touching another user's contact", async () => {
    const owner = await createUser();
    const intruder = await createUser();
    const created = await EmergencyContact.create({ user: owner.id, name: "Maa", phone: "+919876543210" });

    const patched = await request(app)
      .patch(`/api/contacts/${created.id}`)
      .set(authHeader(intruder))
      .send({ name: "Hijacked" });
    const deleted = await request(app).delete(`/api/contacts/${created.id}`).set(authHeader(intruder));

    expect(patched.status).toBe(404);
    expect(deleted.status).toBe(404);
    expect((await EmergencyContact.findById(created.id)).name).toBe("Maa");
  });
});
