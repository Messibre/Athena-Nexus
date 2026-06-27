import jwt from "jsonwebtoken";
import crypto from "crypto";
import { describe, expect, jest } from "@jest/globals";

await jest.unstable_mockModule("../../utils/validators.js", () => ({
  isValidPassword: jest.fn().mockReturnValue(true),
}));
await jest.unstable_mockModule("../../models/User.js", () => {
  const MockUser = jest.fn(function (data) {
    Object.assign(this, data);
    this._id = this._id || "id123";
    this.save = this.save || jest.fn().mockResolvedValue(this);
    this.comparePassword =
      this.comparePassword || jest.fn().mockResolvedValue(true);
    return this;
  });
  MockUser.findOne = jest.fn().mockResolvedValue(null);
  return { default: MockUser };
});
await jest.unstable_mockModule("../../models/ActivityLog.js", () => ({
  default: {
    create: jest.fn().mockResolvedValue(true),
  },
}));

const { default: User } = await import("../../models/User.js");
const { default: ActivityLog } = await import("../../models/ActivityLog.js");
const { isValidPassword } = await import("../../utils/validators.js");

const funs = await import("../authController.js");

let user;
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
user = {
  _id: "123",
  username: "kebede",
  password: "kebede123",
  save: jest.fn().mockResolvedValue(this),
  comparePassword: jest.fn().mockResolvedValue(true),
};

describe("test signup function", () => {
  let req, res;

  beforeEach(() => {
    isValidPassword.mockReturnValue(true);
    user = {
      _id: 123,
      username: "kebede",
      password_hash: "kebede123",
      role: "member",
      displayName: "Kebede",
      email: "kebede@example.com",
      members: ["Abebe", "Alemu"],
      contactEmail: "kebede@example.com",
      profileImageUrl: "",
      coverImageUrl: "",
      headline: "",
      bio: "",
      location: "",
      socialLinks: {},
    };
    user.save = jest.fn().mockResolvedValue(user);
    user.comparePassword = jest.fn().mockResolvedValue(true);
    User.mockImplementation((data) => Object.assign(user, data));
    User.findOne.mockResolvedValue(null);
    req = {
      headers: {
        "user-agent": "jest",
      },
      ip: "127.0.0.1",
      body: {
        username: "kebede",
        password: "kebede123",
        displayName: "Kebede",
        email: "kebede@example.com",
        members: ["Abebe", "Alemu"],
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn().mockReturnThis(),
    };
    ActivityLog.create = jest.fn().mockResolvedValue(true);
    process.env.JWT_SECRET = "test-jwt-secret";
    process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
  });

  test("user signs up successfully", async () => {
    await funs.signup(req, res);

    expect(isValidPassword).toHaveBeenCalledWith(req.body.password);
    expect(User.findOne).toHaveBeenCalledWith({ username: req.body.username });
    expect(user.save).toHaveBeenCalled();
    expect(ActivityLog.create).toHaveBeenCalledWith({
      user_id: 123,
      action: "login",
      detail: "New user registered",
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      user: {
        id: 123,
        username: "kebede",
        role: "member",
        displayName: "Kebede",
        email: "kebede@example.com",
        members: ["Abebe", "Alemu"],
        contactEmail: "kebede@example.com",
        profileImageUrl: "",
        coverImageUrl: "",
        headline: "",
        bio: "",
        location: "",
        socialLinks: {},
      },
      message: "Account created successfully!",
    });
  });

  test("username not found", async () => {
    req.body.username = "";

    await funs.signup(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Username and password are required",
    });
  });
  test("username not found", async () => {
    req.body.password = "";

    await funs.signup(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Username and password are required",
    });
  });

  test("invalid password", async () => {
    isValidPassword.mockReturnValue(false);

    await funs.signup(req, res);

    expect(isValidPassword).toHaveBeenCalledWith(req.body.password);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message:
        "Password must be at least 8 characters and contain both letters and numbers",
    });
  });

  test("user already exists", async () => {
    User.findOne.mockResolvedValue({ _id: 999 });

    await funs.signup(req, res);

    expect(isValidPassword).toHaveBeenCalledWith(req.body.password);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Username already exists",
    });
  });
});

describe("tests for login", () => {
  let req, res;

  beforeEach(() => {
    isValidPassword.mockReturnValue(true);
    user = {
      _id: 123,
      username: "kebede",
      password_hash: "kebede123",
      role: "member",
      displayName: "Kebede",
      email: "kebede@example.com",
      members: ["Abebe", "Alemu"],
      contactEmail: "kebede@example.com",
      profileImageUrl: "",
      coverImageUrl: "",
      headline: "",
      bio: "",
      location: "",
      socialLinks: {},
    };
    user.save = jest.fn().mockResolvedValue(user);
    user.comparePassword = jest.fn().mockResolvedValue(true);
    User.findOne.mockResolvedValue(user);
    req = {
      headers: {
        "user-agent": "jest",
      },
      ip: "127.0.0.1",
      body: {
        username: "kebede",
        password: "kebede123",
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn().mockReturnThis(),
    };
    ActivityLog.create = jest.fn().mockResolvedValue(true);
    process.env.JWT_SECRET = "test-jwt-secret";
    process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
  });

  test("user signs in successfully", async () => {
    await funs.login(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ username: req.body.username });
    expect(user.comparePassword).toHaveBeenCalledWith(req.body.password);
    expect(ActivityLog.create).toHaveBeenCalledWith({
      user_id: 123,
      action: "login",
      detail: "Successful login",
    });
    expect(res.json).toHaveBeenCalledWith({
      user: {
        id: 123,
        username: "kebede",
        role: "member",
        displayName: "Kebede",
        email: "kebede@example.com",
        members: ["Abebe", "Alemu"],
        contactEmail: "kebede@example.com",
        profileImageUrl: "",
        coverImageUrl: "",
        headline: "",
        bio: "",
        location: "",
        socialLinks: {},
      },
    });
  });

  test("username not entered", async () => {
    req.body.username = "";

    await funs.login(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Username and password are required",
    });
  });
  test("no password entered", async () => {
    req.body.password = "";

    await funs.login(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Username and password are required",
    });
  });

  test("username not found in db", async () => {
    User.findOne.mockResolvedValue(null);

    await funs.login(req, res);

    expect(ActivityLog.create).toHaveBeenCalledWith({
      action: "failed_login",
      detail: "Failed login attempt",
    });
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid credentials" });
  });

  test("Invalid password", async () => {
    user.comparePassword = jest.fn().mockResolvedValue(false);

    await funs.login(req, res);

    expect(ActivityLog.create).toHaveBeenCalledWith({
      user_id: user._id,
      action: "failed_login",
      detail: "Invalid password",
    });
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid credentials" });
  });
});
