import { env } from "../../config/env.js";
import * as consoleProvider from "./consoleProvider.js";
import * as memoryProvider from "./memoryProvider.js";

const STATIC_PROVIDERS = { memory: memoryProvider, console: consoleProvider };

// Anything unrecognised logs rather than silently dropping the message.
export const providerFor = (name) => STATIC_PROVIDERS[name] ?? consoleProvider;

// twilioProvider builds a real client on import, so it is only loaded when actually selected.
// The twilio arm is resolved once at module load and cannot run in a test process, so it is
// ignored for coverage; providerFor() above carries the testable selection logic.
/* istanbul ignore next */
const provider = env.SMS_PROVIDER === "twilio" ? await import("./twilioProvider.js") : providerFor(env.SMS_PROVIDER);

export const providerName = provider.name;

export function sendSms({ to, body }) {
  return provider.send({ to, body });
}

export const getSentMessages = memoryProvider.getSentMessages;
export const clearSentMessages = memoryProvider.clearSentMessages;
