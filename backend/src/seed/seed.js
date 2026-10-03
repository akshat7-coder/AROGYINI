import { env } from "../config/env.js";
import { connectDB, disconnectDB } from "../config/db.js";
import User from "../models/User.js";
import LegalRight from "../models/LegalRight.js";
import Job from "../models/Job.js";
import Scholarship from "../models/Scholarship.js";
import BotConfig from "../models/BotConfig.js";
import { hashPassword } from "../services/authService.js";
import { legalRights } from "./data/legalRights.js";
import { jobs } from "./data/jobs.js";
import { scholarships } from "./data/scholarships.js";
import { botDefaults } from "../services/chat/chatService.js";

// Content rows are refreshed from the data files on every run, keyed by a natural identifier:
// slug for rights, title + company for jobs, title + provider for scholarships.
async function upsertContent(Model, rows, keyFields) {
  const result = await Model.bulkWrite(
    rows.map((row) => ({
      updateOne: {
        filter: Object.fromEntries(keyFields.map((field) => [field, row[field]])),
        update: { $set: row },
        upsert: true,
      },
    }))
  );
  return { created: result.upsertedCount, updated: result.modifiedCount, total: rows.length };
}

// Bot configs are created once and never overwritten, so admin edits survive a re-seed.
async function upsertBotsPreservingEdits(rows) {
  const result = await BotConfig.bulkWrite(
    rows.map((row) => ({ updateOne: { filter: { key: row.key }, update: { $setOnInsert: row }, upsert: true } }))
  );
  return { created: result.upsertedCount, updated: rows.length - result.upsertedCount, total: rows.length };
}

async function seedAdmin() {
  const existed = await User.exists({ email: env.ADMIN_EMAIL });
  const admin = await User.findOneAndUpdate(
    { email: env.ADMIN_EMAIL },
    {
      $set: { passwordHash: await hashPassword(env.ADMIN_PASSWORD), role: "admin", isActive: true },
      $setOnInsert: { name: "AROGYINI Admin" },
    },
    { returnDocument: "after", upsert: true }
  );
  return { admin, created: existed ? 0 : 1, updated: existed ? 1 : 0, total: 1 };
}

function printSummary(rows) {
  const col = (value, width) => String(value).padStart(width);
  console.log("");
  console.log(`  ${"collection".padEnd(14)}${col("created", 9)}${col("updated", 9)}${col("total", 7)}`);
  console.log(`  ${"-".repeat(39)}`);
  for (const [label, result] of rows) {
    console.log(`  ${label.padEnd(14)}${col(result.created, 9)}${col(result.updated, 9)}${col(result.total, 7)}`);
  }
  console.log("");
}

// Never log the URI as-is: it carries the Atlas username and password.
function redactUri(uri) {
  try {
    const url = new URL(uri);
    return `${url.protocol}//${url.username ? "***:***@" : ""}${url.host}${url.pathname}`;
  } catch {
    return "(unparseable MONGODB_URI)";
  }
}

async function run() {
  await connectDB();
  console.log(`Seeding ${redactUri(env.MONGODB_URI)}`);

  const adminResult = await seedAdmin();
  const results = [
    ["admin", adminResult],
    ["legalRights", await upsertContent(LegalRight, legalRights, ["slug"])],
    ["jobs", await upsertContent(Job, jobs, ["title", "company"])],
    ["scholarships", await upsertContent(Scholarship, scholarships, ["title", "provider"])],
    ["botConfigs", await upsertBotsPreservingEdits(botDefaults())],
  ];

  printSummary(results);
  console.log(`Admin sign-in: ${adminResult.admin.email} with the ADMIN_PASSWORD from your .env`);
  console.log("Bot configs are only ever created, so admin changes to a URL or timeout are kept.");
  console.log("Seed complete. Safe to run again.");

  await disconnectDB();
}

run().catch(async (err) => {
  console.error("Seed failed:", err.message);
  await disconnectDB();
  process.exit(1);
});
