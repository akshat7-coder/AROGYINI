import axios from "axios";
import { AppError } from "../../../utils/AppError.js";

export const MAX_SOURCES = 5;
const FIELD_MAX = 200;

const base = (url) => url.replace(/\/+$/, "");

const field = (value) => (typeof value === "string" ? value.trim().slice(0, FIELD_MAX) : "");

// Bots are external, so treat `sources` as untrusted: keep only well-formed entries.
export function normaliseSources(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const title = field(entry.title);
      const source = field(entry.source);
      return title || source ? { title: title || source, source } : null;
    })
    .filter(Boolean)
    .slice(0, MAX_SOURCES);
}

// The medical and legal bots both expose POST {url}/ask { question } -> { answer, sources? }.
export async function ask({ url, timeoutMs, question }) {
  const { data } = await axios.post(
    `${base(url)}/ask`,
    { question },
    { timeout: timeoutMs, headers: { "Content-Type": "application/json" } }
  );

  const answer = typeof data?.answer === "string" ? data.answer.trim() : "";
  if (!answer) throw new AppError(502, "BOT_BAD_RESPONSE", "The bot did not return an answer");
  return { answer, sources: normaliseSources(data?.sources) };
}

// Both bots expose GET {url}/health -> { status, ready, ... }. Used by the admin Test button so
// it costs no LLM call; a 404 means an older bot that only has /ask.
export async function health({ url, timeoutMs }) {
  const { data } = await axios.get(`${base(url)}/health`, { timeout: timeoutMs });
  return {
    ready: data?.ready === true,
    reason: field(data?.reason) || field(data?.status),
    details: data && typeof data === "object" && !Array.isArray(data) ? data : {},
  };
}

export const isNotFound = (err) => err?.response?.status === 404;
