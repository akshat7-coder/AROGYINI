import { client } from "./client.js";

export const listJobs = (params) => client.get("/career/jobs", { params });
export const getSavedJobs = () => client.get("/career/saved");
export const listApplications = (params) => client.get("/career/applications", { params });
export const listScholarships = (params) => client.get("/career/scholarships", { params });
export const getJob = (id) => client.get(`/career/jobs/${id}`);
export const toggleSaveJob = (id) => client.post(`/career/jobs/${id}/save`);
export const applyToJob = (id, payload) => client.post(`/career/jobs/${id}/apply`, payload);
