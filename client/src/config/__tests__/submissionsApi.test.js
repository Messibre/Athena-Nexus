import {
  getPublicSubmissions,
  getMySubmissions,
  getSubmissionById,
  createSubmission,
  updateSubmission,
} from "../submissionsApi";
import api from "../axios";

jest.mock("../axios", () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
}));

describe("submissionsApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("getPublicSubmissions calls GET /api/submissions/public with params", () => {
    const params = { weekId: "w1", status: "approved" };
    getPublicSubmissions(params);
    expect(api.get).toHaveBeenCalledWith("/api/submissions/public", { params });
  });

  test("getMySubmissions calls GET /api/submissions/my-submissions", () => {
    getMySubmissions();
    expect(api.get).toHaveBeenCalledWith("/api/submissions/my-submissions");
  });

  test("getSubmissionById calls GET /api/submissions/:id", () => {
    const id = "sub1";
    getSubmissionById(id);
    expect(api.get).toHaveBeenCalledWith(`/api/submissions/${id}`);
  });

  test("createSubmission calls POST /api/submissions with payload", () => {
    const payload = {
      week_id: "w1",
      github_repo_url: "https://github.com/x/y",
    };
    createSubmission(payload);
    expect(api.post).toHaveBeenCalledWith("/api/submissions", payload);
  });

  test("updateSubmission calls PUT /api/submissions/:id with payload", () => {
    const id = "sub1";
    const payload = { description: "Updated" };
    updateSubmission(id, payload);
    expect(api.put).toHaveBeenCalledWith(`/api/submissions/${id}`, payload);
  });
});
