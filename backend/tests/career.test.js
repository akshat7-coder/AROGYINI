import request from "supertest";
import app from "../src/app.js";
import Job from "../src/models/Job.js";
import Scholarship from "../src/models/Scholarship.js";
import Application from "../src/models/Application.js";
import User from "../src/models/User.js";
import { jobs as seedJobs } from "../src/seed/data/jobs.js";
import { scholarships as seedScholarships } from "../src/seed/data/scholarships.js";
import { createUser, authHeader } from "./helpers.js";

const daysFromNow = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

beforeEach(async () => {
  await Job.insertMany(seedJobs);
});

describe("GET /api/career/jobs", () => {
  it("is public and lists active jobs newest first", async () => {
    const res = await request(app).get("/api/career/jobs?limit=50");

    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(seedJobs.length);
    const postedAt = res.body.data.map((j) => new Date(j.postedAt).getTime());
    expect(postedAt).toEqual([...postedAt].sort((a, b) => b - a));
  });

  it("paginates", async () => {
    const res = await request(app).get("/api/career/jobs?page=2&limit=3");

    expect(res.body.data).toHaveLength(3);
    expect(res.body.meta).toEqual({ page: 2, limit: 3, total: seedJobs.length });
  });

  it("filters by type", async () => {
    const res = await request(app).get("/api/career/jobs?type=returnship");

    expect(res.body.meta.total).toBe(2);
    expect(res.body.data.every((j) => j.type === "returnship")).toBe(true);
  });

  it("rejects an unknown type", async () => {
    const res = await request(app).get("/api/career/jobs?type=freelance");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("filters by category", async () => {
    const res = await request(app).get("/api/career/jobs?category=engineering");

    expect(res.body.meta.total).toBe(2);
    expect(res.body.data.every((j) => j.category === "engineering")).toBe(true);
  });

  it("filters by careerBreakFriendly in both directions", async () => {
    const friendly = await request(app).get("/api/career/jobs?careerBreakFriendly=true&limit=50");
    expect(friendly.body.data.length).toBeGreaterThan(0);
    expect(friendly.body.data.every((j) => j.careerBreakFriendly === true)).toBe(true);

    const notFriendly = await request(app).get("/api/career/jobs?careerBreakFriendly=false&limit=50");
    expect(notFriendly.body.data.every((j) => j.careerBreakFriendly === false)).toBe(true);
    expect(friendly.body.meta.total + notFriendly.body.meta.total).toBe(seedJobs.length);
  });

  it("rejects a non-boolean careerBreakFriendly", async () => {
    expect((await request(app).get("/api/career/jobs?careerBreakFriendly=yes")).status).toBe(400);
  });

  it("searches title, company and description, case insensitively and literally", async () => {
    const byTitle = await request(app).get("/api/career/jobs?search=frontend");
    expect(byTitle.body.data.map((j) => j.title)).toEqual(["Frontend Developer (React)"]);

    const byCompany = await request(app).get("/api/career/jobs?search=AMAZON");
    expect(byCompany.body.meta.total).toBe(1);

    const byDescription = await request(app).get("/api/career/jobs?search=usability sessions");
    expect(byDescription.body.meta.total).toBe(1);

    const regexChars = await request(app).get("/api/career/jobs?search=.*");
    expect(regexChars.body.meta.total).toBe(0);
  });

  it("combines filters", async () => {
    const res = await request(app).get("/api/career/jobs?type=returnship&careerBreakFriendly=true&search=engineer");

    expect(res.body.meta.total).toBe(1);
    expect(res.body.data[0].company).toContain("Tata");
  });

  it("hides inactive jobs from the list", async () => {
    await Job.updateOne({ type: "internship" }, { isActive: false });

    const res = await request(app).get("/api/career/jobs?limit=50");

    expect(res.body.meta.total).toBe(seedJobs.length - 1);
    expect(res.body.data.every((j) => j.type !== "internship")).toBe(true);
  });
});

describe("GET /api/career/jobs/:id", () => {
  it("returns a single active job", async () => {
    const job = await Job.findOne({ type: "returnship" });
    const res = await request(app).get(`/api/career/jobs/${job.id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.job.id).toBe(job.id);
    expect(res.body.data.job.requirements.length).toBeGreaterThan(0);
  });

  it("returns 404 for an inactive job", async () => {
    const job = await Job.findOne();
    await Job.updateOne({ _id: job.id }, { isActive: false });

    expect((await request(app).get(`/api/career/jobs/${job.id}`)).status).toBe(404);
  });

  it("returns 404 for an unknown id and 400 for a malformed one", async () => {
    expect((await request(app).get("/api/career/jobs/64b7f0000000000000000000")).status).toBe(404);
    expect((await request(app).get("/api/career/jobs/nope")).status).toBe(400);
  });
});

describe("save toggle", () => {
  it("requires authentication", async () => {
    const job = await Job.findOne();
    expect((await request(app).post(`/api/career/jobs/${job.id}/save`)).status).toBe(401);
    expect((await request(app).get("/api/career/saved")).status).toBe(401);
  });

  it("saves then unsaves on repeat calls", async () => {
    const user = await createUser();
    const job = await Job.findOne();

    const first = await request(app).post(`/api/career/jobs/${job.id}/save`).set(authHeader(user));
    expect(first.status).toBe(200);
    expect(first.body.data).toEqual({ saved: true });
    expect((await User.findById(user.id)).savedJobs.map(String)).toEqual([job.id]);

    const second = await request(app).post(`/api/career/jobs/${job.id}/save`).set(authHeader(user));
    expect(second.body.data).toEqual({ saved: false });
    expect((await User.findById(user.id)).savedJobs).toHaveLength(0);
  });

  it("does not duplicate a job that is saved twice concurrently", async () => {
    const user = await createUser();
    const job = await Job.findOne();
    await request(app).post(`/api/career/jobs/${job.id}/save`).set(authHeader(user));
    await User.updateOne({ _id: user.id }, { $addToSet: { savedJobs: job.id } });

    expect((await User.findById(user.id)).savedJobs).toHaveLength(1);
  });

  it("lists only the caller's saved jobs", async () => {
    const user = await createUser();
    const other = await createUser();
    const [a, b] = await Job.find().limit(2);
    await request(app).post(`/api/career/jobs/${a.id}/save`).set(authHeader(user));
    await request(app).post(`/api/career/jobs/${b.id}/save`).set(authHeader(other));

    const res = await request(app).get("/api/career/saved").set(authHeader(user));

    expect(res.status).toBe(200);
    expect(res.body.data.jobs.map((j) => j.id)).toEqual([a.id]);
    expect(res.body.data.jobs[0].title).toBe(a.title);
  });

  it("cannot save an inactive job", async () => {
    const user = await createUser();
    const job = await Job.findOne();
    await Job.updateOne({ _id: job.id }, { isActive: false });

    expect((await request(app).post(`/api/career/jobs/${job.id}/save`).set(authHeader(user))).status).toBe(404);
  });
});

describe("applying to a job", () => {
  it("requires authentication", async () => {
    const job = await Job.findOne();
    expect((await request(app).post(`/api/career/jobs/${job.id}/apply`).send({})).status).toBe(401);
  });

  it("records an application with the cover note", async () => {
    const user = await createUser();
    const job = await Job.findOne();

    const res = await request(app)
      .post(`/api/career/jobs/${job.id}/apply`)
      .set(authHeader(user))
      .send({ coverNote: "I have five years of relevant experience and am returning from a break." });

    expect(res.status).toBe(201);
    expect(res.body.data.application).toMatchObject({ status: "submitted" });
    expect(res.body.data.application.coverNote).toContain("five years");
    expect(await Application.countDocuments({ user: user.id, job: job.id })).toBe(1);
  });

  it("returns 409 on a duplicate application", async () => {
    const user = await createUser();
    const job = await Job.findOne();
    await request(app).post(`/api/career/jobs/${job.id}/apply`).set(authHeader(user)).send({});

    const again = await request(app).post(`/api/career/jobs/${job.id}/apply`).set(authHeader(user)).send({});

    expect(again.status).toBe(409);
    expect(again.body.error.code).toBe("ALREADY_APPLIED");
    expect(await Application.countDocuments({ user: user.id })).toBe(1);
  });

  it("lets two different users apply to the same job", async () => {
    const [a, b] = [await createUser(), await createUser()];
    const job = await Job.findOne();

    await request(app).post(`/api/career/jobs/${job.id}/apply`).set(authHeader(a)).send({});
    const second = await request(app).post(`/api/career/jobs/${job.id}/apply`).set(authHeader(b)).send({});

    expect(second.status).toBe(201);
  });

  it("cannot apply to an inactive job", async () => {
    const user = await createUser();
    const job = await Job.findOne();
    await Job.updateOne({ _id: job.id }, { isActive: false });

    expect((await request(app).post(`/api/career/jobs/${job.id}/apply`).set(authHeader(user)).send({})).status).toBe(404);
  });

  it("rejects an over-long cover note", async () => {
    const user = await createUser();
    const job = await Job.findOne();

    const res = await request(app)
      .post(`/api/career/jobs/${job.id}/apply`)
      .set(authHeader(user))
      .send({ coverNote: "x".repeat(1001) });

    expect(res.status).toBe(400);
  });

  it("lists only the caller's applications with the job populated", async () => {
    const user = await createUser();
    const other = await createUser();
    const [a, b] = await Job.find().limit(2);
    await request(app).post(`/api/career/jobs/${a.id}/apply`).set(authHeader(user)).send({});
    await request(app).post(`/api/career/jobs/${b.id}/apply`).set(authHeader(other)).send({});

    const res = await request(app).get("/api/career/applications").set(authHeader(user));

    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(1);
    expect(res.body.data[0].job).toMatchObject({ id: a.id, title: a.title });
  });
});

describe("GET /api/career/scholarships", () => {
  beforeEach(async () => {
    await Scholarship.insertMany(seedScholarships);
  });

  it("is public and hides expired deadlines by default", async () => {
    await Scholarship.create({
      title: "Closed Scheme",
      provider: "Old Trust",
      deadline: daysFromNow(-10),
      domain: "science",
    });

    const res = await request(app).get("/api/career/scholarships?limit=50");

    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(seedScholarships.length);
    expect(res.body.data.map((s) => s.title)).not.toContain("Closed Scheme");
  });

  it("includes expired ones on request, after the upcoming ones", async () => {
    await Scholarship.create({
      title: "Closed Scheme",
      provider: "Old Trust",
      deadline: daysFromNow(-10),
      domain: "science",
    });

    const res = await request(app).get("/api/career/scholarships?includeExpired=true&limit=50");

    expect(res.body.meta.total).toBe(seedScholarships.length + 1);
    expect(res.body.data.at(-1).title).toBe("Closed Scheme");
  });

  it("keeps rolling schemes with no deadline and sorts the rest by nearest deadline", async () => {
    const res = await request(app).get("/api/career/scholarships?limit=50");

    const titles = res.body.data.map((s) => s.title);
    expect(titles).toContain("Stand-Up India Scheme");

    const dated = res.body.data.filter((s) => s.deadline).map((s) => new Date(s.deadline).getTime());
    expect(dated).toEqual([...dated].sort((a, b) => a - b));
  });

  it("maps _id to id through the aggregation", async () => {
    const res = await request(app).get("/api/career/scholarships?limit=1");

    expect(res.body.data[0].id).toEqual(expect.any(String));
    expect(res.body.data[0]).not.toHaveProperty("_id");
    expect(res.body.data[0]).not.toHaveProperty("expired");
    expect(res.body.data[0]).not.toHaveProperty("__v");
  });

  it("filters by domain and paginates", async () => {
    const res = await request(app).get("/api/career/scholarships?domain=entrepreneurship");

    expect(res.body.meta.total).toBe(1);
    expect(res.body.data[0].title).toBe("Stand-Up India Scheme");
  });

  it("marks amounts as approximate", async () => {
    const res = await request(app).get("/api/career/scholarships?limit=50");

    expect(res.body.data.every((s) => /approx/i.test(s.amount))).toBe(true);
  });
});

describe("seed data shape", () => {
  it("has eight jobs including two returnships", () => {
    expect(seedJobs).toHaveLength(8);
    expect(seedJobs.filter((j) => j.type === "returnship")).toHaveLength(2);
    expect(seedJobs.every((j) => j.title && j.company && j.description && j.type)).toBe(true);
  });

  it("has five scholarships, one of them rolling", () => {
    expect(seedScholarships).toHaveLength(5);
    expect(seedScholarships.filter((s) => s.deadline === null)).toHaveLength(1);
    expect(seedScholarships.every((s) => s.eligibility.length > 0 && s.link)).toBe(true);
  });
});
