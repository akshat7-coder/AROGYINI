import { AppError } from "../utils/AppError.js";

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new AppError(401, "UNAUTHENTICATED", "Authentication is required"));
    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, "FORBIDDEN", "You do not have access to this resource"));
    }
    next();
  };
}
