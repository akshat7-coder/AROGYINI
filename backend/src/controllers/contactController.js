import * as contactService from "../services/contactService.js";
import { ok, created, noContent } from "../utils/apiResponse.js";

export async function listContacts(req, res) {
  return ok(res, { contacts: await contactService.listContacts(req.user.id) });
}

export async function createContact(req, res) {
  return created(res, { contact: await contactService.createContact(req.user.id, req.body) });
}

export async function updateContact(req, res) {
  return ok(res, { contact: await contactService.updateContact(req.user.id, req.params.id, req.body) });
}

export async function deleteContact(req, res) {
  await contactService.deleteContact(req.user.id, req.params.id);
  return noContent(res);
}
