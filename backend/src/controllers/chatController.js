import * as chatService from "../services/chat/chatService.js";
import { ok, created, noContent, paginated } from "../utils/apiResponse.js";
import { parsePagination } from "../utils/pagination.js";

export async function listBots(req, res) {
  return ok(res, { bots: await chatService.listBots() });
}

export async function createConversation(req, res) {
  return created(res, { conversation: await chatService.createConversation(req.user.id, req.body.title) });
}

export async function listConversations(req, res) {
  const { page, limit, skip } = parsePagination(req.query);
  const { conversations, meta } = await chatService.listConversations(req.user.id, { page, limit, skip });
  return paginated(res, conversations, meta);
}

export async function getConversation(req, res) {
  const { conversation, messages } = await chatService.getConversationWithMessages(req.user.id, req.params.id);
  return ok(res, { conversation, messages });
}

export async function deleteConversation(req, res) {
  await chatService.deleteConversation(req.user.id, req.params.id);
  return noContent(res);
}

export async function sendMessage(req, res) {
  const result = await chatService.sendMessage({
    user: req.user,
    conversationId: req.params.id,
    content: req.body.content,
    bot: req.body.bot,
  });
  return created(res, {
    conversation: result.conversation,
    userMessage: result.userMessage,
    message: result.assistantMessage,
  });
}

export async function reportMessage(req, res) {
  const issue = await chatService.reportMessage(req.user, req.params.id, req.body.reason);
  return created(res, { issue });
}
