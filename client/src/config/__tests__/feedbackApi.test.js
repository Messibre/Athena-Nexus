import { submitFeedback, getFeedback, updateFeedback } from "../feedbackApi";
import api from "../axios";

jest.mock("../axios", () => ({
  post: jest.fn(),
  get: jest.fn(),
  patch: jest.fn(),
}));

describe("feedbackApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("submitFeedback calls POST /api/feedback with payload", () => {
    const payload = { category: "bug", message: "Test" };
    submitFeedback(payload);
    expect(api.post).toHaveBeenCalledWith("/api/feedback", payload);
  });

  test("getFeedback calls GET /api/feedback with params", () => {
    const params = { category: "bug" };
    getFeedback(params);
    expect(api.get).toHaveBeenCalledWith("/api/feedback", { params });
  });

  test("updateFeedback calls PATCH /api/feedback/:id with payload", () => {
    const id = "fb1";
    const payload = { status: "read" };
    updateFeedback(id, payload);
    expect(api.patch).toHaveBeenCalledWith(`/api/feedback/${id}`, payload);
  });
});
