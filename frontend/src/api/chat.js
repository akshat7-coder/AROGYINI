import { client } from "./client.js";

export const listBots = () => client.get("/chat/bots");
export const listConversations = (params) => client.get("/chat/conversations", { params });
export const createConversation = (payload = {}) => client.post("/chat/conversations", payload);
export const getConversation = (id) => client.get(`/chat/conversations/${id}`);
export const sendMessage = (id, payload) => client.post(`/chat/conversations/${id}/messages`, payload);
export const deleteConversation = (id) => client.delete(`/chat/conversations/${id}`);
export const reportMessage = (id, payload) => client.post(`/chat/messages/${id}/report`, payload);
