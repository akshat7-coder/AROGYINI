import { client } from "./client.js";

export const listRights = (params) => client.get("/legal/rights", { params });
export const getRight = (slug) => client.get(`/legal/rights/${slug}`);
export const createDraft = (payload) => client.post("/legal/drafts", payload);
