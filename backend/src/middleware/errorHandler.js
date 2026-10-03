import { ZodError } from "zod";
import { isTest } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

function zodDetails(error) {
  return error.issues.map((i) => ({ field: i.path.join(".") || "(root)", message: i.message }));
}

function map(err) {
  if (err instanceof AppError) {
    return { statusCode: err.statusCode, code: err.code, message: err.message, details: err.details };
  }
  if (err instanceof ZodError) {
    return { statusCode: 400, code: "VALIDATION_ERROR", message: "Invalid request data", details: zodDetails(err) };
  }
  if (err?.name === "ValidationError" && err.errors) {
    const details = Object.entries(err.errors).map(([field, e]) => ({ field, message: e.message }));
    return { statusCode: 400, code: "VALIDATION_ERROR", message: "Invalid request data", details };
  }
  if (err?.name === "CastError") {
    return { statusCode: 400, code: "INVALID_ID", message: `Invalid value for ${err.path}`, details: [] };
  }
  if (err?.code === 11000) {
    const field = Object.keys(err.keyPattern ?? err.keyValue ?? {})[0] ?? "field";
    return { statusCode: 409, code: "DUPLICATE_KEY", message: `${field} already exists`, details: [{ field, message: "already exists" }] };
  }
  if (err?.name === "TokenExpiredError") {
    return { statusCode: 401, code: "TOKEN_EXPIRED", message: "Token has expired", details: [] };
  }
  if (err?.name === "JsonWebTokenError" || err?.name === "NotBeforeError") {
    return { statusCode: 401, code: "INVALID_TOKEN", message: "Invalid authentication token", details: [] };
  }
  if (err?.type === "entity.too.large") {
    return { statusCode: 413, code: "PAYLOAD_TOO_LARGE", message: "Request body is too large", details: [] };
  }
  if (err?.type === "entity.parse.failed") {
    return { statusCode: 400, code: "INVALID_JSON", message: "Request body is not valid JSON", details: [] };
  }
  return { statusCode: 500, code: "INTERNAL_ERROR", message: "Something went wrong", details: [] };
}

export function errorHandler(err, req, res, next) {
  const { statusCode, code, message, details } = map(err);
  if (statusCode >= 500 && !isTest) console.error(err);
  res.status(statusCode).json({ success: false, error: { code, message, details } });
}
