import api from "./axios";

export const getMyActivityLogs = (params) => api.get("/api/activity/me", { params });