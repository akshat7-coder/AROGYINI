import rateLimit from "express-rate-limit";
import { isTest } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

const FIFTEEN_MINUTES = 15 * 60 * 1000;

export const authLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest,
  handler: (req, res, next) =>
    next(new AppError(429, "RATE_LIMITED", "Too many attempts. Please try again in a few minutes.")),
});
