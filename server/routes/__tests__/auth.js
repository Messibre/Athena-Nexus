import request from "supertest";
import express from "express";
import { describe, expect, test, jest } from "@jest/globals";

await jest.unstable_mockModule("../../middleware/rateLimiter.js", () => ({
  loginLimiter: (req, res, next) => next(),
}));

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

await jest.unstable_mockModule("../../controllers/authController.js", () => ({
  signup: (req, res) =>
    res.status(201).json({ message: "signup controller called" }),
  login: (req, res) => res.json({ message: "login controller called" }),
  refreshToken: (req, res) =>
    res.json({ message: "refreshToken controller called" }),
  logout: (req, res) => res.json({ message: "logout controller called" }),
  getMe: (req, res) => res.json({ user: req.user, message: "getMe called" }),
  changePassword: (req, res) =>
    res.json({ message: "changePassword controller called" }),
  startOAuthLogin: (req, res) =>
    res.redirect("https://provider.example.com/authorize"),
  oauthCallback: (req, res) =>
    res.json({ message: "oauthCallback controller called" }),
}));

const { default: authRouter } = await import("../../routes/auth.js");

const app = express();
app.use(express.json());
app.use("/api/auth", authRouter);

describe("Auth Router", () => {
  test("POST /signup routes to signup controller", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ username: "test", password: "Pass123" });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("signup controller called");
  });

  test("POST /login runs loginLimiter and routes to login controller", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "test", password: "Pass123" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("login controller called");
  });

  test("POST /refresh routes to refreshToken controller", async () => {
    const res = await request(app).post("/api/auth/refresh");

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("refreshToken controller called");
  });

  test("POST /logout routes to logout controller", async () => {
    const res = await request(app).post("/api/auth/logout");

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("logout controller called");
  });

  test("GET /me with valid token returns user", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer valid-token");

    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({ _id: "user123", role: "member" });
    expect(res.body.message).toBe("getMe called");
  });

  test("GET /me without token returns 401", async () => {
    const res = await request(app).get("/api/auth/me");

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized");
  });

  test("POST /change-password with valid token routes to changePassword", async () => {
    const res = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", "Bearer valid-token")
      .send({ currentPassword: "old", newPassword: "NewPass123" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("changePassword controller called");
  });

  test("POST /change-password without token returns 401", async () => {
    const res = await request(app)
      .post("/api/auth/change-password")
      .send({ currentPassword: "old", newPassword: "NewPass123" });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized");
  });

  test("GET /oauth/google/start redirects", async () => {
    const res = await request(app).get("/api/auth/oauth/google/start");

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("https://provider.example.com/authorize");
  });

  test("GET /oauth/github/callback routes to oauthCallback", async () => {
    const res = await request(app).get("/api/auth/oauth/github/callback");

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("oauthCallback controller called");
  });
});
