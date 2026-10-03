import * as adminCareerService from "../services/adminCareerService.js";
import { ok, created, noContent, paginated } from "../utils/apiResponse.js";
import { parsePagination } from "../utils/pagination.js";

export async function listJobs(req, res) {
  const { page, limit, skip } = parsePagination(req.query);
  const { jobs, meta } = await adminCareerService.listJobs({ page, limit, skip, ...req.query });
  return paginated(res, jobs, meta);
}

export async function createJob(req, res) {
  return created(res, { job: await adminCareerService.createJob(req.body) });
}

export async function updateJob(req, res) {
  return ok(res, { job: await adminCareerService.updateJob(req.params.id, req.body) });
}

export async function deleteJob(req, res) {
  await adminCareerService.deleteJob(req.params.id);
  return noContent(res);
}

export async function listScholarships(req, res) {
  const { page, limit, skip } = parsePagination(req.query);
  const { scholarships, meta } = await adminCareerService.listScholarships({ page, limit, skip });
  return paginated(res, scholarships, meta);
}

export async function createScholarship(req, res) {
  return created(res, { scholarship: await adminCareerService.createScholarship(req.body) });
}

export async function updateScholarship(req, res) {
  return ok(res, { scholarship: await adminCareerService.updateScholarship(req.params.id, req.body) });
}

export async function deleteScholarship(req, res) {
  await adminCareerService.deleteScholarship(req.params.id);
  return noContent(res);
}

export async function listJobApplications(req, res) {
  const { page, limit, skip } = parsePagination(req.query);
  const { applications, meta } = await adminCareerService.listJobApplications(req.params.id, {
    page,
    limit,
    skip,
    status: req.query.status,
  });
  return paginated(res, applications, meta);
}

export async function setApplicationStatus(req, res) {
  const application = await adminCareerService.setApplicationStatus(req.params.id, req.body.status);
  return ok(res, { application });
}
