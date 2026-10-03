import EmergencyContact, { MAX_CONTACTS_PER_USER } from "../models/EmergencyContact.js";
import { AppError } from "../utils/AppError.js";

export function listContacts(userId) {
  return EmergencyContact.find({ user: userId }).sort({ priority: 1, createdAt: 1 });
}

export async function createContact(userId, payload) {
  const count = await EmergencyContact.countDocuments({ user: userId });
  if (count >= MAX_CONTACTS_PER_USER) {
    throw new AppError(409, "CONTACT_LIMIT_REACHED", `You can save at most ${MAX_CONTACTS_PER_USER} emergency contacts`);
  }
  return EmergencyContact.create({ ...payload, user: userId });
}

export async function updateContact(userId, id, payload) {
  const contact = await EmergencyContact.findOneAndUpdate({ _id: id, user: userId }, payload, {
    returnDocument: "after",
    runValidators: true,
  });
  if (!contact) throw new AppError(404, "NOT_FOUND", "Emergency contact not found");
  return contact;
}

export async function deleteContact(userId, id) {
  const contact = await EmergencyContact.findOneAndDelete({ _id: id, user: userId });
  if (!contact) throw new AppError(404, "NOT_FOUND", "Emergency contact not found");
  return contact;
}
