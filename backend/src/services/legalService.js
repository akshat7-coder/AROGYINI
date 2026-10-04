import LegalRight from "../models/LegalRight.js";
import { AppError } from "../utils/AppError.js";
import { buildDraft } from "./draftTemplates/index.js";
import { escapeRegex } from "../utils/escapeRegex.js";

export async function listRights({ page, limit, skip, category, search }) {
  const filter = { isPublished: true };
  if (category) filter.category = category;
  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ title: pattern }, { actName: pattern }, { summary: pattern }];
  }

  const [rights, total] = await Promise.all([
    LegalRight.find(filter).sort({ category: 1, year: 1 }).skip(skip).limit(limit),
    LegalRight.countDocuments(filter),
  ]);
  return { rights, meta: { page, limit, total } };
}

// Admin listing: includes unpublished rights, which the public list hides.
export async function listAllRights({ page, limit, skip, category, search, isPublished }) {
  const filter = {
    ...(category ? { category } : {}),
    ...(isPublished === undefined ? {} : { isPublished }),
  };
  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ title: pattern }, { actName: pattern }, { summary: pattern }];
  }

  const [rights, total] = await Promise.all([
    LegalRight.find(filter).sort({ category: 1, year: 1 }).skip(skip).limit(limit),
    LegalRight.countDocuments(filter),
  ]);
  return { rights, meta: { page, limit, total } };
}

export async function getRightBySlug(slug) {
  const right = await LegalRight.findOne({ slug: slug.toLowerCase(), isPublished: true });
  if (!right) throw new AppError(404, "NOT_FOUND", "Legal right not found");
  return right;
}

export function createDraft({ type, ...data }) {
  return buildDraft(type, data);
}

export function createRight(payload) {
  return LegalRight.create(payload);
}

export async function updateRight(id, payload) {
  const right = await LegalRight.findByIdAndUpdate(id, payload, { returnDocument: "after", runValidators: true });
  if (!right) throw new AppError(404, "NOT_FOUND", "Legal right not found");
  return right;
}

export async function deleteRight(id) {
  const right = await LegalRight.findByIdAndDelete(id);
  if (!right) throw new AppError(404, "NOT_FOUND", "Legal right not found");
  return right;
}
