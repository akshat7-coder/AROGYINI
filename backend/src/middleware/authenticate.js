import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

export async function authenticate(req, res, next) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) throw new AppError(401, "UNAUTHENTICATED", "Authentication token is required");

  const { sub } = jwt.verify(token, env.JWT_SECRET);
  const user = await User.findById(sub);
  if (!user) throw new AppError(401, "INVALID_TOKEN", "Invalid authentication token");
  if (!user.isActive) throw new AppError(403, "ACCOUNT_INACTIVE", "This account has been deactivated");

  req.user = user;
  next();
}
