import * as careerService from "../services/careerService.js";
import { ok, created, paginated } from "../utils/apiResponse.js";
import { parsePagination } from "../utils/pagination.js";

export async function listJobs(req, res) {
  const { page, limit, skip } = parsePagination(req.query);
  const { jobs, meta } = await careerService.listJobs({ page, limit, skip, ...req.query });
  return paginated(res, jobs, meta);
}

export async function getJob(req, res) {
  return ok(res, { job: await careerService.getActiveJob(req.params.id) });
}

export async function toggleSavedJob(req, res) {
  return ok(res, await careerService.toggleSavedJob(req.user.id, req.params.id));
}

export async function listSavedJobs(req, res) {
  return ok(res, { jobs: await careerService.listSavedJobs(req.user.id) });
}

export async function applyToJob(req, res) {
  const application = await careerService.applyToJob(req.user.id, req.params.id, req.body.coverNote);
  return created(res, { application });
}

export async function listApplications(req, res) {
  const { page, limit, skip } = parsePagination(req.query);
  const { applications, meta } = await careerService.listApplications(req.user.id, {
    page,
    limit,
    skip,
    status: req.query.status,
  });
  return paginated(res, applications, meta);
}

export async function listScholarships(req, res) {
  const { page, limit, skip } = parsePagination(req.query);
  const { scholarships, meta } = await careerService.listScholarships({ page, limit, skip, ...req.query });
  return paginated(res, scholarships, meta);
}
