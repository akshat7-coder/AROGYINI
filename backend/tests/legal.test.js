import request from "supertest";
import app from "../src/app.js";
import LegalRight from "../src/models/LegalRight.js";
import { legalRights } from "../src/seed/data/legalRights.js";
import { createUser, createAdmin, authHeader } from "./helpers.js";

beforeEach(async () => {
  await LegalRight.insertMany(legalRights);
});

describe("GET /api/legal/rights", () => {
  it("is public and lists the published rights", async () => {
    const res = await request(app).get("/api/legal/rights?limit=100");

    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(legalRights.length);
    expect(res.body.data.map((r) => r.slug)).toEqual(expect.arrayContaining(["posh-act-2013", "zero-fir"]));
  });

  it("paginates", async () => {
    const res = await request(app).get("/api/legal/rights?page=1&limit=3");

    expect(res.body.data).toHaveLength(3);
    expect(res.body.meta).toEqual({ page: 1, limit: 3, total: legalRights.length });
  });

  it("filters by category", async () => {
    const res = await request(app).get("/api/legal/rights?category=workplace");

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data.every((r) => r.category === "workplace")).toBe(true);
    expect(res.body.data.map((r) => r.slug).sort()).toEqual(["maternity-benefit-act", "posh-act-2013"]);
  });

  it("rejects an unknown category", async () => {
    const res = await request(app).get("/api/legal/rights?category=traffic");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("searches the title", async () => {
    const res = await request(app).get("/api/legal/rights?search=maternity");

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].slug).toBe("maternity-benefit-act");
  });

  it("searches the act name", async () => {
    const res = await request(app).get("/api/legal/rights?search=Dowry Prohibition");

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].slug).toBe("dowry-prohibition-act-1961");
  });

  it("searches the summary", async () => {
    const res = await request(app).get("/api/legal/rights?search=cybercrime.gov.in");

    expect(res.body.data.map((r) => r.slug)).toContain("cyber-safety-it-act");
  });

  it("search is case insensitive and treats the term literally", async () => {
    const upper = await request(app).get("/api/legal/rights?search=POSH");
    expect(upper.body.meta.total).toBeGreaterThan(0);

    const regexChars = await request(app).get("/api/legal/rights?search=.*");
    expect(regexChars.body.meta.total).toBe(0);
  });

  it("hides unpublished rights", async () => {
    await LegalRight.updateOne({ slug: "zero-fir" }, { isPublished: false });

    const res = await request(app).get("/api/legal/rights?limit=100");

    expect(res.body.meta.total).toBe(legalRights.length - 1);
    expect(res.body.data.map((r) => r.slug)).not.toContain("zero-fir");
  });
});

describe("GET /api/legal/rights/:slug", () => {
  it("returns the full entry", async () => {
    const res = await request(app).get("/api/legal/rights/posh-act-2013");

    expect(res.status).toBe(200);
    const { right } = res.body.data;
    expect(right).toMatchObject({
      slug: "posh-act-2013",
      category: "workplace",
      year: 2013,
    });
    expect(right.actName).toContain("Sexual Harassment of Women at Workplace");
    expect(right.keyProtections.join(" ")).toContain("Section 4");
    expect(right.penalties).toContain("50,000");
    expect(right.howToFile.length).toBeGreaterThan(0);
    expect(right.faqs[0]).toMatchObject({ q: expect.any(String), a: expect.any(String) });
    expect(right.helplines).toContain("181 (Women Helpline)");
  });

  it("returns 404 for an unknown slug", async () => {
    const res = await request(app).get("/api/legal/rights/no-such-act-1999");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("returns 404 for an unpublished slug", async () => {
    await LegalRight.updateOne({ slug: "zero-fir" }, { isPublished: false });

    expect((await request(app).get("/api/legal/rights/zero-fir")).status).toBe(404);
  });

  it("rejects a malformed slug", async () => {
    expect((await request(app).get("/api/legal/rights/not a slug!")).status).toBe(400);
  });
});

describe("seed data integrity", () => {
  it("covers the eight required acts with unique slugs", () => {
    const slugs = legalRights.map((r) => r.slug);

    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs.sort()).toEqual([
      "cyber-safety-it-act",
      "dowry-prohibition-act-1961",
      "indecent-representation-of-women-act-1986",
      "maternity-benefit-act",
      "posh-act-2013",
      "pwdva-2005",
      "sati-prevention-act-1987",
      "zero-fir",
    ]);
  });

  it("gives every entry a summary, protections, filing steps and penalties", () => {
    for (const right of legalRights) {
      expect(right.summary.length).toBeGreaterThan(80);
      expect(right.keyProtections.length).toBeGreaterThan(1);
      expect(right.howToFile.length).toBeGreaterThan(1);
      expect(right.penalties.length).toBeGreaterThan(40);
      expect(right.helplines.length).toBeGreaterThan(0);
    }
  });

  it("records the specific statutory figures asked for", () => {
    const bySlug = Object.fromEntries(legalRights.map((r) => [r.slug, r]));
    const allText = (r) => [r.summary, r.penalties, ...r.keyProtections, ...r.howToFile].join(" ");

    expect(allText(bySlug["posh-act-2013"])).toContain("10 or more employees");
    expect(allText(bySlug["posh-act-2013"])).toContain("90 days");
    expect(allText(bySlug["posh-act-2013"])).toContain("3 months");
    expect(allText(bySlug["posh-act-2013"])).toContain("Section 16");
    expect(bySlug["posh-act-2013"].penalties).toContain("50,000");

    expect(allText(bySlug["pwdva-2005"])).toContain("Section 17");
    expect(allText(bySlug["pwdva-2005"])).toContain("Section 22");
    expect(allText(bySlug["pwdva-2005"])).toContain("3 days");
    expect(bySlug["pwdva-2005"].penalties).toContain("20,000");
    expect(bySlug["pwdva-2005"].penalties).toContain("1 year");

    expect(bySlug["dowry-prohibition-act-1961"].penalties).toContain("5 years");
    expect(bySlug["dowry-prohibition-act-1961"].penalties).toContain("15,000");
    expect(bySlug["dowry-prohibition-act-1961"].penalties).toContain("2 years");

    expect(allText(bySlug["maternity-benefit-act"])).toContain("26 weeks");
    expect(allText(bySlug["maternity-benefit-act"])).toContain("50 or more employees");

    expect(allText(bySlug["cyber-safety-it-act"])).toContain("cybercrime.gov.in");
    expect(bySlug["cyber-safety-it-act"].helplines.join(" ")).toContain("1930");

    expect(allText(bySlug["zero-fir"])).toContain("173");
  });

  it("uses only categories the model allows", () => {
    const allowed = ["workplace", "domestic", "marriage", "cyber", "criminal", "media"];
    for (const right of legalRights) expect(allowed).toContain(right.category);
  });
});

describe("GET /api/admin/legal", () => {
  it("returns 401 without a token and 403 for a normal user", async () => {
    const user = await createUser();

    expect((await request(app).get("/api/admin/legal")).status).toBe(401);
    expect((await request(app).get("/api/admin/legal").set(authHeader(user))).status).toBe(403);
  });

  it("lists unpublished rights, unlike the public endpoint", async () => {
    const admin = await createAdmin();
    await LegalRight.updateOne({ slug: "zero-fir" }, { isPublished: false });

    const adminList = await request(app).get("/api/admin/legal?limit=50").set(authHeader(admin));
    expect(adminList.status).toBe(200);
    expect(adminList.body.meta.total).toBe(legalRights.length);
    expect(adminList.body.data.map((r) => r.slug)).toContain("zero-fir");

    const publicList = await request(app).get("/api/legal/rights?limit=50");
    expect(publicList.body.meta.total).toBe(legalRights.length - 1);
  });

  it("filters by isPublished in both directions", async () => {
    const admin = await createAdmin();
    await LegalRight.updateOne({ slug: "zero-fir" }, { isPublished: false });

    const hidden = await request(app).get("/api/admin/legal?isPublished=false").set(authHeader(admin));
    expect(hidden.body.meta.total).toBe(1);
    expect(hidden.body.data[0].slug).toBe("zero-fir");

    const shown = await request(app).get("/api/admin/legal?isPublished=true&limit=50").set(authHeader(admin));
    expect(shown.body.meta.total).toBe(legalRights.length - 1);
  });

  it("filters by category and searches, including unpublished entries", async () => {
    const admin = await createAdmin();
    await LegalRight.updateOne({ slug: "posh-act-2013" }, { isPublished: false });

    const byCategory = await request(app).get("/api/admin/legal?category=workplace").set(authHeader(admin));
    expect(byCategory.body.data.map((r) => r.slug).sort()).toEqual([
      "maternity-benefit-act",
      "posh-act-2013",
    ]);

    const bySearch = await request(app).get("/api/admin/legal?search=POSH").set(authHeader(admin));
    expect(bySearch.body.data.map((r) => r.slug)).toContain("posh-act-2013");
  });

  it("paginates and rejects a bad filter value", async () => {
    const admin = await createAdmin();

    const paged = await request(app).get("/api/admin/legal?page=1&limit=3").set(authHeader(admin));
    expect(paged.body.data).toHaveLength(3);
    expect(paged.body.meta).toEqual({ page: 1, limit: 3, total: legalRights.length });

    expect((await request(app).get("/api/admin/legal?isPublished=maybe").set(authHeader(admin))).status).toBe(400);
    expect((await request(app).get("/api/admin/legal?category=traffic").set(authHeader(admin))).status).toBe(400);
  });

  it("lets an admin find and re-publish a right it had hidden", async () => {
    const admin = await createAdmin();
    await LegalRight.updateOne({ slug: "zero-fir" }, { isPublished: false });

    const hidden = await request(app).get("/api/admin/legal?isPublished=false").set(authHeader(admin));
    const id = hidden.body.data[0].id;

    const republished = await request(app)
      .patch(`/api/admin/legal/${id}`)
      .set(authHeader(admin))
      .send({ isPublished: true });
    expect(republished.status).toBe(200);

    expect((await request(app).get("/api/legal/rights/zero-fir")).status).toBe(200);
  });
});

describe("admin legal management", () => {
  const newRight = {
    slug: "test-act-2026",
    title: "A Test Protection",
    actName: "Test Protection Act",
    year: 2026,
    category: "criminal",
    summary: "A summary that is long enough to be meaningful for the purposes of this test case.",
    keyProtections: ["Section 1: something protective."],
    howToFile: ["Go to the station."],
    penalties: "Up to 1 year.",
    helplines: ["112"],
  };

  it("returns 401 without a token", async () => {
    expect((await request(app).post("/api/admin/legal").send(newRight)).status).toBe(401);
  });

  it("returns 403 for a normal user on every admin legal route", async () => {
    const user = await createUser();
    const existing = await LegalRight.findOne({ slug: "zero-fir" });

    expect((await request(app).post("/api/admin/legal").set(authHeader(user)).send(newRight)).status).toBe(403);
    expect(
      (await request(app).patch(`/api/admin/legal/${existing.id}`).set(authHeader(user)).send({ title: "Hijacked" })).status
    ).toBe(403);
    expect((await request(app).delete(`/api/admin/legal/${existing.id}`).set(authHeader(user))).status).toBe(403);
    expect((await LegalRight.findById(existing.id)).title).toBe(existing.title);
  });

  it("lets an admin create, update and delete a right", async () => {
    const admin = await createAdmin();

    const createdRes = await request(app).post("/api/admin/legal").set(authHeader(admin)).send(newRight);
    expect(createdRes.status).toBe(201);
    expect(createdRes.body.data.right.slug).toBe("test-act-2026");

    const id = createdRes.body.data.right.id;
    const patched = await request(app)
      .patch(`/api/admin/legal/${id}`)
      .set(authHeader(admin))
      .send({ title: "An Updated Protection", isPublished: false });
    expect(patched.status).toBe(200);
    expect(patched.body.data.right.title).toBe("An Updated Protection");

    // unpublished, so the public list must not show it
    expect((await request(app).get("/api/legal/rights/test-act-2026")).status).toBe(404);

    const deleted = await request(app).delete(`/api/admin/legal/${id}`).set(authHeader(admin));
    expect(deleted.status).toBe(204);
    expect(await LegalRight.findById(id)).toBeNull();
  });

  it("rejects a duplicate slug with 409", async () => {
    const admin = await createAdmin();
    const res = await request(app)
      .post("/api/admin/legal")
      .set(authHeader(admin))
      .send({ ...newRight, slug: "zero-fir" });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("DUPLICATE_KEY");
  });

  it("rejects an invalid slug or category with 400", async () => {
    const admin = await createAdmin();

    const badSlug = await request(app)
      .post("/api/admin/legal")
      .set(authHeader(admin))
      .send({ ...newRight, slug: "Not A Slug" });
    expect(badSlug.status).toBe(400);

    const badCategory = await request(app)
      .post("/api/admin/legal")
      .set(authHeader(admin))
      .send({ ...newRight, category: "traffic" });
    expect(badCategory.status).toBe(400);
  });

  it("rejects an empty update and an unknown id", async () => {
    const admin = await createAdmin();
    const existing = await LegalRight.findOne({ slug: "zero-fir" });

    expect((await request(app).patch(`/api/admin/legal/${existing.id}`).set(authHeader(admin)).send({})).status).toBe(400);
    expect(
      (await request(app).patch("/api/admin/legal/64b7f0000000000000000000").set(authHeader(admin)).send({ title: "X" }))
        .status
    ).toBe(404);
  });
});
