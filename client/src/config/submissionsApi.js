import api from "./axios";

export const getPublicSubmissions = (params) =>
  api.get("/api/submissions/public", { params });
export const getMySubmissions = () => api.get("/api/submissions/my-submissions");
export const getSubmissionById = (id) => api.get(`/api/submissions/${id}`);
export const createSubmission = (payload) => api.post("/api/submissions", payload);
export const updateSubmission = (id, payload) =>
  api.put(`/api/submissions/${id}`, payload);
