import * as sosService from "../services/sosService.js";
import { ok, created, paginated } from "../utils/apiResponse.js";
import { parsePagination } from "../utils/pagination.js";

export async function triggerSos(req, res) {
  const { event, created: isNew } = await sosService.triggerSos(req.user, req.body);
  return isNew ? created(res, { event }) : ok(res, { event, alreadyActive: true });
}

export async function listSosEvents(req, res) {
  const pagination = parsePagination(req.query);
  const { events, meta } = await sosService.listSosEvents(req.user.id, pagination);
  return paginated(res, events, meta);
}

export async function getSosEvent(req, res) {
  return ok(res, { event: await sosService.getSosEvent(req.user.id, req.params.id) });
}

export async function resolveSosEvent(req, res) {
  const event = await sosService.closeSosEvent({
    id: req.params.id,
    userId: req.user.id,
    status: "resolved",
    notifyContacts: req.query.notify,
    user: req.user,
  });
  return ok(res, { event });
}

export async function cancelSosEvent(req, res) {
  const event = await sosService.closeSosEvent({ id: req.params.id, userId: req.user.id, status: "cancelled" });
  return ok(res, { event });
}
