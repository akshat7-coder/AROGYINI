import * as adminUserService from "../services/adminUserService.js";
import * as statsService from "../services/statsService.js";
import { ok, paginated } from "../utils/apiResponse.js";
import { parsePagination } from "../utils/pagination.js";

export async function listUsers(req, res) {
  const { page, limit, skip } = parsePagination(req.query);
  const { users, meta } = await adminUserService.listUsers({ page, limit, skip, ...req.query });
  return paginated(res, users, meta);
}

export async function setUserRole(req, res) {
  const user = await adminUserService.setUserRole(req.user, req.params.id, req.body.role);
  return ok(res, { user });
}

export async function setUserStatus(req, res) {
  const user = await adminUserService.setUserStatus(req.user, req.params.id, req.body.isActive);
  return ok(res, { user });
}

export async function getStats(req, res) {
  return ok(res, await statsService.getStats());
}
