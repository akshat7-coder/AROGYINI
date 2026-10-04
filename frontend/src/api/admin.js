import { client } from "./client.js";

export const getStats = () => client.get("/admin/stats");

export const listUsers = (params) => client.get("/admin/users", { params });
export const setUserRole = (id, role) => client.patch(`/admin/users/${id}/role`, { role });
export const setUserStatus = (id, isActive) => client.patch(`/admin/users/${id}/status`, { isActive });

export const listSosEvents = (params) => client.get("/admin/sos", { params });
export const resolveSosEvent = (id) => client.patch(`/admin/sos/${id}/resolve`);

export const listRights = (params) => client.get("/admin/legal", { params });
export const createRight = (payload) => client.post("/admin/legal", payload);
export const updateRight = (id, payload) => client.patch(`/admin/legal/${id}`, payload);
export const deleteRight = (id) => client.delete(`/admin/legal/${id}`);

export const listJobs = (params) => client.get("/admin/jobs", { params });
export const createJob = (payload) => client.post("/admin/jobs", payload);
export const updateJob = (id, payload) => client.patch(`/admin/jobs/${id}`, payload);
export const deleteJob = (id) => client.delete(`/admin/jobs/${id}`);
export const listJobApplications = (id, params) => client.get(`/admin/jobs/${id}/applications`, { params });
export const setApplicationStatus = (id, status) => client.patch(`/admin/applications/${id}`, { status });

export const listScholarships = (params) => client.get("/admin/scholarships", { params });
export const createScholarship = (payload) => client.post("/admin/scholarships", payload);
export const updateScholarship = (id, payload) => client.patch(`/admin/scholarships/${id}`, payload);
export const deleteScholarship = (id) => client.delete(`/admin/scholarships/${id}`);

export const listIssues = (params) => client.get("/admin/chat/issues", { params });
export const updateIssue = (id, payload) => client.patch(`/admin/chat/issues/${id}`, payload);
export const retryIssue = (id) => client.post(`/admin/chat/issues/${id}/retry`);
export const listBots = () => client.get("/admin/chat/bots");
export const updateBot = (key, payload) => client.patch(`/admin/chat/bots/${key}`, payload);
export const testBot = (key) => client.post(`/admin/chat/bots/${key}/test`);
