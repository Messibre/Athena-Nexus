import api from "./axios";

export const createWeek = (payload) => api.post("/api/admin/weeks", payload);
export const updateWeek = (id, payload) => api.put(`/api/admin/weeks/${id}`, payload);
export const deleteWeek = (id) => api.delete(`/api/admin/weeks/${id}`);

export const createUser = (payload) => api.post("/api/admin/users", payload);
export const getUsers = () => api.get("/api/admin/users");
export const updateUser = (id, payload) => api.put(`/api/admin/users/${id}`, payload);
export const resetUserPassword = (id, payload) =>
  api.post(`/api/admin/users/${id}/reset-password`, payload);
export const deleteUser = (id) => api.delete(`/api/admin/users/${id}`);

export const getSubmissions = (params) =>
  api.get("/api/admin/submissions", { params });
export const updateSubmissionStatus = (id, payload) =>
  api.put(`/api/admin/submissions/${id}/status`, payload);
export const exportSubmissions = () =>
  api.get("/api/admin/submissions/export", { responseType: "blob" });

export const getStats = () => api.get("/api/admin/stats");
