import request from "supertest";
import express from "express";
import { describe, expect, test, jest } from "@jest/globals";

await jest.unstable_mockModule("../../middleware/auth.js", () => ({
  verifyToken: (req, res, next) => {
    if (req.headers.authorization === "Bearer valid-token") {
      req.user = { _id: "admin1", role: "admin" };
      next();
    } else {
      return res.status(401).json({ message: "Unauthorized" });
    }
  },
}));

await jest.unstable_mockModule("../../controllers/adminController.js", () => ({
  updateUser: (req, res) =>
    res.json({ message: "updateUser called", userId: req.params.id }),
}));

const { default: adminUserRouter } = await import("../users.js");

const app = express();
app.use(express.json());
app.use("/api/admin/users", adminUserRouter);

describe("Admin User Router", () => {
  test("PUT /:id with valid token calls updateUser", async () => {
    const res = await request(app)
      .put("/api/admin/users/123")
      .set("Authorization", "Bearer valid-token")
      .send({ displayName: "Updated" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("updateUser called");
    expect(res.body.userId).toBe("123");
  });

  test("PUT /:id without token returns 401", async () => {
    const res = await request(app)
      .put("/api/admin/users/123")
      .send({ displayName: "Updated" });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized");
  });
});
