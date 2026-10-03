import { env } from "../../config/env.js";
import * as consoleProvider from "./consoleProvider.js";
import * as memoryProvider from "./memoryProvider.js";

// twilioProvider builds a real client on import, so only load it when actually selected.
const provider =
  env.SMS_PROVIDER === "twilio"
    ? await import("./twilioProvider.js")
    : env.SMS_PROVIDER === "memory"
      ? memoryProvider
      : consoleProvider;

export const providerName = provider.name;

export function sendSms({ to, body }) {
  return provider.send({ to, body });
}

export const getSentMessages = memoryProvider.getSentMessages;
export const clearSentMessages = memoryProvider.clearSentMessages;
