import Job from "../models/Job.js";
import Scholarship from "../models/Scholarship.js";
import Application from "../models/Application.js";
import { AppError } from "../utils/AppError.js";

const found = (doc, what) => {
  if (!doc) throw new AppError(404, "NOT_FOUND", `${what} not found`);
  return doc;
};

// Admin listings show inactive rows too, unlike the public ones.
export async function listJobs({ page, limit, skip, type, isActive }) {
  const filter = { ...(type ? { type } : {}), ...(isActive === undefined ? {} : { isActive }) };
  const [jobs, total] = await Promise.all([
    Job.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Job.countDocuments(filter),
  ]);
  return { jobs, meta: { page, limit, total } };
}

export const createJob = (payload) => Job.create(payload);

export async function updateJob(id, payload) {
  return found(await Job.findByIdAndUpdate(id, payload, { returnDocument: "after", runValidators: true }), "Job");
}

export async function deleteJob(id) {
  const job = found(await Job.findByIdAndDelete(id), "Job");
  await Application.deleteMany({ job: id });
  return job;
}

export async function listScholarships({ page, limit, skip }) {
  const [scholarships, total] = await Promise.all([
    Scholarship.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    Scholarship.countDocuments(),
  ]);
  return { scholarships, meta: { page, limit, total } };
}

export const createScholarship = (payload) => Scholarship.create(payload);

export async function updateScholarship(id, payload) {
  return found(
    await Scholarship.findByIdAndUpdate(id, payload, { returnDocument: "after", runValidators: true }),
    "Scholarship"
  );
}

export async function deleteScholarship(id) {
  return found(await Scholarship.findByIdAndDelete(id), "Scholarship");
}

export async function listJobApplications(jobId, { page, limit, skip, status }) {
  found(await Job.findById(jobId), "Job");
  const filter = { job: jobId, ...(status ? { status } : {}) };
  const [applications, total] = await Promise.all([
    Application.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("user", "name email phone city"),
    Application.countDocuments(filter),
  ]);
  return { applications, meta: { page, limit, total } };
}

export async function setApplicationStatus(id, status) {
  return found(
    await Application.findByIdAndUpdate(id, { status }, { returnDocument: "after", runValidators: true }),
    "Application"
  );
}
