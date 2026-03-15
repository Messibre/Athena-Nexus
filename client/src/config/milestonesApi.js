import api from "./axios";

export const getMilestoneCategories = () => api.get("/api/milestones/categories");
export const getMilestoneLevels = (categoryId) =>
  api.get(`/api/milestones/categories/${categoryId}/levels`);
export const getMilestoneChallenges = (levelId) =>
  api.get(`/api/milestones/levels/${levelId}/challenges`);
export const getMilestoneChallenge = (id) =>
  api.get(`/api/milestones/challenges/${id}`);

export const getMyMilestoneSubmissions = () =>
  api.get("/api/milestones/submissions/my");
export const createMilestoneSubmission = (payload) =>
  api.post("/api/milestones/submissions", payload);
export const updateMilestoneSubmission = (id, payload) =>
  api.put(`/api/milestones/submissions/${id}`, payload);

export const getMilestoneProgress = (params) =>
  api.get("/api/milestones/progress", { params });

export const adminCreateMilestoneCategory = (payload) =>
  api.post("/api/admin/milestones/categories", payload);
export const adminUpdateMilestoneCategory = (id, payload) =>
  api.put(`/api/admin/milestones/categories/${id}`, payload);
export const adminDeleteMilestoneCategory = (id) =>
  api.delete(`/api/admin/milestones/categories/${id}`);
export const adminGetMilestoneCategories = () =>
  api.get("/api/admin/milestones/categories");

export const adminCreateMilestoneLevel = (payload) =>
  api.post("/api/admin/milestones/levels", payload);
export const adminUpdateMilestoneLevel = (id, payload) =>
  api.put(`/api/admin/milestones/levels/${id}`, payload);
export const adminDeleteMilestoneLevel = (id) =>
  api.delete(`/api/admin/milestones/levels/${id}`);
export const adminGetMilestoneLevels = (params) =>
  api.get("/api/admin/milestones/levels", { params });

export const adminCreateMilestoneChallenge = (payload) =>
  api.post("/api/admin/milestones/challenges", payload);
export const adminUpdateMilestoneChallenge = (id, payload) =>
  api.put(`/api/admin/milestones/challenges/${id}`, payload);
export const adminDeleteMilestoneChallenge = (id) =>
  api.delete(`/api/admin/milestones/challenges/${id}`);
export const adminGetMilestoneChallenges = (params) =>
  api.get("/api/admin/milestones/challenges", { params });

export const adminGetMilestoneSubmissions = (params) =>
  api.get("/api/admin/milestones/submissions", { params });
export const adminGetMilestoneSubmission = (id) =>
  api.get(`/api/admin/milestones/submissions/${id}`);
export const adminUpdateMilestoneSubmissionStatus = (id, payload) =>
  api.put(`/api/admin/milestones/submissions/${id}/status`, payload);
