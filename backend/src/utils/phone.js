import { z } from "zod";

const E164 = /^\+[1-9]\d{7,14}$/;
const DEFAULT_COUNTRY_CODE = "+91";

// Accepts "98765 43210", "098765-43210", "+91 98765 43210", "0091..." and stores E.164.
export function normalisePhone(input, countryCode = DEFAULT_COUNTRY_CODE) {
  const cleaned = String(input ?? "").replace(/[^\d+]/g, "");
  if (!cleaned) return "";
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith("00")) return `+${cleaned.slice(2)}`;
  const local = cleaned.startsWith("0") ? cleaned.slice(1) : cleaned;
  if (local.length === 10) return `${countryCode}${local}`;
  return `+${local}`;
}

export const isE164 = (value) => E164.test(value);

export const phoneSchema = z
  .string()
  .transform((value) => normalisePhone(value))
  .refine(isE164, "Enter a valid phone number, e.g. 98765 43210 or +919876543210");
