import api from "./axios";

export const updateUser = (id, payload) => api.put(`/api/users/${id}`, payload);
