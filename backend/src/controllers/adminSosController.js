import * as sosService from "../services/sosService.js";
import { ok, paginated } from "../utils/apiResponse.js";
import { parsePagination } from "../utils/pagination.js";

export async function listAllSosEvents(req, res) {
  const { page, limit, skip } = parsePagination(req.query);
  const { events, meta } = await sosService.listAllSosEvents({ page, limit, skip, status: req.query.status });
  return paginated(res, events, meta);
}

export async function resolveSosEvent(req, res) {
  const event = await sosService.closeSosEvent({ id: req.params.id, status: "resolved" });
  return ok(res, { event });
}
