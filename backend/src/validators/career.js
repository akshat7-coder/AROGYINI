import { z } from "zod";
import { JOB_TYPES } from "../models/Job.js";
import { APPLICATION_STATUSES } from "../models/Application.js";

const text = (max) => z.string().trim().min(1).max(max);
const list = (max, itemMax = 400) => z.array(text(itemMax)).max(max);
const boolish = z
  .enum(["true", "false"])
  .transform((value) => value === "true");
const pagination = {
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
};

export const jobsQuerySchema = z.object({
  ...pagination,
  type: z.enum(JOB_TYPES).optional(),
  category: text(80).optional(),
  search: z.string().trim().max(120).optional(),
  careerBreakFriendly: boolish.optional(),
});

export const adminJobsQuerySchema = z.object({
  ...pagination,
  type: z.enum(JOB_TYPES).optional(),
  isActive: boolish.optional(),
});

export const scholarshipsQuerySchema = z.object({
  ...pagination,
  domain: text(80).optional(),
  includeExpired: boolish.optional(),
});

export const applySchema = z.object({
  coverNote: z.string().trim().max(1000).optional(),
});

export const applicationsQuerySchema = z.object({
  ...pagination,
  status: z.enum(APPLICATION_STATUSES).optional(),
});

export const applicationStatusSchema = z.object({ status: z.enum(APPLICATION_STATUSES) });

export const createJobSchema = z.object({
  title: text(160),
  company: text(160),
  location: text(160).optional(),
  type: z.enum(JOB_TYPES),
  category: text(80).optional(),
  salaryRange: text(120).optional(),
  experienceLevel: text(80).optional(),
  description: text(5000),
  requirements: list(30).optional(),
  benefits: list(30).optional(),
  careerBreakFriendly: z.boolean().optional(),
  applyUrl: z.url().max(500).optional(),
  isActive: z.boolean().optional(),
  postedAt: z.coerce.date().optional(),
});

export const updateJobSchema = createJobSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, { error: "Provide at least one field to update" });

export const createScholarshipSchema = z.object({
  title: text(200),
  provider: text(200),
  amount: text(160).optional(),
  eligibility: list(30).optional(),
  deadline: z.coerce.date().nullable().optional(),
  link: z.url().max(500).optional(),
  domain: text(80).optional(),
  isActive: z.boolean().optional(),
});

export const updateScholarshipSchema = createScholarshipSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, { error: "Provide at least one field to update" });
