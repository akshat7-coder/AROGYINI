import { client } from "./client.js";

export const signup = (payload) => client.post("/auth/signup", payload);
export const signin = (credentials) => client.post("/auth/signin", credentials);
export const getMe = () => client.get("/auth/me");
export const updateMe = (payload) => client.patch("/auth/me", payload);
export const changePassword = (payload) => client.patch("/auth/password", payload);
