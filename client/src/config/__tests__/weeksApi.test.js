import {
  getWeeks,
  getActiveWeek,
  getLeaderboard,
  getWeekById,
  getWeekSubmissions,
  getPublicStats,
} from "../weeksApi";
import api from "../axios";

jest.mock("../axios", () => ({
  get: jest.fn(),
}));

describe("weeksApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("getWeeks calls GET /api/weeks", () => {
    getWeeks();
    expect(api.get).toHaveBeenCalledWith("/api/weeks");
  });

  test("getActiveWeek calls GET /api/weeks/active", () => {
    getActiveWeek();
    expect(api.get).toHaveBeenCalledWith("/api/weeks/active");
  });

  test("getLeaderboard calls GET /api/weeks/leaderboard", () => {
    getLeaderboard();
    expect(api.get).toHaveBeenCalledWith("/api/weeks/leaderboard");
  });

  test("getWeekById calls GET /api/weeks/:id", () => {
    const id = "42";
    getWeekById(id);
    expect(api.get).toHaveBeenCalledWith(`/api/weeks/${id}`);
  });

  test("getWeekSubmissions calls GET /api/weeks/:id/submissions", () => {
    const id = "42";
    getWeekSubmissions(id);
    expect(api.get).toHaveBeenCalledWith(`/api/weeks/${id}/submissions`);
  });

  test("getPublicStats calls GET /api/weeks/stats/public", () => {
    getPublicStats();
    expect(api.get).toHaveBeenCalledWith("/api/weeks/stats/public");
  });
});
