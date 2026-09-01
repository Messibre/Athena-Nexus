import { getMyActivityLogs } from "../activityApi";
import api from "../axios";

jest.mock("../axios", () => ({
  get: jest.fn(),
}));

describe("activityApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("getMyActivityLogs calls GET /api/activity/me with params", () => {
    const params = { limit: 10 };
    getMyActivityLogs(params);
    expect(api.get).toHaveBeenCalledWith("/api/activity/me", { params });
  });

  test("getMyActivityLogs calls GET /api/activity/me without params when none provided", () => {
    getMyActivityLogs();
    expect(api.get).toHaveBeenCalledWith("/api/activity/me", {
      params: undefined,
    });
  });
});
