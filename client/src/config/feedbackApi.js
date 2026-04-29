import api from "./axios";

export const submitFeedback = (payload) => api.post("/api/feedback", payload);
export const getFeedback = (params) => api.get("/api/feedback", { params });
export const updateFeedback = (id, payload) =>
  api.patch(`/api/feedback/${id}`, payload);