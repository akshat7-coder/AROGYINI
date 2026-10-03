import * as cycleService from "../services/cycleService.js";
import { ok, created, noContent, paginated } from "../utils/apiResponse.js";
import { parsePagination } from "../utils/pagination.js";

export async function listCycles(req, res) {
  const pagination = parsePagination(req.query);
  const { logs, meta } = await cycleService.listCycles(req.user.id, pagination);
  return paginated(res, logs, meta);
}

export async function createCycle(req, res) {
  return created(res, { log: await cycleService.createCycle(req.user.id, req.body) });
}

export async function updateCycle(req, res) {
  return ok(res, { log: await cycleService.updateCycle(req.user.id, req.params.id, req.body) });
}

export async function deleteCycle(req, res) {
  await cycleService.deleteCycle(req.user.id, req.params.id);
  return noContent(res);
}

export async function getSummary(req, res) {
  return ok(res, await cycleService.getSummary(req.user.id));
}
