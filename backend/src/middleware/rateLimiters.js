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

// Keyed per user, not per IP: shared networks must not block someone else's SOS.
export const sosLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest,
  keyGenerator: (req) => req.user.id,
  handler: (req, res, next) =>
    next(new AppError(429, "RATE_LIMITED", "Too many SOS triggers. Please call 112 directly.")),
});

export const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest,
  keyGenerator: (req) => req.user.id,
  handler: (req, res, next) =>
    next(new AppError(429, "RATE_LIMITED", "You are sending messages too quickly. Please wait a moment.")),
});
