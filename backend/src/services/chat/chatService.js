import axios from "axios";
import Conversation, { DEFAULT_TITLE, TITLE_MAX } from "../../models/Conversation.js";
import Message from "../../models/Message.js";
import ChatIssue from "../../models/ChatIssue.js";
import BotConfig from "../../models/BotConfig.js";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/AppError.js";
import { sanitiseText } from "../../utils/sanitise.js";
import { detect, routeToBot } from "./intentService.js";
import * as ragBot from "./providers/ragBotProvider.js";
import * as llm from "./providers/openAiCompatibleProvider.js";
import { answerFor, APOLOGY } from "./providers/fallbackProvider.js";

const EMERGENCY_NOTICE =
  "If you are in immediate danger, call 112 now. You can also call 181 (women's helpline) or 1091 (women's police helpline), and use the SOS button to alert your emergency contacts.";

const ENV_DEFAULTS = {
  medical: { name: "Medical assistant", url: env.MEDICAL_BOT_URL },
  legal: { name: "Legal assistant", url: env.LEGAL_BOT_URL },
  general: { name: "General assistant", url: env.LLM_API_URL },
};

export const botDefaults = () =>
  Object.entries(ENV_DEFAULTS).map(([key, value]) => ({ ...value, key, enabled: true, timeoutMs: env.BOT_TIMEOUT_MS }));

// DB overrides env, so an admin edit always wins over the deployed configuration.
async function resolveBot(key) {
  const stored = await BotConfig.findOne({ key });
  const defaults = ENV_DEFAULTS[key] ?? ENV_DEFAULTS.general;
  return {
    key,
    name: stored?.name ?? defaults.name,
    url: stored?.url || defaults.url,
    enabled: stored?.enabled ?? true,
    timeoutMs: stored?.timeoutMs ?? env.BOT_TIMEOUT_MS,
  };
}

const isTimeout = (err) =>
  err?.code === "ECONNABORTED" || err?.code === "ETIMEDOUT" || (axios.isAxiosError(err) && /timeout/i.test(err.message));

const titleFrom = (content) => content.slice(0, TITLE_MAX).trim() || DEFAULT_TITLE;

export async function listBots() {
  // Merge stored over defaults first, then filter: a bot disabled in the database must not
  // reappear from the env defaults.
  const byKey = new Map((await BotConfig.find()).map((bot) => [bot.key, bot]));
  return botDefaults()
    .map((defaults) => byKey.get(defaults.key) ?? defaults)
    .filter((bot) => bot.enabled)
    .map(({ key, name, enabled }) => ({ key, name, enabled }));
}

export function createConversation(userId, title) {
  return Conversation.create({ user: userId, title: title ? titleFrom(title) : DEFAULT_TITLE });
}

export async function listConversations(userId, { page, limit, skip }) {
  const filter = { user: userId };
  const [conversations, total] = await Promise.all([
    Conversation.find(filter).sort({ lastMessageAt: -1 }).skip(skip).limit(limit),
    Conversation.countDocuments(filter),
  ]);
  return { conversations, meta: { page, limit, total } };
}

export async function getOwnedConversation(userId, id) {
  const conversation = await Conversation.findOne({ _id: id, user: userId });
  if (!conversation) throw new AppError(404, "NOT_FOUND", "Conversation not found");
  return conversation;
}

export async function getConversationWithMessages(userId, id) {
  const conversation = await getOwnedConversation(userId, id);
  const messages = await Message.find({ conversation: id }).sort({ createdAt: 1 });
  return { conversation, messages };
}

export async function deleteConversation(userId, id) {
  const conversation = await getOwnedConversation(userId, id);
  await Promise.all([
    Message.deleteMany({ conversation: id }),
    ChatIssue.deleteMany({ conversation: id }),
    Conversation.deleteOne({ _id: id }),
  ]);
  return conversation;
}

// Returns the answer text plus which bot actually produced it.
async function callProvider({ bot, question, history }) {
  if (bot.key === "medical" || bot.key === "legal") {
    try {
      const { answer, sources } = await ragBot.ask({ url: bot.url, timeoutMs: bot.timeoutMs, question });
      return { bot: bot.key, content: answer, sources };
    } catch (err) {
      // A RAG bot that is down or has no index should not cost the user their answer: the
      // general LLM takes over. Rethrow when there is no LLM key, so the caller logs the issue.
      if (!llm.hasApiKey()) throw err;
      return {
        bot: "general",
        content: await llm.complete({ question, history, timeoutMs: bot.timeoutMs }),
        sources: [],
        degradedFrom: bot.key,
        reason: err?.message ?? "unknown error",
      };
    }
  }
  if (!llm.hasApiKey()) return { bot: "fallback", content: null, sources: [] };
  return {
    bot: "general",
    content: await llm.complete({ question, history, timeoutMs: bot.timeoutMs }),
    sources: [],
  };
}

export async function sendMessage({ user, conversationId, content, bot: requested = "auto" }) {
  const conversation = await getOwnedConversation(user.id, conversationId);
  const question = sanitiseText(content);
  if (!question) throw new AppError(400, "VALIDATION_ERROR", "Message cannot be empty");

  const { intent, emergency } = detect(question);

  const userMessage = await Message.create({
    conversation: conversation.id,
    user: user.id,
    role: "user",
    content: question,
    intent,
    emergency,
  });

  if (conversation.title === DEFAULT_TITLE) conversation.title = titleFrom(question);

  let target = await resolveBot(routeToBot(intent, requested));
  if (!target.enabled && target.key !== "general") target = await resolveBot("general");

  const history = await Message.find({ conversation: conversation.id, status: "ok", _id: { $ne: userMessage.id } })
    .sort({ createdAt: -1 })
    .limit(llm.HISTORY_LIMIT)
    .then((rows) => rows.reverse());

  const startedAt = Date.now();
  let assistant;
  let issue = null;

  try {
    if (!target.enabled) throw new AppError(503, "BOT_DISABLED", "No bot is enabled");
    const result = await callProvider({ bot: target, question, history });
    assistant = {
      bot: result.bot,
      content: result.content ?? answerFor(intent),
      sources: result.sources ?? [],
      status: "ok",
    };
    // The user got an answer, but an admin still needs to know the RAG bot is unreachable.
    if (result.degradedFrom) {
      issue = {
        type: "provider_error",
        reason: `${result.degradedFrom} unavailable, answered by the general assistant: ${result.reason}`.slice(0, 1000),
      };
    }
  } catch (err) {
    const timedOut = isTimeout(err);
    assistant = { bot: target.key, content: APOLOGY, sources: [], status: "failed" };
    issue = {
      type: timedOut ? "timeout" : "provider_error",
      reason: `${target.key}: ${err?.message ?? "unknown error"}`.slice(0, 1000),
    };
  }

  const body = emergency ? `${EMERGENCY_NOTICE}\n\n${assistant.content}` : assistant.content;

  const assistantMessage = await Message.create({
    conversation: conversation.id,
    user: user.id,
    role: "assistant",
    content: body,
    bot: assistant.bot,
    intent,
    emergency,
    sources: assistant.sources,
    status: assistant.status,
    latencyMs: Date.now() - startedAt,
  });

  conversation.lastMessageAt = new Date();
  await conversation.save();

  if (issue) {
    await ChatIssue.create({
      message: assistantMessage.id,
      conversation: conversation.id,
      user: user.id,
      ...issue,
    });
  }

  return { conversation, userMessage, assistantMessage };
}

export async function reportMessage(user, messageId, reason) {
  const message = await Message.findById(messageId);
  if (!message) throw new AppError(404, "NOT_FOUND", "Message not found");

  // Ownership is on the conversation, so a user cannot report into someone else's chat.
  await getOwnedConversation(user.id, message.conversation);
  if (message.role !== "assistant") {
    throw new AppError(400, "NOT_REPORTABLE", "Only assistant messages can be reported");
  }

  return ChatIssue.create({
    message: message.id,
    conversation: message.conversation,
    user: user.id,
    type: "user_report",
    reason,
  });
}
