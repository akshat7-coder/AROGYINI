import User from "../models/User.js";
import { countActiveSos } from "./sosService.js";

export async function getStats() {
  const [users, activeUsers, admins, activeSos] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ role: "admin" }),
    countActiveSos(),
  ]);
  return { users, activeUsers, admins, activeSos };
}
