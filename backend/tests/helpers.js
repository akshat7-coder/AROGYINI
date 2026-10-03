import bcrypt from "bcrypt";
import User from "../src/models/User.js";
import { signToken } from "../src/services/authService.js";

let counter = 0;

export async function createUser({ password = "Password1", ...overrides } = {}) {
  counter += 1;
  return User.create({
    name: "Test User",
    email: `user${counter}@example.com`,
    passwordHash: await bcrypt.hash(password, 4),
    ...overrides,
  });
}

export const createAdmin = (overrides = {}) => createUser({ role: "admin", ...overrides });

export const authHeader = (tokenOrUser) => ({
  Authorization: `Bearer ${typeof tokenOrUser === "string" ? tokenOrUser : signToken(tokenOrUser)}`,
});
