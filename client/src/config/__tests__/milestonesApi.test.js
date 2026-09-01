import {
  getMilestoneCategories,
  getMilestoneLevels,
  getMilestoneChallenges,
  getMilestoneChallenge,
  getMyMilestoneSubmissions,
  getPublicMilestoneSubmissions,
  createMilestoneSubmission,
  updateMilestoneSubmission,
  getMilestoneProgress,
  adminCreateMilestoneCategory,
  adminUpdateMilestoneCategory,
  adminDeleteMilestoneCategory,
  adminGetMilestoneCategories,
  adminCreateMilestoneLevel,
  adminUpdateMilestoneLevel,
  adminDeleteMilestoneLevel,
  adminGetMilestoneLevels,
  adminCreateMilestoneChallenge,
  adminUpdateMilestoneChallenge,
  adminDeleteMilestoneChallenge,
  adminGetMilestoneChallenges,
  adminGetMilestoneSubmissions,
  adminGetMilestoneSubmission,
  adminUpdateMilestoneSubmissionStatus,
} from "../milestonesApi";
import api from "../axios";

jest.mock("../axios", () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

describe("milestonesApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Public milestone read functions
  test("getMilestoneCategories calls GET /api/milestones/categories", () => {
    getMilestoneCategories();
    expect(api.get).toHaveBeenCalledWith("/api/milestones/categories");
  });

  test("getMilestoneLevels calls GET /api/milestones/categories/:categoryId/levels", () => {
    const categoryId = "cat1";
    getMilestoneLevels(categoryId);
    expect(api.get).toHaveBeenCalledWith(
      `/api/milestones/categories/${categoryId}/levels`,
    );
  });

  test("getMilestoneChallenges calls GET /api/milestones/levels/:levelId/challenges", () => {
    const levelId = "lvl1";
    getMilestoneChallenges(levelId);
    expect(api.get).toHaveBeenCalledWith(
      `/api/milestones/levels/${levelId}/challenges`,
    );
  });

  test("getMilestoneChallenge calls GET /api/milestones/challenges/:id", () => {
    const id = "ch1";
    getMilestoneChallenge(id);
    expect(api.get).toHaveBeenCalledWith(`/api/milestones/challenges/${id}`);
  });

  // User submissions
  test("getMyMilestoneSubmissions calls GET /api/milestones/submissions/my", () => {
    getMyMilestoneSubmissions();
    expect(api.get).toHaveBeenCalledWith("/api/milestones/submissions/my");
  });

  test("getPublicMilestoneSubmissions calls GET /api/milestones/submissions/public", () => {
    getPublicMilestoneSubmissions();
    expect(api.get).toHaveBeenCalledWith("/api/milestones/submissions/public");
  });

  test("createMilestoneSubmission calls POST /api/milestones/submissions", () => {
    const payload = { challengeId: "ch1", repoUrl: "https://github.com/x/y" };
    createMilestoneSubmission(payload);
    expect(api.post).toHaveBeenCalledWith(
      "/api/milestones/submissions",
      payload,
    );
  });

  test("updateMilestoneSubmission calls PUT /api/milestones/submissions/:id", () => {
    const id = "sub1";
    const payload = { repoUrl: "https://github.com/x/z" };
    updateMilestoneSubmission(id, payload);
    expect(api.put).toHaveBeenCalledWith(
      `/api/milestones/submissions/${id}`,
      payload,
    );
  });

  test("getMilestoneProgress calls GET /api/milestones/progress with params", () => {
    const params = { categoryId: "cat1" };
    getMilestoneProgress(params);
    expect(api.get).toHaveBeenCalledWith("/api/milestones/progress", {
      params,
    });
  });

  // Admin category endpoints
  test("adminCreateMilestoneCategory calls POST /api/admin/milestones/categories", () => {
    const payload = { key: "html", name: "HTML" };
    adminCreateMilestoneCategory(payload);
    expect(api.post).toHaveBeenCalledWith(
      "/api/admin/milestones/categories",
      payload,
    );
  });

  test("adminUpdateMilestoneCategory calls PUT /api/admin/milestones/categories/:id", () => {
    const id = "cat1";
    const payload = { name: "Updated" };
    adminUpdateMilestoneCategory(id, payload);
    expect(api.put).toHaveBeenCalledWith(
      `/api/admin/milestones/categories/${id}`,
      payload,
    );
  });

  test("adminDeleteMilestoneCategory calls DELETE /api/admin/milestones/categories/:id", () => {
    const id = "cat1";
    adminDeleteMilestoneCategory(id);
    expect(api.delete).toHaveBeenCalledWith(
      `/api/admin/milestones/categories/${id}`,
    );
  });

  test("adminGetMilestoneCategories calls GET /api/admin/milestones/categories", () => {
    adminGetMilestoneCategories();
    expect(api.get).toHaveBeenCalledWith("/api/admin/milestones/categories");
  });

  // Admin level endpoints
  test("adminCreateMilestoneLevel calls POST /api/admin/milestones/levels", () => {
    const payload = { categoryId: "cat1", levelNumber: 1, title: "Level 1" };
    adminCreateMilestoneLevel(payload);
    expect(api.post).toHaveBeenCalledWith(
      "/api/admin/milestones/levels",
      payload,
    );
  });

  test("adminUpdateMilestoneLevel calls PUT /api/admin/milestones/levels/:id", () => {
    const id = "lvl1";
    const payload = { title: "Updated" };
    adminUpdateMilestoneLevel(id, payload);
    expect(api.put).toHaveBeenCalledWith(
      `/api/admin/milestones/levels/${id}`,
      payload,
    );
  });

  test("adminDeleteMilestoneLevel calls DELETE /api/admin/milestones/levels/:id", () => {
    const id = "lvl1";
    adminDeleteMilestoneLevel(id);
    expect(api.delete).toHaveBeenCalledWith(
      `/api/admin/milestones/levels/${id}`,
    );
  });

  test("adminGetMilestoneLevels calls GET /api/admin/milestones/levels with params", () => {
    const params = { categoryId: "cat1" };
    adminGetMilestoneLevels(params);
    expect(api.get).toHaveBeenCalledWith("/api/admin/milestones/levels", {
      params,
    });
  });

  // Admin challenge endpoints
  test("adminCreateMilestoneChallenge calls POST /api/admin/milestones/challenges", () => {
    const payload = { levelId: "lvl1", title: "Challenge" };
    adminCreateMilestoneChallenge(payload);
    expect(api.post).toHaveBeenCalledWith(
      "/api/admin/milestones/challenges",
      payload,
    );
  });

  test("adminUpdateMilestoneChallenge calls PUT /api/admin/milestones/challenges/:id", () => {
    const id = "ch1";
    const payload = { title: "Updated" };
    adminUpdateMilestoneChallenge(id, payload);
    expect(api.put).toHaveBeenCalledWith(
      `/api/admin/milestones/challenges/${id}`,
      payload,
    );
  });

  test("adminDeleteMilestoneChallenge calls DELETE /api/admin/milestones/challenges/:id", () => {
    const id = "ch1";
    adminDeleteMilestoneChallenge(id);
    expect(api.delete).toHaveBeenCalledWith(
      `/api/admin/milestones/challenges/${id}`,
    );
  });

  test("adminGetMilestoneChallenges calls GET /api/admin/milestones/challenges with params", () => {
    const params = { levelId: "lvl1" };
    adminGetMilestoneChallenges(params);
    expect(api.get).toHaveBeenCalledWith("/api/admin/milestones/challenges", {
      params,
    });
  });

  // Admin submission endpoints
  test("adminGetMilestoneSubmissions calls GET /api/admin/milestones/submissions with params", () => {
    const params = { status: "approved" };
    adminGetMilestoneSubmissions(params);
    expect(api.get).toHaveBeenCalledWith("/api/admin/milestones/submissions", {
      params,
    });
  });

  test("adminGetMilestoneSubmission calls GET /api/admin/milestones/submissions/:id", () => {
    const id = "sub1";
    adminGetMilestoneSubmission(id);
    expect(api.get).toHaveBeenCalledWith(
      `/api/admin/milestones/submissions/${id}`,
    );
  });

  test("adminUpdateMilestoneSubmissionStatus calls PUT /api/admin/milestones/submissions/:id/status", () => {
    const id = "sub1";
    const payload = { status: "approved" };
    adminUpdateMilestoneSubmissionStatus(id, payload);
    expect(api.put).toHaveBeenCalledWith(
      `/api/admin/milestones/submissions/${id}/status`,
      payload,
    );
  });
});
