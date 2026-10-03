import { z } from "zod";
import { SOS_STATUSES } from "../models/SosEvent.js";

export const triggerSosSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  accuracy: z.coerce.number().nonnegative().optional(),
  message: z.string().trim().max(500).optional(),
});

export const sosListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const resolveQuerySchema = z.object({
  notify: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
});

export const adminSosQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  status: z.enum(SOS_STATUSES).optional(),
});
