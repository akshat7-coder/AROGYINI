import User from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { escapeRegex } from "../utils/escapeRegex.js";

export async function listUsers({ page, limit, skip, search, role }) {
  const filter = {};
  if (role) filter.role = role;
  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ name: pattern }, { email: pattern }];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  return { users, meta: { page, limit, total } };
}

export async function setUserRole(actor, id, role) {
  assertNotSelf(actor, id, "role");
  return applyUpdate(id, { role });
}

export async function setUserStatus(actor, id, isActive) {
  assertNotSelf(actor, id, "status");
  return applyUpdate(id, { isActive });
}

function assertNotSelf(actor, id, field) {
  if (actor.id === id) {
    throw new AppError(400, "SELF_MODIFICATION_FORBIDDEN", `You cannot change your own ${field}`);
  }
}

async function applyUpdate(id, updates) {
  const user = await User.findByIdAndUpdate(id, updates, { returnDocument: "after", runValidators: true });
  if (!user) throw new AppError(404, "NOT_FOUND", "User not found");
  return user;
}
