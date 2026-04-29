import api from "./axios";

export const getWeeks = () => api.get("/api/weeks");
export const getActiveWeek = () => api.get("/api/weeks/active");
export const getLeaderboard = () => api.get("/api/weeks/leaderboard");
export const getWeekById = (id) => api.get(`/api/weeks/${id}`);
export const getWeekSubmissions = (id) =>
  api.get(`/api/weeks/${id}/submissions`);
export const getPublicStats = () => api.get("/api/weeks/stats/public");
