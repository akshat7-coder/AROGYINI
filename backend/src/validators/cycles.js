import { z } from "zod";
import { FLOW_LEVELS } from "../models/CycleLog.js";
import { toUtcDay } from "../utils/dates.js";

const isoDay = z
  .union([z.string(), z.date()])
  .transform((value, ctx) => {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      ctx.addIssue({ code: "custom", message: "Expected a date like 2026-10-01" });
      return z.NEVER;
    }
    return toUtcDay(date);
  });

const symptoms = z.array(z.string().trim().min(1).max(40)).max(20);
const mood = z.string().trim().max(40);
const notes = z.string().trim().max(500);

export const createCycleSchema = z.object({
  startDate: isoDay,
  endDate: isoDay.optional(),
  flow: z.enum(FLOW_LEVELS).optional(),
  symptoms: symptoms.optional(),
  mood: mood.optional(),
  notes: notes.optional(),
});

export const updateCycleSchema = z
  .object({
    startDate: isoDay.optional(),
    endDate: isoDay.nullable().optional(),
    flow: z.enum(FLOW_LEVELS).optional(),
    symptoms: symptoms.optional(),
    mood: mood.optional(),
    notes: notes.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { error: "Provide at least one field to update" });

export const cycleListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});
