import * as legalService from "../services/legalService.js";
import { ok, created, noContent, paginated } from "../utils/apiResponse.js";
import { parsePagination } from "../utils/pagination.js";

export async function listRights(req, res) {
  const { page, limit, skip } = parsePagination(req.query);
  const { rights, meta } = await legalService.listRights({ page, limit, skip, ...req.query });
  return paginated(res, rights, meta);
}

export async function getRight(req, res) {
  return ok(res, { right: await legalService.getRightBySlug(req.params.slug) });
}

export async function createDraft(req, res) {
  return created(res, legalService.createDraft(req.body));
}

export async function listAllRights(req, res) {
  const { page, limit, skip } = parsePagination(req.query);
  const { rights, meta } = await legalService.listAllRights({ page, limit, skip, ...req.query });
  return paginated(res, rights, meta);
}

export async function createRight(req, res) {
  return created(res, { right: await legalService.createRight(req.body) });
}

export async function updateRight(req, res) {
  return ok(res, { right: await legalService.updateRight(req.params.id, req.body) });
}

export async function deleteRight(req, res) {
  await legalService.deleteRight(req.params.id);
  return noContent(res);
}
