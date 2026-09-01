import {
  createWeek,
  updateWeek,
  deleteWeek,
  createUser,
  getUsers,
  updateUser,
  resetUserPassword,
  deleteUser,
  getSubmissions,
  updateSubmissionStatus,
  exportSubmissions,
  getStats,
} from "../adminApi";
import api from "../axios";

jest.mock("../axios", () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

describe("adminApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Weeks
  test("createWeek calls POST /api/admin/weeks with payload", () => {
    const payload = { week_number: 1, title: "Week 1" };
    createWeek(payload);
    expect(api.post).toHaveBeenCalledWith("/api/admin/weeks", payload);
  });

  test("updateWeek calls PUT /api/admin/weeks/:id with payload", () => {
    const id = "w1";
    const payload = { title: "Updated" };
    updateWeek(id, payload);
    expect(api.put).toHaveBeenCalledWith(`/api/admin/weeks/${id}`, payload);
  });

  test("deleteWeek calls DELETE /api/admin/weeks/:id", () => {
    const id = "w1";
    deleteWeek(id);
    expect(api.delete).toHaveBeenCalledWith(`/api/admin/weeks/${id}`);
  });

  // Users
  test("createUser calls POST /api/admin/users with payload", () => {
    const payload = { username: "newuser", password: "Pass123" };
    createUser(payload);
    expect(api.post).toHaveBeenCalledWith("/api/admin/users", payload);
  });

  test("getUsers calls GET /api/admin/users", () => {
    getUsers();
    expect(api.get).toHaveBeenCalledWith("/api/admin/users");
  });

  test("updateUser calls PUT /api/admin/users/:id with payload", () => {
    const id = "u1";
    const payload = { displayName: "Updated" };
    updateUser(id, payload);
    expect(api.put).toHaveBeenCalledWith(`/api/admin/users/${id}`, payload);
  });

  test("resetUserPassword calls POST /api/admin/users/:id/reset-password with payload", () => {
    const id = "u1";
    const payload = { newPassword: "NewPass123" };
    resetUserPassword(id, payload);
    expect(api.post).toHaveBeenCalledWith(
      `/api/admin/users/${id}/reset-password`,
      payload,
    );
  });

  test("deleteUser calls DELETE /api/admin/users/:id", () => {
    const id = "u1";
    deleteUser(id);
    expect(api.delete).toHaveBeenCalledWith(`/api/admin/users/${id}`);
  });

  // Submissions
  test("getSubmissions calls GET /api/admin/submissions with params", () => {
    const params = { status: "approved" };
    getSubmissions(params);
    expect(api.get).toHaveBeenCalledWith("/api/admin/submissions", { params });
  });

  test("updateSubmissionStatus calls PUT /api/admin/submissions/:id/status with payload", () => {
    const id = "s1";
    const payload = { status: "approved" };
    updateSubmissionStatus(id, payload);
    expect(api.put).toHaveBeenCalledWith(
      `/api/admin/submissions/${id}/status`,
      payload,
    );
  });

  test("exportSubmissions calls GET /api/admin/submissions/export with blob response", () => {
    exportSubmissions();
    expect(api.get).toHaveBeenCalledWith("/api/admin/submissions/export", {
      responseType: "blob",
    });
  });

  // Stats
  test("getStats calls GET /api/admin/stats", () => {
    getStats();
    expect(api.get).toHaveBeenCalledWith("/api/admin/stats");
  });
});
