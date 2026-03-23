import api from "./axios";

export const login = (payload) =>
  api.post("/api/auth/login", payload, { skipAuthRedirect: true });
export const signup = (payload) =>
  api.post("/api/auth/signup", payload, { skipAuthRedirect: true });
export const logout = () =>
  api.post("/api/auth/logout", null, { skipAuthRedirect: true });
export const refresh = () =>
  api.post("/api/auth/refresh", null, { skipAuthRedirect: true });
export const getMe = () => api.get("/api/auth/me", { skipAuthRedirect: true });
export const changePassword = (payload) =>
  api.post("/api/auth/change-password", payload, { skipAuthRedirect: true });
