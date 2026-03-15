import api from "./axios";

export const login = (payload) => api.post("/api/auth/login", payload);
export const signup = (payload) => api.post("/api/auth/signup", payload);
export const getMe = () => api.get("/api/auth/me");
export const changePassword = (payload) =>
  api.post("/api/auth/change-password", payload);
