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
  "../../controllers/feedbackController.js",
  () => ({
    createFeedback: (req, res) =>
      res.status(201).json({ message: "createFeedback called" }),
    listFeedback: (req, res) => res.json({ message: "listFeedback called" }),
    updateFeedbackStatus: (req, res) =>
      res.json({ message: "updateFeedbackStatus called", id: req.params.id }),
  }),
);

const { default: feedbackRouter } = await import("../feedback.js");

const app = express();
app.use(express.json());
app.use("/api/feedback", feedbackRouter);

describe("Feedback Router", () => {
  test("POST / is public", async () => {
    const res = await request(app)
      .post("/api/feedback")
      .send({ category: "bug", message: "Test" });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("createFeedback called");
  });

  test("GET / requires admin", async () => {
    const noAuth = await request(app).get("/api/feedback");
    expect(noAuth.status).toBe(401);

    const member = await request(app)
      .get("/api/feedback")
      .set("Authorization", "Bearer member-token");
    expect(member.status).toBe(403);
    expect(member.body.message).toBe("Forbidden");

    const admin = await request(app)
      .get("/api/feedback")
      .set("Authorization", "Bearer admin-token");
    expect(admin.status).toBe(200);
    expect(admin.body.message).toBe("listFeedback called");
  });

  test("PATCH /:id requires admin", async () => {
    const noAuth = await request(app)
      .patch("/api/feedback/fb123")
      .send({ status: "read" });
    expect(noAuth.status).toBe(401);

    const member = await request(app)
      .patch("/api/feedback/fb123")
      .set("Authorization", "Bearer member-token")
      .send({ status: "read" });
    expect(member.status).toBe(403);

    const admin = await request(app)
      .patch("/api/feedback/fb123")
      .set("Authorization", "Bearer admin-token")
      .send({ status: "read" });
    expect(admin.status).toBe(200);
    expect(admin.body.message).toBe("updateFeedbackStatus called");
    expect(admin.body.id).toBe("fb123");
  });
});
