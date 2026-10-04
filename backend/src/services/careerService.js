import Job from "../models/Job.js";
import Scholarship from "../models/Scholarship.js";
import Application from "../models/Application.js";
import User from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { todayUtc } from "../utils/dates.js";
import { escapeRegex } from "../utils/escapeRegex.js";

export async function listJobs({ page, limit, skip, type, category, search, careerBreakFriendly }) {
  const filter = { isActive: true };
  if (type) filter.type = type;
  if (category) filter.category = category;
  if (careerBreakFriendly !== undefined) filter.careerBreakFriendly = careerBreakFriendly;
  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ title: pattern }, { company: pattern }, { description: pattern }];
  }

  const [jobs, total] = await Promise.all([
    Job.find(filter).sort({ postedAt: -1 }).skip(skip).limit(limit),
    Job.countDocuments(filter),
  ]);
  return { jobs, meta: { page, limit, total } };
}

export async function getActiveJob(id) {
  const job = await Job.findOne({ _id: id, isActive: true });
  if (!job) throw new AppError(404, "NOT_FOUND", "Job not found");
  return job;
}

// Toggle, so the same endpoint saves and unsaves.
export async function toggleSavedJob(userId, jobId) {
  await getActiveJob(jobId);
  const user = await User.findById(userId).select("savedJobs");
  const alreadySaved = user.savedJobs.some((saved) => saved.equals(jobId));

  await User.updateOne({ _id: userId }, alreadySaved ? { $pull: { savedJobs: jobId } } : { $addToSet: { savedJobs: jobId } });
  return { saved: !alreadySaved };
}

export async function listSavedJobs(userId) {
  const user = await User.findById(userId).populate({ path: "savedJobs", options: { sort: { postedAt: -1 } } });
  return user.savedJobs;
}

export async function applyToJob(userId, jobId, coverNote) {
  await getActiveJob(jobId);
  if (await Application.exists({ user: userId, job: jobId })) {
    throw new AppError(409, "ALREADY_APPLIED", "You have already applied to this job");
  }
  return Application.create({ user: userId, job: jobId, coverNote });
}

export async function listApplications(userId, { page, limit, skip, status }) {
  const filter = { user: userId, ...(status ? { status } : {}) };
  const [applications, total] = await Promise.all([
    Application.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("job"),
    Application.countDocuments(filter),
  ]);
  return { applications, meta: { page, limit, total } };
}

export async function listScholarships({ page, limit, skip, domain, includeExpired }) {
  const today = todayUtc();
  const match = { isActive: true, ...(domain ? { domain } : {}) };
  if (!includeExpired) match.$or = [{ deadline: { $gte: today } }, { deadline: null }];

  // Sorting "upcoming first" needs a computed flag, so this goes through the aggregation
  // pipeline and is hydrated back into documents to keep the usual JSON shape.
  const expired = {
    $cond: [{ $and: [{ $ne: ["$deadline", null] }, { $lt: ["$deadline", today] }] }, true, false],
  };
  const [rows, total] = await Promise.all([
    Scholarship.aggregate([
      { $match: match },
      { $addFields: { expired } },
      { $sort: { expired: 1, deadline: 1, title: 1 } },
      { $skip: skip },
      { $limit: limit },
      { $unset: "expired" },
    ]),
    Scholarship.countDocuments(match),
  ]);

  return { scholarships: rows.map((row) => Scholarship.hydrate(row)), meta: { page, limit, total } };
}
