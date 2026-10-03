import EmergencyContact from "../models/EmergencyContact.js";
import SosEvent from "../models/SosEvent.js";
import { sendSms } from "./sms/index.js";
import { AppError } from "../utils/AppError.js";
import { formatIstDateTime } from "../utils/dates.js";

const mapsUrlFor = ({ latitude, longitude }) => `https://maps.google.com/?q=${latitude},${longitude}`;

export function buildSosMessage({ userName, mapsUrl, at = new Date(), message }) {
  const base = `EMERGENCY: ${userName} needs help. Live location: ${mapsUrl} Time: ${formatIstDateTime(at)}. Call 112.`;
  return message ? `${base} Note: ${message}` : base;
}

export const buildSafeMessage = (userName) =>
  `${userName} is safe now. The earlier AROGYINI emergency alert has been resolved.`;

// One SMS per contact; a failure for one contact must not stop the others.
async function notify(contacts, body) {
  const results = await Promise.allSettled(contacts.map((c) => sendSms({ to: c.phone, body })));

  return results.map((result, i) => ({
    name: contacts[i].name,
    phone: contacts[i].phone,
    ...(result.status === "fulfilled"
      ? { status: "sent", providerSid: result.value?.sid }
      : { status: "failed", error: String(result.reason?.message ?? result.reason).slice(0, 300) }),
  }));
}

export async function triggerSos(user, { latitude, longitude, accuracy, message }) {
  const contacts = await EmergencyContact.find({ user: user.id }).sort({ priority: 1 });
  if (contacts.length === 0) {
    throw new AppError(400, "NO_CONTACTS", "Add at least one emergency contact before using SOS");
  }

  const existing = await SosEvent.findOne({ user: user.id, status: "active" });
  if (existing) return { event: existing, created: false };

  const mapsUrl = mapsUrlFor({ latitude, longitude });
  const notifications = await notify(contacts, buildSosMessage({ userName: user.name, mapsUrl, message }));

  const event = await SosEvent.create({
    user: user.id,
    location: { latitude, longitude, accuracy },
    mapsUrl,
    message,
    notifications,
  });
  return { event, created: true };
}

export async function listSosEvents(userId, { page, limit, skip }) {
  const filter = { user: userId };
  const [events, total] = await Promise.all([
    SosEvent.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    SosEvent.countDocuments(filter),
  ]);
  return { events, meta: { page, limit, total } };
}

export async function getSosEvent(userId, id) {
  const event = await SosEvent.findOne({ _id: id, user: userId });
  if (!event) throw new AppError(404, "NOT_FOUND", "SOS event not found");
  return event;
}

export async function closeSosEvent({ id, userId, status, notifyContacts = false, user }) {
  const filter = { _id: id, status: "active", ...(userId ? { user: userId } : {}) };
  const event = await SosEvent.findOneAndUpdate(
    filter,
    { status, resolvedAt: new Date() },
    { returnDocument: "after" }
  );
  if (!event) throw new AppError(404, "NOT_FOUND", "No active SOS event found");

  if (notifyContacts && status === "resolved") {
    const contacts = await EmergencyContact.find({ user: event.user }).sort({ priority: 1 });
    await notify(contacts, buildSafeMessage(user?.name ?? "Your contact"));
  }
  return event;
}

export const countActiveSos = () => SosEvent.countDocuments({ status: "active" });

export async function listAllSosEvents({ page, limit, skip, status }) {
  const filter = status ? { status } : {};
  const [events, total] = await Promise.all([
    SosEvent.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("user", "name phone"),
    SosEvent.countDocuments(filter),
  ]);
  return { events, meta: { page, limit, total } };
}
