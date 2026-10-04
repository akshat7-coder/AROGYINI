import { client } from "./client.js";

export const getHelplines = () => client.get("/safety/helplines");

export const listContacts = () => client.get("/contacts");
export const createContact = (payload) => client.post("/contacts", payload);
export const updateContact = (id, payload) => client.patch(`/contacts/${id}`, payload);
export const deleteContact = (id) => client.delete(`/contacts/${id}`);

export const triggerSos = (payload) => client.post("/sos", payload);
export const listSosEvents = (params) => client.get("/sos", { params });
export const getSosEvent = (id) => client.get(`/sos/${id}`);

export const resolveSos = (id, { notify = false } = {}) =>
  // `null` here would be serialised as the JSON literal null, which the API rejects.
  client.patch(`/sos/${id}/resolve`, {}, { params: notify ? { notify: "true" } : undefined });

export const cancelSos = (id) => client.patch(`/sos/${id}/cancel`);
