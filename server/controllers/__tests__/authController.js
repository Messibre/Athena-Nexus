import jwt from "jsonwebtoken";
import crypto from "crypto";
import { jest } from "@jest/globals";

await jest.unstable_mockModule("../../utils/validators.js", () => ({
  isValidPassword: jest.fn().mockResolvedValue(true),
}));

import User from "../../models/User.js";
import ActivityLog from "../../models/ActivityLog.js";
import { isValidPassword } from "../../utils/validators.js";

import * as funs from "../authController";

describe("sanitizing return origins", () => {
  test("test valid return origin", () => {
    expect(
      funs.sanitizeReturnOrigin("https://github.com/some/path?query=1#hash"),
    ).toBe("https://github.com");
    expect(funs.sanitizeReturnOrigin("https://localhost:8080")).toBe(
      "https://localhost:8080",
    );
    expect(
      funs.sanitizeReturnOrigin("https://user:pass@example.com/path"),
    ).toBe("https://example.com");
  });

  test("test for invalid type of input", () => {
    expect(funs.sanitizeReturnOrigin(12345)).toBe("");
  });

  test("test for empty input", () => {
    expect(funs.sanitizeReturnOrigin("")).toBe("");
    expect(funs.sanitizeReturnOrigin()).toBe("");
  });

  test("test for invalid protocol", () => {
    expect(funs.sanitizeReturnOrigin("file:///etc/passwd")).toBe("");
    expect(funs.sanitizeReturnOrigin("data:text/html")).toBe("");
    expect(funs.sanitizeReturnOrigin("javascript:void(0)")).toBe("");
  });
  test("test for any other error", () => {
    expect(funs.sanitizeReturnOrigin("invalid URL strings")).toBe("");
  });
});

describe("getting request origins", () => {
  let req;

  beforeEach(() => {
    req = {
      headers: {
        origin: "https://github.com",
        referer: "https://github.com/kebede/myrepo",
        referrer: "https://github.com/kebede/myrepo",
      },
    };
  });

  test("test returns origin from headers.origin", () => {
    expect(funs.getRequestOrigin(req)).toBe("https://github.com");
  });

  test("falls back to referer when origin is invalid", () => {
    req.headers.origin = "file:///etc/passwd";
    expect(funs.getRequestOrigin(req)).toBe("https://github.com");
  });

  test("test returns origin from referer", () => {
    req.headers.origin = "";
    expect(funs.getRequestOrigin(req)).toBe("https://github.com");
  });

  test("falls back to referrer when referer is invalid", () => {
    req.headers.origin = "";
    req.headers.referer = "hello";

    expect(funs.getRequestOrigin(req)).toBe("https://github.com");
  });

  test("test returns origin from referrer", () => {
    req = {
      headers: {
        referrer: "https://github.com/kebede/myrepo",
      },
    };
    expect(funs.getRequestOrigin(req)).toBe("https://github.com");
  });

  test("test returns empty string if empty headers", () => {
    req = {
      headers: {
        origin: "",
        referer: "",
        referrer: "",
      },
    };

    expect(funs.getRequestOrigin(req)).toBe("");
  });

  test("test returns empty string if no headers at all", () => {
    req = {};

    expect(funs.getRequestOrigin(req)).toBe("");
  });
});

describe("test signup function", () => {
  let User = jest.fn().mockReturnThis();
  let req, res;

  beforeEach(() => {
    req = {
      username: "kebede",
      password: "kebede123",
      displayName: "Kebede",
      email: "kebede@example.com",
      members: ["Abebe", "Alemu"],
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    User.findOne = jest.fn().mockRejectedValue(false);
    user.save = jest.fn().mockResolvedValue();
    ActivityLog.create = jest.fn();
    issueAuthCookies = jest.fn();
    buildUserResponse = jest.fn().mockReturnThis();
  });

  test("user signs up successfully", async () => {
    await signup(req, res);

    expect(isValidPassword).toHaveBeenCalledWith(req.password);
    expect(User.findOne).toHaveBeenCalledWith(req.username);
    expect(user.save).toHaveBeenCalled();
    expect(ActivityLog.create).toHaveBeenCalledWith({
      user_id: 123,
      action: "login",
      detail: "New user registered",
    });
    expect(issueAuthCookies).toHaveBeenCalledWith(res, user, req);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(buildUserResponse).toHaveBeenCalledWith(user);
    expect(res.json).toHaveBeenCalledWith({
      user: user,
      message: "Account created successfully!",
    });
  });
});
