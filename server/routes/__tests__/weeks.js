import request from "supertest";
import express from "express";
import { describe, expect, test, jest } from "@jest/globals";

await jest.unstable_mockModule("../../controllers/weeksController.js", () => ({
  getWeeks: (req, res) => res.json({ message: "getWeeks called" }),
  getActiveWeek: (req, res) => res.json({ message: "getActiveWeek called" }),
  getLeaderboard: (req, res) => res.json({ message: "getLeaderboard called" }),
  getWeekById: (req, res) =>
    res.json({ message: "getWeekById called", id: req.params.id }),
  getWeekSubmissions: (req, res) =>
    res.json({ message: "getWeekSubmissions called", id: req.params.id }),
  getPublicStats: (req, res) => res.json({ message: "getPublicStats called" }),
}));

const { default: weeksRouter } = await import("../weeks.js");

const app = express();
app.use("/api/weeks", weeksRouter);

describe("Weeks Router", () => {
  test("GET / routes to getWeeks", async () => {
    const res = await request(app).get("/api/weeks/");
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("getWeeks called");
  });

  test("GET /active routes to getActiveWeek (not getWeekById)", async () => {
    const res = await request(app).get("/api/weeks/active");
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("getActiveWeek called");
  });

  test("GET /leaderboard routes to getLeaderboard (not getWeekById)", async () => {
    const res = await request(app).get("/api/weeks/leaderboard");
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("getLeaderboard called");
  });

  test("GET /stats/public routes to getPublicStats", async () => {
    const res = await request(app).get("/api/weeks/stats/public");
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("getPublicStats called");
  });

  test("GET /:id routes to getWeekById", async () => {
    const res = await request(app).get("/api/weeks/42");
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("getWeekById called");
    expect(res.body.id).toBe("42");
  });

  test("GET /:id/submissions routes to getWeekSubmissions", async () => {
    const res = await request(app).get("/api/weeks/42/submissions");
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("getWeekSubmissions called");
    expect(res.body.id).toBe("42");
  });
});
