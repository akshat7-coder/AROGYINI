import { AppError } from "../utils/AppError.js";

export function notFound(req, res, next) {
  next(new AppError(404, "NOT_FOUND", `Route ${req.method} ${req.originalUrl} not found`));
}
