import request from "supertest";
import express from "express";
import { describe, expect, test, jest } from "@jest/globals";

await jest.unstable_mockModule("../../middleware/auth.js", () => ({
  verifyToken: (req, res, next) => {
    if (req.headers.authorization === "Bearer valid-token") {
      req.user = { _id: "user123", role: "member" };
      next();
    } else {
      return res.status(401).json({ message: "Unauthorized" });
    }
  },
}));

await jest.unstable_mockModule(
  "../../controllers/milestones/milestonesController.js",
  () => ({
    listCategories: (req, res) =>
      res.json({ message: "listCategories called" }),
    listLevelsByCategory: (req, res) =>
      res.json({
        message: "listLevelsByCategory called",
        categoryId: req.params.categoryId,
      }),
    listChallengesByLevel: (req, res) =>
      res.json({
        message: "listChallengesByLevel called",
        levelId: req.params.levelId,
      }),
    getChallenge: (req, res) =>
      res.json({ message: "getChallenge called", id: req.params.id }),
    getMySubmissions: (req, res) =>
      res.json({ message: "getMySubmissions called", userId: req.user._id }),
    listPublicSubmissions: (req, res) =>
      res.json({ message: "listPublicSubmissions called" }),
    createSubmission: (req, res) =>
      res.status(201).json({ message: "createSubmission called" }),
    updateSubmission: (req, res) =>
      res.json({ message: "updateSubmission called", id: req.params.id }),
    getProgress: (req, res) =>
      res.json({ message: "getProgress called", userId: req.user._id }),
  }),
);

const { default: milestonesRouter } = await import("../milestones.js");

const app = express();
app.use(express.json());
app.use("/api/milestones", milestonesRouter);

describe("Milestones Router", () => {
  // ---------- Public routes ----------
  test("GET /categories", async () => {
    const res = await request(app).get("/api/milestones/categories");
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("listCategories called");
  });

  test("GET /categories/:categoryId/levels", async () => {
    const res = await request(app).get(
      "/api/milestones/categories/cat1/levels",
    );
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("listLevelsByCategory called");
    expect(res.body.categoryId).toBe("cat1");
  });

  test("GET /levels/:levelId/challenges", async () => {
    const res = await request(app).get(
      "/api/milestones/levels/lvl1/challenges",
    );
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("listChallengesByLevel called");
    expect(res.body.levelId).toBe("lvl1");
  });

  test("GET /challenges/:id", async () => {
    const res = await request(app).get("/api/milestones/challenges/ch1");
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("getChallenge called");
    expect(res.body.id).toBe("ch1");
  });

  test("GET /submissions/public", async () => {
    const res = await request(app).get("/api/milestones/submissions/public");
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("listPublicSubmissions called");
  });

  // ---------- Protected routes ----------
  test("GET /submissions/my requires token", async () => {
    const noAuth = await request(app).get("/api/milestones/submissions/my");
    expect(noAuth.status).toBe(401);
    expect(noAuth.body.message).toBe("Unauthorized");

    const withAuth = await request(app)
      .get("/api/milestones/submissions/my")
      .set("Authorization", "Bearer valid-token");
    expect(withAuth.status).toBe(200);
    expect(withAuth.body.message).toBe("getMySubmissions called");
    expect(withAuth.body.userId).toBe("user123");
  });

  test("POST /submissions requires token", async () => {
    const noAuth = await request(app)
      .post("/api/milestones/submissions")
      .send({ challengeId: "ch1" });
    expect(noAuth.status).toBe(401);

    const withAuth = await request(app)
      .post("/api/milestones/submissions")
      .set("Authorization", "Bearer valid-token")
      .send({ challengeId: "ch1" });
    expect(withAuth.status).toBe(201);
    expect(withAuth.body.message).toBe("createSubmission called");
  });

  test("PUT /submissions/:id requires token", async () => {
    const noAuth = await request(app)
      .put("/api/milestones/submissions/sub1")
      .send({ repoUrl: "https://github.com/x/y" });
    expect(noAuth.status).toBe(401);

    const withAuth = await request(app)
      .put("/api/milestones/submissions/sub1")
      .set("Authorization", "Bearer valid-token")
      .send({ repoUrl: "https://github.com/x/y" });
    expect(withAuth.status).toBe(200);
    expect(withAuth.body.message).toBe("updateSubmission called");
    expect(withAuth.body.id).toBe("sub1");
  });

  test("GET /progress requires token", async () => {
    const noAuth = await request(app).get("/api/milestones/progress");
    expect(noAuth.status).toBe(401);

    const withAuth = await request(app)
      .get("/api/milestones/progress")
      .set("Authorization", "Bearer valid-token");
    expect(withAuth.status).toBe(200);
    expect(withAuth.body.message).toBe("getProgress called");
    expect(withAuth.body.userId).toBe("user123");
  });
});
