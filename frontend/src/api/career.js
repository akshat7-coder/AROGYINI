import { client } from "./client.js";

export const listJobs = (params) => client.get("/career/jobs", { params });
export const getSavedJobs = () => client.get("/career/saved");
export const listApplications = (params) => client.get("/career/applications", { params });
export const listScholarships = (params) => client.get("/career/scholarships", { params });
