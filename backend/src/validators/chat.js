import { z } from "zod";
import { BOT_KEYS } from "../models/BotConfig.js";
import { ISSUE_STATUSES, ISSUE_TYPES } from "../models/ChatIssue.js";
import { sanitiseText } from "../utils/sanitise.js";

const pagination = {
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
};

export const createConversationSchema = z.object({
  title: z.string().trim().max(60).optional(),
});

export const conversationsQuerySchema = z.object(pagination);

export const sendMessageSchema = z.object({
  content: z
    .string()
    .transform(sanitiseText)
    .refine((value) => value.length >= 1, { error: "Message cannot be empty" })
    .refine((value) => value.length <= 2000, { error: "Message cannot be longer than 2000 characters" }),
  bot: z.enum(["auto", ...BOT_KEYS]).default("auto"),
});

export const reportMessageSchema = z.object({
  reason: z.string().trim().min(3).max(1000),
});

export const issuesQuerySchema = z.object({
  ...pagination,
  status: z.enum(ISSUE_STATUSES).optional(),
  type: z.enum(ISSUE_TYPES).optional(),
});

export const updateIssueSchema = z
  .object({
    status: z.enum(ISSUE_STATUSES).optional(),
    adminNote: z.string().trim().max(1000).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { error: "Provide a status or a note" });

export const botKeyParamSchema = z.object({ key: z.enum(BOT_KEYS) });

export const updateBotSchema = z
  .object({
    enabled: z.boolean().optional(),
    url: z.url().max(500).optional(),
    timeoutMs: z.coerce.number().int().min(1000).max(120000).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { error: "Provide at least one field to update" });
