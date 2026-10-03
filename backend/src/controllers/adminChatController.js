import * as adminChatService from "../services/chat/adminChatService.js";
import { ok, paginated } from "../utils/apiResponse.js";
import { parsePagination } from "../utils/pagination.js";

export async function listIssues(req, res) {
  const { page, limit, skip } = parsePagination(req.query);
  const { issues, meta } = await adminChatService.listIssues({ page, limit, skip, ...req.query });
  return paginated(res, issues, meta);
}

export async function updateIssue(req, res) {
  return ok(res, { issue: await adminChatService.updateIssue(req.user, req.params.id, req.body) });
}

export async function retryIssue(req, res) {
  return ok(res, await adminChatService.retryIssue(req.user, req.params.id));
}

export async function listBots(req, res) {
  return ok(res, { bots: await adminChatService.listBots() });
}

export async function updateBot(req, res) {
  return ok(res, { bot: await adminChatService.updateBot(req.params.key, req.body) });
}

export async function testBot(req, res) {
  return ok(res, await adminChatService.testBot(req.params.key));
}
