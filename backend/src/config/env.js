import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("1d"),
  CLIENT_URL: z.url().default("http://localhost:5173"),
  ADMIN_EMAIL: z.email().default("admin@arogyini.in"),
  ADMIN_PASSWORD: z.string().min(8).default("Admin@12345"),
  SMS_PROVIDER: z.enum(["twilio", "console", "memory"]).default("console"),
  TWILIO_ACCOUNT_SID: z.string().default(""),
  TWILIO_AUTH_TOKEN: z.string().default(""),
  TWILIO_PHONE_NUMBER: z.string().default(""),
  MEDICAL_BOT_URL: z.url().default("http://localhost:5000"),
  LEGAL_BOT_URL: z.url().default("http://localhost:8002"),
  LLM_API_URL: z.url().default("https://api.groq.com/openai/v1"),
  LLM_API_KEY: z.string().default(""),
  LLM_MODEL: z.string().default("llama-3.1-8b-instant"),
  BOT_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
}).refine(
  (c) => c.SMS_PROVIDER !== "twilio" || Boolean(c.TWILIO_ACCOUNT_SID && c.TWILIO_AUTH_TOKEN && c.TWILIO_PHONE_NUMBER),
  { error: "SMS_PROVIDER=twilio requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_PHONE_NUMBER", path: ["SMS_PROVIDER"] }
);

// Blank values in .env must fall through to the defaults above, not fail validation.
const present = Object.fromEntries(Object.entries(process.env).filter(([, v]) => v !== ""));
const parsed = schema.safeParse(present);

if (!parsed.success) {
  const details = parsed.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n");
  throw new Error(`Invalid environment configuration:\n${details}`);
}

export const env = parsed.data;
export const isTest = env.NODE_ENV === "test";
export const isProduction = env.NODE_ENV === "production";
