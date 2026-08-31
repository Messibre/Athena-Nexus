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

await jest.unstable_mockModule("../../controllers/adminController.js", () => ({
  createWeek: (req, res) =>
    res.status(201).json({ message: "createWeek called" }),
  updateWeek: (req, res) =>
    res.json({ message: "updateWeek called", id: req.params.id }),
  deleteWeek: (req, res) =>
    res.json({ message: "deleteWeek called", id: req.params.id }),
  createUser: (req, res) =>
    res.status(201).json({ message: "createUser called" }),
  getUsers: (req, res) => res.json({ message: "getUsers called" }),
  updateUser: (req, res) =>
    res.json({ message: "updateUser called", id: req.params.id }),
  resetUserPassword: (req, res) =>
    res.json({ message: "resetUserPassword called", id: req.params.id }),
  deleteUser: (req, res) =>
    res.json({ message: "deleteUser called", id: req.params.id }),
  getSubmissions: (req, res) => res.json({ message: "getSubmissions called" }),
  updateSubmissionStatus: (req, res) =>
    res.json({ message: "updateSubmissionStatus called", id: req.params.id }),
  exportSubmissions: (req, res) =>
    res.json({ message: "exportSubmissions called" }),
  getStats: (req, res) => res.json({ message: "getStats called" }),
}));

const { default: adminRouter } = await import("../admin.js");

const app = express();
app.use(express.json());
app.use("/api/admin", adminRouter);

describe("Admin Router (Weeks/Users/Submissions)", () => {
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
    "POST /weeks - admin",
    testProtectedRoute("post", "/api/admin/weeks", 201, "createWeek called"),
  );
  test(
    "PUT /weeks/:id - admin",
    testProtectedRoute("put", "/api/admin/weeks/w1", 200, "updateWeek called"),
  );
  test(
    "DELETE /weeks/:id - admin",
    testProtectedRoute(
      "delete",
      "/api/admin/weeks/w1",
      200,
      "deleteWeek called",
    ),
  );

  test(
    "POST /users - admin",
    testProtectedRoute("post", "/api/admin/users", 201, "createUser called"),
  );
  test(
    "GET /users - admin",
    testProtectedRoute("get", "/api/admin/users", 200, "getUsers called"),
  );
  test(
    "PUT /users/:id - admin",
    testProtectedRoute("put", "/api/admin/users/u1", 200, "updateUser called"),
  );
  test(
    "POST /users/:id/reset-password - admin",
    testProtectedRoute(
      "post",
      "/api/admin/users/u1/reset-password",
      200,
      "resetUserPassword called",
    ),
  );
  test(
    "DELETE /users/:id - admin",
    testProtectedRoute(
      "delete",
      "/api/admin/users/u1",
      200,
      "deleteUser called",
    ),
  );

  test(
    "GET /submissions - admin",
    testProtectedRoute(
      "get",
      "/api/admin/submissions",
      200,
      "getSubmissions called",
    ),
  );
  test(
    "PUT /submissions/:id/status - admin",
    testProtectedRoute(
      "put",
      "/api/admin/submissions/s1/status",
      200,
      "updateSubmissionStatus called",
    ),
  );
  test(
    "GET /submissions/export - admin",
    testProtectedRoute(
      "get",
      "/api/admin/submissions/export",
      200,
      "exportSubmissions called",
    ),
  );

  test(
    "GET /stats - admin",
    testProtectedRoute("get", "/api/admin/stats", 200, "getStats called"),
  );

  test(
    "GET /users - member forbidden",
    testForbidden("get", "/api/admin/users"),
  );
  test(
    "POST /weeks - member forbidden",
    testForbidden("post", "/api/admin/weeks"),
  );
  test(
    "PUT /submissions/:id/status - member forbidden",
    testForbidden("put", "/api/admin/submissions/s1/status"),
  );

  test(
    "GET /stats - no token unauthorized",
    testUnauthorized("get", "/api/admin/stats"),
  );
  test(
    "POST /users - no token unauthorized",
    testUnauthorized("post", "/api/admin/users"),
  );
});
