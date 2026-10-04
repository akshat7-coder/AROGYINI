import app from "./app.js";
import { env } from "./config/env.js";
import { connectDB, disconnectDB } from "./config/db.js";
import * as ragBot from "./services/chat/providers/ragBotProvider.js";
import { providerName } from "./services/sms/index.js";

const SHUTDOWN_TIMEOUT_MS = 10000;
const BOT_PROBE_TIMEOUT_MS = 3000;

// A warning only: the bots are optional, and the first RAG call can be slow while models load.
export async function probeBots() {
  const bots = [
    ["medical", env.MEDICAL_BOT_URL],
    ["legal", env.LEGAL_BOT_URL],
  ];

  for (const [key, url] of bots) {
    try {
      const { ready, reason } = await ragBot.health({ url, timeoutMs: BOT_PROBE_TIMEOUT_MS });
      if (!ready) console.warn(`WARN ${key} bot at ${url} is up but not ready: ${reason || "no reason given"}`);
    } catch (err) {
      console.warn(
        `WARN ${key} bot at ${url} is not reachable (${err?.message ?? "unknown error"}); ` +
          `${key} questions will return a failed-reply apology until it starts`
      );
    }
  }
}

// Credentials are read once at startup, so a stale .env silently breaks every SOS until a
// restart. Check them now rather than during someone's emergency.
export async function probeSms() {
  if (env.SMS_PROVIDER !== "twilio") {
    console.log(`SMS provider: ${env.SMS_PROVIDER} (messages are not really sent)`);
    return;
  }
  try {
    // The provider's own client, so a passing probe really means a send would authenticate.
    const { verify } = await import("./services/sms/twilioProvider.js");
    const { type, from, owned, senderIsOwned } = await verify();
    if (!senderIsOwned) {
      console.warn(
        `WARN Twilio: ${from} is not a number on this account ` +
          `(owned: ${owned.join(", ") || "none"}); SOS SMS will fail`
      );
      return;
    }
    console.log(`SMS provider: twilio, sending from ${from} (${type} account)`);
    if (type === "Trial") {
      console.log("  Trial account: SMS only reaches numbers listed under Verified Caller IDs.");
    }
  } catch (err) {
    console.warn(`WARN Twilio credentials rejected (${err?.message ?? "unknown error"}); SOS SMS will fail`);
  }
}

export async function startServer() {
  await connectDB();
  const server = app.listen(env.PORT, () =>
    console.log(
      `AROGYINI API listening on http://localhost:${env.PORT} (${env.NODE_ENV}); SMS provider: ${providerName}`
    )
  );

  // Fire-and-forget so a slow or absent bot never delays startup; never rejects.
  probeBots().catch((err) => console.warn(`WARN bot probe failed: ${err?.message ?? "unknown error"}`));
  probeSms().catch((err) => console.warn(`WARN SMS probe failed: ${err?.message ?? "unknown error"}`));

  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down`);
    setTimeout(() => process.exit(1), SHUTDOWN_TIMEOUT_MS).unref();
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };

  for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => shutdown(signal));
  return server;
}
