import { z } from "zod";
import { ROLES } from "../models/User.js";

export const idParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id"),
});

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().trim().max(80).optional(),
  role: z.enum(ROLES).optional(),
});

export const userRoleSchema = z.object({ role: z.enum(ROLES) });
export const userStatusSchema = z.object({ isActive: z.boolean() });
