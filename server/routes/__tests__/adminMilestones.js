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
  "../../controllers/milestones/adminMilestonesController.js",
  () => ({
    createCategory: (req, res) =>
      res.status(201).json({ message: "createCategory called" }),
    listCategories: (req, res) =>
      res.json({ message: "listCategories called" }),
    getCategory: (req, res) =>
      res.json({ message: "getCategory called", id: req.params.id }),
    updateCategory: (req, res) =>
      res.json({ message: "updateCategory called", id: req.params.id }),
    deleteCategory: (req, res) =>
      res.json({ message: "deleteCategory called", id: req.params.id }),
    createLevel: (req, res) =>
      res.status(201).json({ message: "createLevel called" }),
    listLevels: (req, res) => res.json({ message: "listLevels called" }),
    getLevel: (req, res) =>
      res.json({ message: "getLevel called", id: req.params.id }),
    updateLevel: (req, res) =>
      res.json({ message: "updateLevel called", id: req.params.id }),
    deleteLevel: (req, res) =>
      res.json({ message: "deleteLevel called", id: req.params.id }),
    createChallenge: (req, res) =>
      res.status(201).json({ message: "createChallenge called" }),
    listChallenges: (req, res) =>
      res.json({ message: "listChallenges called" }),
    getChallenge: (req, res) =>
      res.json({ message: "getChallenge called", id: req.params.id }),
    updateChallenge: (req, res) =>
      res.json({ message: "updateChallenge called", id: req.params.id }),
    deleteChallenge: (req, res) =>
      res.json({ message: "deleteChallenge called", id: req.params.id }),
    listSubmissions: (req, res) =>
      res.json({ message: "listSubmissions called" }),
    getSubmission: (req, res) =>
      res.json({ message: "getSubmission called", id: req.params.id }),
    updateSubmissionStatus: (req, res) =>
      res.json({ message: "updateSubmissionStatus called", id: req.params.id }),
  }),
);

const { default: adminMilestonesRouter } =
  await import("../adminMilestones.js");

const app = express();
app.use(express.json());
app.use("/api/admin/milestones", adminMilestonesRouter);

describe("Admin Milestones Router", () => {
  const testProtectedRoute = (
    method,
    path,
    expectedStatus,
    expectedMessage,
  ) => {
    return async () => {
      const res = await request(app)
        [method](path)
        .set("Authorization", "Bearer admin-token");
      expect(res.status).toBe(expectedStatus);
      if (expectedMessage) expect(res.body.message).toBe(expectedMessage);
    };
  };

  const testForbidden = (method, path) => {
    return async () => {
      const res = await request(app)
        [method](path)
        .set("Authorization", "Bearer member-token");
      expect(res.status).toBe(403);
      expect(res.body.message).toBe("Forbidden");
    };
  };

  const testUnauthorized = (method, path) => {
    return async () => {
      const res = await request(app)[method](path);
      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Unauthorized");
    };
  };

  test(
    "POST /categories - admin",
    testProtectedRoute(
      "post",
      "/api/admin/milestones/categories",
      201,
      "createCategory called",
    ),
  );
  test(
    "GET /categories - admin",
    testProtectedRoute(
      "get",
      "/api/admin/milestones/categories",
      200,
      "listCategories called",
    ),
  );
  test(
    "GET /categories/:id - admin",
    testProtectedRoute(
      "get",
      "/api/admin/milestones/categories/cat1",
      200,
      "getCategory called",
    ),
  );
  test(
    "PUT /categories/:id - admin",
    testProtectedRoute(
      "put",
      "/api/admin/milestones/categories/cat1",
      200,
      "updateCategory called",
    ),
  );
  test(
    "DELETE /categories/:id - admin",
    testProtectedRoute(
      "delete",
      "/api/admin/milestones/categories/cat1",
      200,
      "deleteCategory called",
    ),
  );

  // Levels
  test(
    "POST /levels - admin",
    testProtectedRoute(
      "post",
      "/api/admin/milestones/levels",
      201,
      "createLevel called",
    ),
  );
  test(
    "GET /levels - admin",
    testProtectedRoute(
      "get",
      "/api/admin/milestones/levels",
      200,
      "listLevels called",
    ),
  );
  test(
    "GET /levels/:id - admin",
    testProtectedRoute(
      "get",
      "/api/admin/milestones/levels/lvl1",
      200,
      "getLevel called",
    ),
  );
  test(
    "PUT /levels/:id - admin",
    testProtectedRoute(
      "put",
      "/api/admin/milestones/levels/lvl1",
      200,
      "updateLevel called",
    ),
  );
  test(
    "DELETE /levels/:id - admin",
    testProtectedRoute(
      "delete",
      "/api/admin/milestones/levels/lvl1",
      200,
      "deleteLevel called",
    ),
  );

  test(
    "POST /challenges - admin",
    testProtectedRoute(
      "post",
      "/api/admin/milestones/challenges",
      201,
      "createChallenge called",
    ),
  );
  test(
    "GET /challenges - admin",
    testProtectedRoute(
      "get",
      "/api/admin/milestones/challenges",
      200,
      "listChallenges called",
    ),
  );
  test(
    "GET /challenges/:id - admin",
    testProtectedRoute(
      "get",
      "/api/admin/milestones/challenges/ch1",
      200,
      "getChallenge called",
    ),
  );
  test(
    "PUT /challenges/:id - admin",
    testProtectedRoute(
      "put",
      "/api/admin/milestones/challenges/ch1",
      200,
      "updateChallenge called",
    ),
  );
  test(
    "DELETE /challenges/:id - admin",
    testProtectedRoute(
      "delete",
      "/api/admin/milestones/challenges/ch1",
      200,
      "deleteChallenge called",
    ),
  );

  test(
    "GET /submissions - admin",
    testProtectedRoute(
      "get",
      "/api/admin/milestones/submissions",
      200,
      "listSubmissions called",
    ),
  );
  test(
    "GET /submissions/:id - admin",
    testProtectedRoute(
      "get",
      "/api/admin/milestones/submissions/sub1",
      200,
      "getSubmission called",
    ),
  );
  test(
    "PUT /submissions/:id/status - admin",
    testProtectedRoute(
      "put",
      "/api/admin/milestones/submissions/sub1/status",
      200,
      "updateSubmissionStatus called",
    ),
  );

  test(
    "GET /categories - member forbidden",
    testForbidden("get", "/api/admin/milestones/categories"),
  );
  test(
    "POST /levels - member forbidden",
    testForbidden("post", "/api/admin/milestones/levels"),
  );
  test(
    "DELETE /challenges/:id - member forbidden",
    testForbidden("delete", "/api/admin/milestones/challenges/ch1"),
  );

  test(
    "GET /categories - no token unauthorized",
    testUnauthorized("get", "/api/admin/milestones/categories"),
  );
  test(
    "PUT /submissions/:id/status - no token unauthorized",
    testUnauthorized("put", "/api/admin/milestones/submissions/sub1/status"),
  );
});
