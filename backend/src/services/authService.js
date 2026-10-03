import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

const SALT_ROUNDS = 12;
const PROFILE_FIELDS = ["name", "phone", "bloodGroup", "city"];

export function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

export async function signup({ name, email, password, phone, city, bloodGroup }) {
  if (await User.exists({ email })) {
    throw new AppError(409, "EMAIL_IN_USE", "An account with this email already exists");
  }
  // role is never taken from input: the schema default makes every signup a `user`.
  const user = await User.create({
    name,
    email,
    passwordHash: await hashPassword(password),
    phone,
    city,
    bloodGroup,
  });
  return { user, token: signToken(user) };
}

export async function signin({ email, password }) {
  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }
  if (!user.isActive) throw new AppError(403, "ACCOUNT_INACTIVE", "This account has been deactivated");

  user.lastLoginAt = new Date();
  await user.save();
  return { user, token: signToken(user) };
}

export async function getMe(userId) {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, "NOT_FOUND", "User not found");
  return user;
}

export async function updateMe(userId, payload) {
  const updates = Object.fromEntries(
    PROFILE_FIELDS.filter((field) => payload[field] !== undefined).map((field) => [field, payload[field]])
  );
  const user = await User.findByIdAndUpdate(userId, updates, { returnDocument: "after", runValidators: true });
  if (!user) throw new AppError(404, "NOT_FOUND", "User not found");
  return user;
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId).select("+passwordHash");
  if (!user) throw new AppError(404, "NOT_FOUND", "User not found");
  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Current password is incorrect");
  }
  user.passwordHash = await hashPassword(newPassword);
  await user.save();
  return user;
}
