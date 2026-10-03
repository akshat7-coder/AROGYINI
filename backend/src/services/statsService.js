import User from "../models/User.js";
import Job from "../models/Job.js";
import Application from "../models/Application.js";
import Scholarship from "../models/Scholarship.js";
import { countActiveSos } from "./sosService.js";

export async function getStats() {
  const [users, activeUsers, admins, activeSos, jobs, activeJobs, applications, scholarships] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ role: "admin" }),
    countActiveSos(),
    Job.countDocuments(),
    Job.countDocuments({ isActive: true }),
    Application.countDocuments(),
    Scholarship.countDocuments(),
  ]);
  return { users, activeUsers, admins, activeSos, jobs, activeJobs, applications, scholarships };
}
