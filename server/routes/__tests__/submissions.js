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
  "../../controllers/submissionsController.js",
  () => ({
    getPublicSubmissions: (req, res) =>
      res.json({ message: "getPublicSubmissions called" }),
    getMySubmissions: (req, res) =>
      res.json({ message: "getMySubmissions called", userId: req.user._id }),
    getSubmissionById: (req, res) =>
      res.json({ message: "getSubmissionById called", id: req.params.id }),
    createSubmission: (req, res) =>
      res.status(201).json({ message: "createSubmission called" }),
    updateSubmission: (req, res) =>
      res.json({ message: "updateSubmission called", id: req.params.id }),
  }),
);

const { default: submissionsRouter } = await import("../submissions.js");

const app = express();
app.use(express.json());
app.use("/api/submissions", submissionsRouter);

describe("Submissions Router", () => {
  test("GET /public", async () => {
    const res = await request(app).get("/api/submissions/public");
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("getPublicSubmissions called");
  });

  test("GET /my-submissions requires token", async () => {
    const noAuth = await request(app).get("/api/submissions/my-submissions");
    expect(noAuth.status).toBe(401);

    const withAuth = await request(app)
      .get("/api/submissions/my-submissions")
      .set("Authorization", "Bearer valid-token");
    expect(withAuth.status).toBe(200);
    expect(withAuth.body.message).toBe("getMySubmissions called");
    expect(withAuth.body.userId).toBe("user123");
  });

  test("GET /:id", async () => {
    const res = await request(app).get("/api/submissions/42");
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("getSubmissionById called");
    expect(res.body.id).toBe("42");
  });

  test("POST / requires token", async () => {
    const noAuth = await request(app)
      .post("/api/submissions")
      .send({ week_id: "w1", github_repo_url: "https://github.com/x/y" });
    expect(noAuth.status).toBe(401);

    const withAuth = await request(app)
      .post("/api/submissions")
      .set("Authorization", "Bearer valid-token")
      .send({ week_id: "w1", github_repo_url: "https://github.com/x/y" });
    expect(withAuth.status).toBe(201);
    expect(withAuth.body.message).toBe("createSubmission called");
  });

  test("PUT /:id requires token", async () => {
    const noAuth = await request(app)
      .put("/api/submissions/42")
      .send({ description: "Updated" });
    expect(noAuth.status).toBe(401);

    const withAuth = await request(app)
      .put("/api/submissions/42")
      .set("Authorization", "Bearer valid-token")
      .send({ description: "Updated" });
    expect(withAuth.status).toBe(200);
    expect(withAuth.body.message).toBe("updateSubmission called");
    expect(withAuth.body.id).toBe("42");
  });
});
