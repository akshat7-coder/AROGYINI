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

async function seedAdmin() {
  return User.findOneAndUpdate(
    { email: env.ADMIN_EMAIL },
    {
      $set: { passwordHash: await hashPassword(env.ADMIN_PASSWORD), role: "admin", isActive: true },
      $setOnInsert: { name: "AROGYINI Admin" },
    },
    { returnDocument: "after", upsert: true }
  );
}

// Jobs and scholarships have no natural slug, so title + company (or provider) is the key.
async function upsertBy(Model, rows, keyFields) {
  const result = await Model.bulkWrite(
    rows.map((row) => ({
      updateOne: {
        filter: Object.fromEntries(keyFields.map((field) => [field, row[field]])),
        update: { $set: row },
        upsert: true,
      },
    }))
  );
  return { inserted: result.upsertedCount, updated: result.modifiedCount };
}

async function run() {
  await connectDB();

  const admin = await seedAdmin();
  console.log(`Admin ready: ${admin.email} (${admin.role})`);

  const legal = await upsertBy(LegalRight, legalRights, ["slug"]);
  console.log(`Legal rights: ${legal.inserted} inserted, ${legal.updated} updated, ${legalRights.length} total`);

  const jobResult = await upsertBy(Job, jobs, ["title", "company"]);
  console.log(`Jobs: ${jobResult.inserted} inserted, ${jobResult.updated} updated, ${jobs.length} total`);

  const scholarshipResult = await upsertBy(Scholarship, scholarships, ["title", "provider"]);
  console.log(
    `Scholarships: ${scholarshipResult.inserted} inserted, ${scholarshipResult.updated} updated, ${scholarships.length} total`
  );

  // $setOnInsert only: an admin who edits a bot URL or disables a bot keeps that change.
  const bots = botDefaults();
  const botResult = await BotConfig.bulkWrite(
    bots.map((bot) => ({ updateOne: { filter: { key: bot.key }, update: { $setOnInsert: bot }, upsert: true } }))
  );
  console.log(`Bot configs: ${botResult.upsertedCount} inserted, ${bots.length - botResult.upsertedCount} left as configured`);

  await disconnectDB();
}

run().catch(async (err) => {
  console.error("Seed failed:", err.message);
  await disconnectDB();
  process.exit(1);
});
