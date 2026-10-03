import { client } from "./client.js";

export const getSummary = () => client.get("/cycles/summary");
export const listCycles = (params) => client.get("/cycles", { params });
export const createCycle = (payload) => client.post("/cycles", payload);
export const updateCycle = (id, payload) => client.patch(`/cycles/${id}`, payload);
export const deleteCycle = (id) => client.delete(`/cycles/${id}`);
