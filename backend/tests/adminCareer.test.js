import request from "supertest";
import app from "../src/app.js";
import Job from "../src/models/Job.js";
import Scholarship from "../src/models/Scholarship.js";
import Application from "../src/models/Application.js";
import { jobs as seedJobs } from "../src/seed/data/jobs.js";
import { createUser, createAdmin, authHeader } from "./helpers.js";

const newJob = {
  title: "Backend Engineer",
  company: "Example Works",
  location: "Remote (India)",
  type: "remote",
  category: "engineering",
  description: "Build and run HTTP services for a small product team, with on-call shared across four people.",
  requirements: ["3 years with Node.js or Python"],
  benefits: ["Fully remote"],
  careerBreakFriendly: true,
  applyUrl: "https://example.com/careers/backend",
};

const newScholarship = {
  title: "Example Women in STEM Grant",
  provider: "Example Foundation",
  amount: "Approx Rs 1,00,000 per year",
  eligibility: ["Women enrolled in an undergraduate STEM programme"],
  deadline: "2027-03-31",
  link: "https://example.com/grant",
  domain: "science",
};

beforeEach(async () => {
  await Job.insertMany(seedJobs);
});

describe("RBAC on admin career routes", () => {
  it("returns 401 without a token", async () => {
    expect((await request(app).get("/api/admin/jobs")).status).toBe(401);
    expect((await request(app).post("/api/admin/jobs").send(newJob)).status).toBe(401);
  });

  it("returns 403 for a normal user on every admin career route", async () => {
    const user = await createUser();
    const job = await Job.findOne();
    const header = authHeader(user);

    const calls = [
      request(app).get("/api/admin/jobs").set(header),
      request(app).post("/api/admin/jobs").set(header).send(newJob),
      request(app).patch(`/api/admin/jobs/${job.id}`).set(header).send({ title: "Hijacked" }),
      request(app).delete(`/api/admin/jobs/${job.id}`).set(header),
      request(app).get(`/api/admin/jobs/${job.id}/applications`).set(header),
      request(app).get("/api/admin/scholarships").set(header),
      request(app).post("/api/admin/scholarships").set(header).send(newScholarship),
    ];
    for (const res of await Promise.all(calls)) expect(res.status).toBe(403);

    expect((await Job.findById(job.id)).title).toBe(job.title);
  });
});

describe("admin job CRUD", () => {
  it("lists jobs including inactive ones", async () => {
    const admin = await createAdmin();
    await Job.updateOne({ type: "internship" }, { isActive: false });

    const all = await request(app).get("/api/admin/jobs?limit=50").set(authHeader(admin));
    expect(all.body.meta.total).toBe(seedJobs.length);

    const inactive = await request(app).get("/api/admin/jobs?isActive=false").set(authHeader(admin));
    expect(inactive.body.meta.total).toBe(1);

    const publicList = await request(app).get("/api/career/jobs?limit=50");
    expect(publicList.body.meta.total).toBe(seedJobs.length - 1);
  });

  it("creates, updates and deletes a job", async () => {
    const admin = await createAdmin();

    const createdRes = await request(app).post("/api/admin/jobs").set(authHeader(admin)).send(newJob);
    expect(createdRes.status).toBe(201);
    expect(createdRes.body.data.job).toMatchObject({ title: "Backend Engineer", type: "remote", isActive: true });
    const id = createdRes.body.data.job.id;

    const patched = await request(app)
      .patch(`/api/admin/jobs/${id}`)
      .set(authHeader(admin))
      .send({ salaryRange: "Approx Rs 20,00,000 per year", isActive: false });
    expect(patched.status).toBe(200);
    expect(patched.body.data.job.salaryRange).toBe("Approx Rs 20,00,000 per year");

    // deactivated, so the public endpoints must not serve it
    expect((await request(app).get(`/api/career/jobs/${id}`)).status).toBe(404);

    const deleted = await request(app).delete(`/api/admin/jobs/${id}`).set(authHeader(admin));
    expect(deleted.status).toBe(204);
    expect(await Job.findById(id)).toBeNull();
  });

  it("removes a deleted job's applications with it", async () => {
    const admin = await createAdmin();
    const user = await createUser();
    const job = await Job.findOne();
    await request(app).post(`/api/career/jobs/${job.id}/apply`).set(authHeader(user)).send({});
    expect(await Application.countDocuments({ job: job.id })).toBe(1);

    await request(app).delete(`/api/admin/jobs/${job.id}`).set(authHeader(admin));

    expect(await Application.countDocuments({ job: job.id })).toBe(0);
  });

  it("validates the payload", async () => {
    const admin = await createAdmin();

    const missing = await request(app)
      .post("/api/admin/jobs")
      .set(authHeader(admin))
      .send({ title: "Only a title" });
    expect(missing.status).toBe(400);
    expect(missing.body.error.details.map((d) => d.field)).toEqual(expect.arrayContaining(["company", "type", "description"]));

    const badType = await request(app).post("/api/admin/jobs").set(authHeader(admin)).send({ ...newJob, type: "contract" });
    expect(badType.status).toBe(400);

    const badUrl = await request(app).post("/api/admin/jobs").set(authHeader(admin)).send({ ...newJob, applyUrl: "not-a-url" });
    expect(badUrl.status).toBe(400);

    const empty = await request(app).patch(`/api/admin/jobs/${(await Job.findOne()).id}`).set(authHeader(admin)).send({});
    expect(empty.status).toBe(400);
  });

  it("returns 404 for an unknown job id", async () => {
    const admin = await createAdmin();
    const missing = "64b7f0000000000000000000";

    expect((await request(app).patch(`/api/admin/jobs/${missing}`).set(authHeader(admin)).send({ title: "X" })).status).toBe(404);
    expect((await request(app).delete(`/api/admin/jobs/${missing}`).set(authHeader(admin))).status).toBe(404);
    expect((await request(app).get(`/api/admin/jobs/${missing}/applications`).set(authHeader(admin))).status).toBe(404);
  });
});

describe("admin scholarship CRUD", () => {
  it("creates, updates and deletes a scholarship", async () => {
    const admin = await createAdmin();

    const createdRes = await request(app).post("/api/admin/scholarships").set(authHeader(admin)).send(newScholarship);
    expect(createdRes.status).toBe(201);
    const id = createdRes.body.data.scholarship.id;
    expect(createdRes.body.data.scholarship.eligibility).toHaveLength(1);

    const patched = await request(app)
      .patch(`/api/admin/scholarships/${id}`)
      .set(authHeader(admin))
      .send({ amount: "Approx Rs 1,50,000 per year" });
    expect(patched.body.data.scholarship.amount).toBe("Approx Rs 1,50,000 per year");

    const listed = await request(app).get("/api/admin/scholarships").set(authHeader(admin));
    expect(listed.body.meta.total).toBe(1);

    expect((await request(app).delete(`/api/admin/scholarships/${id}`).set(authHeader(admin))).status).toBe(204);
    expect(await Scholarship.findById(id)).toBeNull();
  });

  it("accepts a null deadline for a rolling scheme", async () => {
    const admin = await createAdmin();
    const res = await request(app)
      .post("/api/admin/scholarships")
      .set(authHeader(admin))
      .send({ ...newScholarship, deadline: null });

    expect(res.status).toBe(201);
    expect(res.body.data.scholarship.deadline).toBeNull();

    const listed = await request(app).get("/api/career/scholarships");
    expect(listed.body.meta.total).toBe(1);
  });

  it("validates the payload", async () => {
    const admin = await createAdmin();

    const missing = await request(app).post("/api/admin/scholarships").set(authHeader(admin)).send({ title: "Only a title" });
    expect(missing.status).toBe(400);
    expect(missing.body.error.details.map((d) => d.field)).toContain("provider");

    const badDate = await request(app)
      .post("/api/admin/scholarships")
      .set(authHeader(admin))
      .send({ ...newScholarship, deadline: "whenever" });
    expect(badDate.status).toBe(400);
  });
});

describe("admin applications", () => {
  it("lists a job's applications with the applicant populated", async () => {
    const admin = await createAdmin();
    const [a, b] = [await createUser({ name: "Asha Rao" }), await createUser({ name: "Bela Das" })];
    const [job, otherJob] = await Job.find().limit(2);

    await request(app).post(`/api/career/jobs/${job.id}/apply`).set(authHeader(a)).send({ coverNote: "Keen to apply." });
    await request(app).post(`/api/career/jobs/${job.id}/apply`).set(authHeader(b)).send({});
    await request(app).post(`/api/career/jobs/${otherJob.id}/apply`).set(authHeader(a)).send({});

    const res = await request(app).get(`/api/admin/jobs/${job.id}/applications`).set(authHeader(admin));

    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(2);
    expect(res.body.data.map((app_) => app_.user.name).sort()).toEqual(["Asha Rao", "Bela Das"]);
    expect(res.body.data[0].user).toHaveProperty("email");
    expect(res.body.data[0].user).not.toHaveProperty("passwordHash");
  });

  it("filters a job's applications by status", async () => {
    const admin = await createAdmin();
    const user = await createUser();
    const job = await Job.findOne();
    const { body } = await request(app).post(`/api/career/jobs/${job.id}/apply`).set(authHeader(user)).send({});

    await request(app)
      .patch(`/api/admin/applications/${body.data.application.id}`)
      .set(authHeader(admin))
      .send({ status: "reviewed" });

    const reviewed = await request(app).get(`/api/admin/jobs/${job.id}/applications?status=reviewed`).set(authHeader(admin));
    expect(reviewed.body.meta.total).toBe(1);

    const submitted = await request(app).get(`/api/admin/jobs/${job.id}/applications?status=submitted`).set(authHeader(admin));
    expect(submitted.body.meta.total).toBe(0);
  });

  it("updates an application status, and the applicant sees it", async () => {
    const admin = await createAdmin();
    const user = await createUser();
    const job = await Job.findOne();
    const { body } = await request(app).post(`/api/career/jobs/${job.id}/apply`).set(authHeader(user)).send({});

    const res = await request(app)
      .patch(`/api/admin/applications/${body.data.application.id}`)
      .set(authHeader(admin))
      .send({ status: "accepted" });

    expect(res.status).toBe(200);
    expect(res.body.data.application.status).toBe("accepted");

    const mine = await request(app).get("/api/career/applications").set(authHeader(user));
    expect(mine.body.data[0].status).toBe("accepted");
  });

  it("rejects an unknown status and a normal user", async () => {
    const admin = await createAdmin();
    const user = await createUser();
    const job = await Job.findOne();
    const { body } = await request(app).post(`/api/career/jobs/${job.id}/apply`).set(authHeader(user)).send({});
    const id = body.data.application.id;

    const badStatus = await request(app).patch(`/api/admin/applications/${id}`).set(authHeader(admin)).send({ status: "maybe" });
    expect(badStatus.status).toBe(400);

    const asUser = await request(app).patch(`/api/admin/applications/${id}`).set(authHeader(user)).send({ status: "accepted" });
    expect(asUser.status).toBe(403);
    expect((await Application.findById(id)).status).toBe("submitted");
  });

  it("returns 404 for an unknown application", async () => {
    const admin = await createAdmin();
    const res = await request(app)
      .patch("/api/admin/applications/64b7f0000000000000000000")
      .set(authHeader(admin))
      .send({ status: "reviewed" });

    expect(res.status).toBe(404);
  });
});

describe("GET /api/admin/stats", () => {
  it("counts jobs, active jobs, applications and scholarships", async () => {
    const admin = await createAdmin();
    const user = await createUser();
    const job = await Job.findOne();
    await Job.updateOne({ type: "internship" }, { isActive: false });
    await Scholarship.create({ title: "A Grant", provider: "Someone" });
    await request(app).post(`/api/career/jobs/${job.id}/apply`).set(authHeader(user)).send({});

    const res = await request(app).get("/api/admin/stats").set(authHeader(admin));

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      jobs: seedJobs.length,
      activeJobs: seedJobs.length - 1,
      applications: 1,
      scholarships: 1,
    });
  });
});
