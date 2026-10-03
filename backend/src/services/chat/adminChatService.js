import ChatIssue from "../../models/ChatIssue.js";
import Message from "../../models/Message.js";
import BotConfig, { BOT_KEYS } from "../../models/BotConfig.js";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/AppError.js";
import { botDefaults } from "./chatService.js";
import * as ragBot from "./providers/ragBotProvider.js";
import * as llm from "./providers/openAiCompatibleProvider.js";
import { answerFor } from "./providers/fallbackProvider.js";

export async function listIssues({ page, limit, skip, status, type }) {
  const filter = { ...(status ? { status } : {}), ...(type ? { type } : {}) };
  const [issues, total] = await Promise.all([
    ChatIssue.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "name email")
      .populate("message", "role content bot intent status")
      .populate("conversation", "title"),
    ChatIssue.countDocuments(filter),
  ]);
  return { issues, meta: { page, limit, total } };
}

export async function updateIssue(admin, id, { status, adminNote }) {
  const issue = await ChatIssue.findById(id);
  if (!issue) throw new AppError(404, "NOT_FOUND", "Chat issue not found");

  if (status) issue.status = status;
  if (adminNote !== undefined) issue.adminNote = adminNote;
  if (status === "resolved") {
    issue.resolvedBy = admin.id;
    issue.resolvedAt = new Date();
  }
  await issue.save();
  return issue;
}

export const countOpenIssues = () => ChatIssue.countDocuments({ status: "open" });

async function configFor(key) {
  const stored = await BotConfig.findOne({ key });
  const defaults = botDefaults().find((bot) => bot.key === key);
  return {
    key,
    url: stored?.url || defaults.url,
    timeoutMs: stored?.timeoutMs ?? defaults.timeoutMs,
    enabled: stored?.enabled ?? defaults.enabled,
  };
}

// Re-calls the provider for a failed message and replaces its content in place.
export async function retryIssue(admin, id) {
  const issue = await ChatIssue.findById(id).populate("message");
  if (!issue) throw new AppError(404, "NOT_FOUND", "Chat issue not found");

  const assistantMessage = issue.message;
  if (!assistantMessage) throw new AppError(404, "NOT_FOUND", "The message for this issue no longer exists");
  if (assistantMessage.role !== "assistant") {
    throw new AppError(400, "NOT_RETRYABLE", "Only an assistant message can be retried");
  }

  const question = await Message.findOne({
    conversation: assistantMessage.conversation,
    role: "user",
    createdAt: { $lte: assistantMessage.createdAt },
  }).sort({ createdAt: -1 });
  if (!question) throw new AppError(400, "NOT_RETRYABLE", "The original question could not be found");

  const key = assistantMessage.bot === "fallback" ? "general" : assistantMessage.bot;
  const bot = await configFor(key);

  const startedAt = Date.now();
  let content;
  let usedBot;
  try {
    if (key === "medical" || key === "legal") {
      content = await ragBot.ask({ url: bot.url, timeoutMs: bot.timeoutMs, question: question.content });
      usedBot = key;
    } else if (llm.hasApiKey()) {
      content = await llm.complete({ question: question.content, history: [], timeoutMs: bot.timeoutMs });
      usedBot = "general";
    } else {
      content = answerFor(assistantMessage.intent ?? "general");
      usedBot = "fallback";
    }
  } catch (err) {
    throw new AppError(502, "RETRY_FAILED", `Retry failed: ${err?.message ?? "unknown error"}`);
  }

  assistantMessage.content = content;
  assistantMessage.bot = usedBot;
  assistantMessage.status = "ok";
  assistantMessage.latencyMs = Date.now() - startedAt;
  await assistantMessage.save();

  issue.status = "resolved";
  issue.resolvedBy = admin.id;
  issue.resolvedAt = new Date();
  issue.adminNote = [issue.adminNote, "Retried successfully by admin."].filter(Boolean).join(" ");
  await issue.save();

  return { issue, message: assistantMessage };
}

export async function listBots() {
  const stored = await BotConfig.find();
  const byKey = new Map(stored.map((bot) => [bot.key, bot]));
  return botDefaults().map((defaults) => {
    const row = byKey.get(defaults.key);
    return row
      ? { ...row.toJSON(), source: "database" }
      : { ...defaults, source: "env", id: null };
  });
}

export async function updateBot(key, payload) {
  if (!BOT_KEYS.includes(key)) throw new AppError(404, "NOT_FOUND", "Unknown bot");
  const defaults = botDefaults().find((bot) => bot.key === key);

  // A field may not appear in both $set and $setOnInsert, so only default what was not sent.
  const onInsert = Object.fromEntries(
    Object.entries({ key, name: defaults.name, url: defaults.url }).filter(([field]) => !(field in payload))
  );

  return BotConfig.findOneAndUpdate(
    { key },
    { $set: payload, ...(Object.keys(onInsert).length > 0 ? { $setOnInsert: onInsert } : {}) },
    { returnDocument: "after", upsert: true, runValidators: true }
  );
}

export async function testBot(key) {
  if (!BOT_KEYS.includes(key)) throw new AppError(404, "NOT_FOUND", "Unknown bot");
  const bot = await configFor(key);
  const startedAt = Date.now();

  try {
    if (key === "medical" || key === "legal") {
      const answer = await ragBot.ask({ url: bot.url, timeoutMs: bot.timeoutMs, question: "ping" });
      return { key, ok: true, latencyMs: Date.now() - startedAt, url: bot.url, preview: answer.slice(0, 200) };
    }
    if (!llm.hasApiKey()) {
      return {
        key,
        ok: false,
        latencyMs: Date.now() - startedAt,
        url: bot.url,
        error: "LLM_API_KEY is not set, so the built-in fallback answer is used instead",
      };
    }
    const answer = await llm.complete({ question: "ping", history: [], timeoutMs: bot.timeoutMs });
    return { key, ok: true, latencyMs: Date.now() - startedAt, url: bot.url, preview: answer.slice(0, 200) };
  } catch (err) {
    return { key, ok: false, latencyMs: Date.now() - startedAt, url: bot.url, error: err?.message ?? "unknown error" };
  }
}
