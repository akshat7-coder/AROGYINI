import app from "./app.js";
import { env } from "./config/env.js";
import { connectDB, disconnectDB } from "./config/db.js";

const SHUTDOWN_TIMEOUT_MS = 10000;

export async function startServer() {
  await connectDB();
  const server = app.listen(env.PORT, () =>
    console.log(`AROGYINI API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`)
  );

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
