import { env } from "../config/env.js";
import { connectDB, disconnectDB } from "../config/db.js";
import User from "../models/User.js";
import LegalRight from "../models/LegalRight.js";
import { hashPassword } from "../services/authService.js";
import { legalRights } from "./data/legalRights.js";

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

async function seedLegalRights() {
  const result = await LegalRight.bulkWrite(
    legalRights.map((right) => ({
      updateOne: { filter: { slug: right.slug }, update: { $set: right }, upsert: true },
    }))
  );
  return { inserted: result.upsertedCount, updated: result.modifiedCount };
}

async function run() {
  await connectDB();

  const admin = await seedAdmin();
  console.log(`Admin ready: ${admin.email} (${admin.role})`);

  const legal = await seedLegalRights();
  console.log(`Legal rights: ${legal.inserted} inserted, ${legal.updated} updated, ${legalRights.length} total`);

  await disconnectDB();
}

run().catch(async (err) => {
  console.error("Seed failed:", err.message);
  await disconnectDB();
  process.exit(1);
});
