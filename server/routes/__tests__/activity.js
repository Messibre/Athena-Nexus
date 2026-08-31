import request from "supertest";
import express from "express";
import { describe, expect, test, jest } from "@jest/globals";

await jest.unstable_mockModule("../../middleware/auth.js", () => ({
  verifyToken: (req, res, next) => {
    if (req.headers.authorization === "Bearer admin-token") {
      req.user = { _id: "admin1", role: "admin" };
      next();
    } else if (req.headers.authorization === "Bearer member-token") {
      req.user = { _id: "user1", role: "member" };
      next();
    } else {
      return res.status(401).json({ message: "Unauthorized" });
    }
  },
  isAdmin: (req, res, next) => {
    if (req.user.role === "admin") {
      next();
    } else {
      return res.status(403).json({ message: "Forbidden" });
    }
  },
}));

await jest.unstable_mockModule(
  "../../controllers/activityController.js",
  () => ({
    getActivityLogs: (req, res) =>
      res.json({ message: "getActivityLogs called" }),
    getMyActivityLogs: (req, res) =>
      res.json({ message: "getMyActivityLogs called", userId: req.user._id }),
  }),
);

const { default: activityRouter } = await import("../activity.js");

const app = express();
app.use("/api/activity", activityRouter);

describe("Activity Router", () => {
  test("GET / requires admin", async () => {
    const noAuth = await request(app).get("/api/activity");
    expect(noAuth.status).toBe(401);

    const member = await request(app)
      .get("/api/activity")
      .set("Authorization", "Bearer member-token");
    expect(member.status).toBe(403);
    expect(member.body.message).toBe("Forbidden");

    const admin = await request(app)
      .get("/api/activity")
      .set("Authorization", "Bearer admin-token");
    expect(admin.status).toBe(200);
    expect(admin.body.message).toBe("getActivityLogs called");
  });

  test("GET /me requires any authenticated user", async () => {
    const noAuth = await request(app).get("/api/activity/me");
    expect(noAuth.status).toBe(401);

    const member = await request(app)
      .get("/api/activity/me")
      .set("Authorization", "Bearer member-token");
    expect(member.status).toBe(200);
    expect(member.body.message).toBe("getMyActivityLogs called");
    expect(member.body.userId).toBe("user1");

    const admin = await request(app)
      .get("/api/activity/me")
      .set("Authorization", "Bearer admin-token");
    expect(admin.status).toBe(200);
    expect(admin.body.userId).toBe("admin1");
  });
});
