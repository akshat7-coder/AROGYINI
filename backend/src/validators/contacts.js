import { z } from "zod";
import { phoneSchema } from "../utils/phone.js";

const name = z.string().trim().min(2, "Name must be at least 2 characters").max(80);
const relation = z.string().trim().max(40);
const priority = z.coerce.number().int().min(1).max(5);

export const createContactSchema = z.object({
  name,
  phone: phoneSchema,
  relation: relation.optional(),
  priority: priority.optional(),
});

export const updateContactSchema = z
  .object({
    name: name.optional(),
    phone: phoneSchema.optional(),
    relation: relation.optional(),
    priority: priority.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { error: "Provide at least one field to update" });
