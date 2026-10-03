import { env } from "../config/env.js";
import { connectDB, disconnectDB } from "../config/db.js";
import User from "../models/User.js";
import { hashPassword } from "../services/authService.js";

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

async function run() {
  await connectDB();
  const admin = await seedAdmin();
  console.log(`Admin ready: ${admin.email} (${admin.role})`);
  await disconnectDB();
}

run().catch(async (err) => {
  console.error("Seed failed:", err.message);
  await disconnectDB();
  process.exit(1);
});
