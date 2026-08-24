import crypto from "crypto";
import {
  describe,
  expect,
  jest,
  test,
  beforeEach,
  afterEach,
} from "@jest/globals";

// Set environment variables for consistent tests
process.env.JWT_SECRET = "test-jwt-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
process.env.AUTH_COOKIE_NAME = "auth_token";
process.env.REFRESH_COOKIE_NAME = "refresh_token";
process.env.JWT_EXPIRE = "15m";
process.env.JWT_REFRESH_EXPIRE = "7d";
process.env.REFRESH_COOKIE_MAX_AGE_MS = "604800000";
process.env.NODE_ENV = "test";
process.env.FRONTEND_URL = "https://example.com";

// Mock external modules
await jest.unstable_mockModule("jsonwebtoken", () => {
  const signMock = jest
    .fn()
    .mockReturnValueOnce("mocked-access-token")
    .mockReturnValueOnce("mocked-refresh-token");
  const verifyMock = jest.fn().mockReturnValue({ userId: "123" });
  const decodeMock = jest.fn().mockReturnValue({
    userId: 123,
    exp: Math.floor(Date.now() / 1000) + 3600,
  });

  return {
    default: {
      sign: signMock,
      verify: verifyMock,
      decode: decodeMock,
    },
  };
});

await jest.unstable_mockModule("../../utils/validators.js", () => ({
  isValidPassword: jest.fn().mockReturnValue(true),
}));

await jest.unstable_mockModule("../../models/User.js", () => {
  const MockUser = jest.fn(function (data) {
    Object.assign(this, data);
    this._id = this._id || "123";
    this.save = jest.fn().mockResolvedValue(this);
    this.comparePassword = jest.fn().mockResolvedValue(true);
    return this;
  });

  MockUser.findOne = jest.fn().mockResolvedValue(null);
  MockUser.findById = jest.fn().mockResolvedValue(null);
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
const jwt = (await import("jsonwebtoken")).default;

const funs = await import("../authController.js");
const {
  clearAuthCookie,
  clearRefreshCookie,
  hashToken,
  parseCookies,
  logout,
  refreshToken,
  getMe,
  signup,
  login,
  changePassword,
  createAccessToken,
  createRefreshToken,
  buildUserResponse,
  persistRefreshToken,
  issueAuthCookies,
  sanitizeReturnTo,
  buildRedirectUrl,
  getOAuthConfig,
  getCookieOptions,
  getRefreshCookieOptions,
  setAuthCookie,
  setRefreshCookie,
} = funs;

const makeRefreshTokenRecord = (overrides = {}) => {
  const base = {
    tokenHash: "",
    expiresAt: new Date(Date.now() + 7 * 24 * 3600000),
    createdAt: new Date(),
    revokedAt: null,
    replacedByTokenHash: null,
    userAgent: "",
    ip: "",
    ...overrides,
  };
  base.toObject = () => ({ ...base });
  return base;
};

// Helper to create a response mock
const makeRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
  cookie: jest.fn().mockReturnThis(),
  clearCookie: jest.fn().mockReturnThis(),
  redirect: jest.fn(),
});

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

describe("sanitizeReturnTo", () => {
  test("returns default path for invalid input", () => {
    expect(funs.sanitizeReturnTo("")).toBe("/dashboard");
    expect(funs.sanitizeReturnTo(null)).toBe("/dashboard");
    expect(funs.sanitizeReturnTo(123)).toBe("/dashboard");
    expect(funs.sanitizeReturnTo("//evil.com")).toBe("/dashboard");
    expect(funs.sanitizeReturnTo("https://evil.com")).toBe("/dashboard");
  });

  test("returns valid relative path", () => {
    expect(funs.sanitizeReturnTo("/profile")).toBe("/profile");
    expect(funs.sanitizeReturnTo("/dashboard?tab=settings")).toBe(
      "/dashboard?tab=settings",
    );
  });
});

describe("buildRedirectUrl", () => {
  test("builds full URL with base", () => {
    expect(funs.buildRedirectUrl("/dashboard")).toBe(
      "https://example.com/dashboard",
    );
  });

  test("returns path if no base URL", () => {
    const oldFrontend = process.env.FRONTEND_URL;
    delete process.env.FRONTEND_URL;
    delete process.env.CLIENT_URL;
    expect(funs.buildRedirectUrl("/dashboard")).toBe("/dashboard");
    process.env.FRONTEND_URL = oldFrontend;
  });
});

describe("getOAuthConfig", () => {
  test("returns google config", () => {
    const config = funs.getOAuthConfig("google");
    expect(config).toMatchObject({
      authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      userInfoUrl: "https://www.googleapis.com/oauth2/v3/userinfo",
      scope: "openid email profile",
    });
  });

  test("returns github config", () => {
    const config = funs.getOAuthConfig("github");
    expect(config).toMatchObject({
      authorizeUrl: "https://github.com/login/oauth/authorize",
      tokenUrl: "https://github.com/login/oauth/access_token",
      userInfoUrl: "https://api.github.com/user",
      emailsUrl: "https://api.github.com/user/emails",
      scope: "read:user user:email",
    });
  });

  test("returns null for unsupported provider", () => {
    expect(funs.getOAuthConfig("facebook")).toBeNull();
  });
});

describe("hashToken", () => {
  test("returns sha256 hash", () => {
    const token = "abc123";
    const expected = crypto.createHash("sha256").update(token).digest("hex");
    expect(funs.hashToken(token)).toBe(expected);
  });
});

describe("parseCookies", () => {
  test("parses simple cookie string", () => {
    const cookieHeader = "foo=bar; baz=qux";
    const result = funs.parseCookies(cookieHeader);
    expect(result).toEqual({ foo: "bar", baz: "qux" });
  });

  test("ignores invalid segments", () => {
    const cookieHeader = "foo=bar; invalid; baz=qux";
    const result = funs.parseCookies(cookieHeader);
    expect(result).toEqual({ foo: "bar", baz: "qux" });
  });

  test("decodes URI components", () => {
    const cookieHeader = "name=John%20Doe";
    expect(funs.parseCookies(cookieHeader)).toEqual({ name: "John Doe" });
  });
});

describe("getCookieOptions", () => {
  test("returns httpOnly and secure in production", () => {
    const oldEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const opts = funs.getCookieOptions();
    expect(opts).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
    });
    process.env.NODE_ENV = oldEnv;
  });

  test("returns secure false in development", () => {
    process.env.NODE_ENV = "development";
    const opts = funs.getCookieOptions();
    expect(opts.secure).toBe(false);
    process.env.NODE_ENV = "test";
  });
});

describe("getRefreshCookieOptions", () => {
  test("includes maxAge from env", () => {
    const opts = funs.getRefreshCookieOptions();
    expect(opts.maxAge).toBe(604800000);
  });
});

describe("createAccessToken", () => {
  test("creates token with userId and role", () => {
    const user = { _id: "user1", role: "member" };
    const token = funs.createAccessToken(user);
    expect(jwt.sign).toHaveBeenCalledWith(
      { userId: "user1", role: "member" },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE },
    );
    expect(token).toBe("mocked-access-token");
  });
});

describe("createRefreshToken", () => {
  test("creates refresh token with jti", () => {
    const user = { _id: "user1", role: "member" };
    const result = funs.createRefreshToken(user);
    expect(jwt.sign).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user1",
        role: "member",
        jti: expect.any(String),
      }),
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRE },
    );
    expect(result.token).toBe("mocked-refresh-token");
    expect(result.jti).toBeDefined();
  });
});

describe("buildUserResponse", () => {
  test("builds correct response object", () => {
    const user = {
      _id: "123",
      username: "testuser",
      role: "member",
      displayName: "Test User",
      email: "test@example.com",
      members: [{ name: "Member1" }],
      contactEmail: "contact@example.com",
      profileImageUrl: "img.png",
      coverImageUrl: "",
      headline: "",
      bio: "",
      location: "",
      socialLinks: {},
    };
    const response = funs.buildUserResponse(user);
    expect(response).toEqual({
      id: "123",
      username: "testuser",
      role: "member",
      displayName: "Test User",
      email: "test@example.com",
      members: user.members,
      contactEmail: "contact@example.com",
      profileImageUrl: "img.png",
      coverImageUrl: "",
      headline: "",
      bio: "",
      location: "",
      socialLinks: {},
    });
  });
});

describe("signup", () => {
  let req, res;
  let mockUserInstance;
  let consoleErrorSpy;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    jest.clearAllMocks();
    mockUserInstance = {
      _id: "123",
      username: "kebede",
      password_hash: "hashed123",
      role: "member",
      displayName: "Kebede",
      email: "kebede@example.com",
      members: [{ name: "Abebe" }],
      contactEmail: "kebede@example.com",
      profileImageUrl: "",
      coverImageUrl: "",
      headline: "",
      bio: "",
      location: "",
      socialLinks: {},
      refreshTokens: [],
      save: jest.fn().mockResolvedValue(mockUserInstance),
      comparePassword: jest.fn().mockResolvedValue(true),
      toObject: jest.fn().mockReturnValue(mockUserInstance),
    };

    User.mockImplementation((data) => {
      Object.assign(mockUserInstance, data);
      return mockUserInstance;
    });

    User.findOne.mockResolvedValue(null);
    User.findById.mockResolvedValue(null);
    isValidPassword.mockReturnValue(true);

    req = {
      headers: { "user-agent": "jest-test" },
      ip: "127.0.0.1",
      body: {
        username: "kebede",
        password: "ValidPass123",
        displayName: "Kebede",
        email: "kebede@example.com",
        members: ["Abebe", "Alemu"],
      },
    };

    res = makeRes();
    jwt.sign.mockReset();
    jwt.sign
      .mockReturnValueOnce("mocked-access-token")
      .mockReturnValueOnce("mocked-refresh-token");
    ActivityLog.create.mockResolvedValue(true);
  });
  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });
  test("successful signup", async () => {
    await funs.signup(req, res);

    expect(isValidPassword).toHaveBeenCalledWith("ValidPass123");
    expect(User.findOne).toHaveBeenCalledWith({ username: "kebede" });
    expect(User).toHaveBeenCalledWith({
      username: "kebede",
      password_hash: "ValidPass123",
      role: "member",
      displayName: "Kebede",
      email: "kebede@example.com",
      members: ["Abebe", "Alemu"],
      contactEmail: "kebede@example.com",
    });
    expect(mockUserInstance.save).toHaveBeenCalledTimes(2); // save called in signup and issueAuthCookies
    expect(ActivityLog.create).toHaveBeenCalledWith({
      user_id: "123",
      action: "login",
      detail: "New user registered",
    });
    expect(res.cookie).toHaveBeenCalledWith(
      "auth_token",
      "mocked-access-token",
      expect.objectContaining({ httpOnly: true }),
    );
    expect(res.cookie).toHaveBeenCalledWith(
      "refresh_token",
      "mocked-refresh-token",
      expect.objectContaining({ httpOnly: true, maxAge: expect.any(Number) }),
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      user: expect.objectContaining({
        id: "123",
        username: "kebede",
        role: "member",
        displayName: "Kebede",
        email: "kebede@example.com",
        members: ["Abebe", "Alemu"],
      }),
      message: "Account created successfully!",
    });
  });

  test("missing username or password", async () => {
    req.body = { username: "", password: "Pass123" };
    await funs.signup(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Username and password are required",
    });
  });

  test("invalid password", async () => {
    isValidPassword.mockReturnValue(false);
    await funs.signup(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message:
        "Password must be at least 8 characters and contain both letters and numbers",
    });
  });

  test("username already exists", async () => {
    User.findOne.mockResolvedValue({ _id: "999", username: "kebede" });
    await funs.signup(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Username already exists",
    });
  });

  test("database error during save", async () => {
    mockUserInstance.save.mockRejectedValueOnce(new Error("DB error"));
    await funs.signup(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Server error during signup",
    });
  });
});

describe("login", () => {
  let req, res;
  let mockUserInstance;
  let consoleErrorSpy;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    jest.clearAllMocks();
    mockUserInstance = {
      _id: "123",
      username: "kebede",
      password_hash: "hashed123",
      role: "member",
      displayName: "Kebede",
      email: "kebede@example.com",
      members: [{ name: "Abebe" }],
      contactEmail: "kebede@example.com",
      profileImageUrl: "",
      coverImageUrl: "",
      headline: "",
      bio: "",
      location: "",
      socialLinks: {},
      refreshTokens: [],
      save: jest.fn().mockResolvedValue(mockUserInstance),
      comparePassword: jest.fn().mockResolvedValue(true),
      toObject: jest.fn().mockReturnValue(mockUserInstance),
    };

    User.findOne.mockResolvedValue(mockUserInstance);
    User.findById.mockResolvedValue(mockUserInstance);

    req = {
      headers: { "user-agent": "jest-test" },
      ip: "127.0.0.1",
      body: { username: "kebede", password: "ValidPass123" },
    };
    res = makeRes();
    jwt.sign.mockReset();
    jwt.sign
      .mockReturnValueOnce("mocked-access-token")
      .mockReturnValueOnce("mocked-refresh-token");
    ActivityLog.create.mockResolvedValue(true);
  });
  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("successful login", async () => {
    await funs.login(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ username: "kebede" });
    expect(mockUserInstance.comparePassword).toHaveBeenCalledWith(
      "ValidPass123",
    );
    expect(mockUserInstance.save).toHaveBeenCalledTimes(1);
    expect(ActivityLog.create).toHaveBeenCalledWith({
      user_id: "123",
      action: "login",
      detail: "Successful login",
    });
    expect(res.cookie).toHaveBeenCalledWith(
      "auth_token",
      "mocked-access-token",
      expect.objectContaining({ httpOnly: true }),
    );
    expect(res.json).toHaveBeenCalledWith({
      user: expect.objectContaining({ id: "123", username: "kebede" }),
    });
  });

  test("missing username or password", async () => {
    req.body = { username: "", password: "Pass123" };
    await funs.login(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Username and password are required",
    });
  });

  test("user not found", async () => {
    User.findOne.mockResolvedValue(null);
    await funs.login(req, res);
    expect(ActivityLog.create).toHaveBeenCalledWith({
      action: "failed_login",
      detail: "Failed login attempt",
    });
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid credentials" });
  });

  test("invalid password", async () => {
    mockUserInstance.comparePassword.mockResolvedValue(false);
    await funs.login(req, res);
    expect(ActivityLog.create).toHaveBeenCalledWith({
      user_id: "123",
      action: "failed_login",
      detail: "Invalid password",
    });
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid credentials" });
  });

  test("database error during findOne", async () => {
    User.findOne.mockRejectedValue(new Error("DB error"));
    await funs.login(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Server error during login",
      error: undefined,
    });
  });
});

describe("changePassword", () => {
  let req, res, mockUserInstance;
  let consoleErrorSpy;
  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    jest.clearAllMocks();
    mockUserInstance = {
      _id: "123",
      username: "kebede",
      password_hash: "oldhash",
      role: "member",
      save: jest.fn().mockResolvedValue(mockUserInstance),
      comparePassword: jest.fn().mockResolvedValue(true),
      refreshTokens: [],
    };
    User.findById.mockResolvedValue(mockUserInstance);
    req = {
      user: { _id: "123" },
      body: { currentPassword: "oldpass", newPassword: "NewPass123" },
      headers: { "user-agent": "jest" },
      ip: "127.0.0.1",
    };
    res = makeRes();
    isValidPassword.mockReturnValue(true);
  });
  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("successful password change", async () => {
    await funs.changePassword(req, res);
    expect(mockUserInstance.comparePassword).toHaveBeenCalledWith("oldpass");
    expect(mockUserInstance.save).toHaveBeenCalledTimes(2);
    expect(res.json).toHaveBeenCalledWith({
      message: "Password changed successfully",
    });
  });

  test("user not found", async () => {
    User.findById.mockResolvedValue(null);
    await funs.changePassword(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
  });

  test("missing current or new password", async () => {
    req.body = { currentPassword: "", newPassword: "" };
    await funs.changePassword(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Current and new passwords are required",
    });
  });

  test("incorrect current password", async () => {
    mockUserInstance.comparePassword.mockResolvedValue(false);
    await funs.changePassword(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Current password is incorrect",
    });
  });

  test("invalid new password", async () => {
    isValidPassword.mockReturnValue(false);
    await funs.changePassword(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message:
        "Password must be at least 8 characters and contain both letters and numbers",
    });
  });

  test("database error", async () => {
    mockUserInstance.save.mockRejectedValueOnce(new Error("DB error"));
    await funs.changePassword(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Server error" });
  });
});

describe("getMe", () => {
  let req, res, mockUser;
  let consoleErrorSpy;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    jest.clearAllMocks();
    mockUser = {
      _id: "123",
      username: "kebede",
      role: "member",
      displayName: "Kebede",
      email: "kebede@example.com",
      password_hash: "hashed",
      members: [],
      contactEmail: "kebede@example.com",
      profileImageUrl: "",
      coverImageUrl: "",
      headline: "",
      bio: "",
      location: "",
      socialLinks: {},
    };
    req = { user: { _id: "123" } };
    res = makeRes();
    jwt.sign.mockReset();
    jwt.sign
      .mockReturnValueOnce("mocked-access-token")
      .mockReturnValueOnce("mocked-refresh-token");
  });
  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });
  test("returns user data", async () => {
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser),
    });
    await funs.getMe(req, res);
    expect(res.json).toHaveBeenCalledWith({
      user: expect.objectContaining({ id: "123" }),
    });
  });

  test("user not found returns 401", async () => {
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });
    await funs.getMe(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
  });

  test("database error returns 500", async () => {
    User.findById.mockReturnValue({
      select: jest.fn().mockRejectedValue(new Error("DB error")),
    });
    await funs.getMe(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Server error" });
  });
});

describe("tests for logout", () => {
  let res, req;
  let mockUserInstance;
  let refreshTokenValue;
  let expectedTokenHash;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    refreshTokenValue = "mocked-refresh-token";
    expectedTokenHash = hashToken(refreshTokenValue);

    jwt.decode.mockReturnValue({ userId: 123 });

    mockUserInstance = {
      _id: 123,
      refreshTokens: [makeRefreshTokenRecord({ tokenHash: expectedTokenHash })],
      save: jest.fn().mockResolvedValue(null),
    };

    User.findById.mockResolvedValue(mockUserInstance);

    req = {
      headers: {
        cookie: `refresh_token=${refreshTokenValue}; auth_token=old-access-token`,
      },
      ip: "127.0.0.1",
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
    };
  });
  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("Succesfully logs out", async () => {
    await funs.logout(req, res);

    expect(jwt.decode).toHaveBeenCalledWith(refreshTokenValue);
    expect(User.findById).toHaveBeenCalledWith(123);
    expect(mockUserInstance.save).toHaveBeenCalledTimes(1);

    const revokedToken = mockUserInstance.refreshTokens.find(
      (token) => token.tokenHash === expectedTokenHash,
    );
    expect(revokedToken.revokedAt).toBeInstanceOf(Date);

    expect(res.clearCookie).toHaveBeenCalledWith(
      "auth_token",
      expect.objectContaining({ httpOnly: true }),
    );
    expect(res.clearCookie).toHaveBeenCalledWith(
      "refresh_token",
      expect.objectContaining({ httpOnly: true }),
    );
    expect(res.json).toHaveBeenLastCalledWith({
      message: "Logged out successfully",
    });
  });
  test("does nothing if no refresh token cookie", async () => {
    req.headers.cookie = "auth_token=old-access-token";
    await funs.logout(req, res);

    expect(jwt.decode).not.toHaveBeenCalled();
    expect(User.findById).not.toHaveBeenCalled();
    expect(res.clearCookie).toHaveBeenCalledWith(
      "auth_token",
      expect.objectContaining({ httpOnly: true }),
    );
    expect(res.clearCookie).toHaveBeenCalledWith(
      "refresh_token",
      expect.objectContaining({ httpOnly: true }),
    );
    expect(res.json).toHaveBeenCalledWith({
      message: "Logged out successfully",
    });
  });

  test("handles invalid refresh token (decode returns null)", async () => {
    jwt.decode.mockReturnValue(null);
    await funs.logout(req, res);

    expect(jwt.decode).toHaveBeenCalledWith(refreshTokenValue);
    expect(User.findById).not.toHaveBeenCalled();
    expect(res.clearCookie).toHaveBeenCalledTimes(2);
    expect(res.json).toHaveBeenCalledWith({
      message: "Logged out successfully",
    });
  });

  test("handles user not found", async () => {
    User.findById.mockResolvedValue(null);
    await funs.logout(req, res);

    expect(User.findById).toHaveBeenCalledWith(123);
    // No save should happen
    expect(mockUserInstance.save).not.toHaveBeenCalled();
    expect(res.clearCookie).toHaveBeenCalledTimes(2);
    expect(res.json).toHaveBeenCalledWith({
      message: "Logged out successfully",
    });
  });

  test("handles user without refreshTokens array", async () => {
    mockUserInstance.refreshTokens = null;
    User.findById.mockResolvedValue(mockUserInstance);
    await funs.logout(req, res);

    expect(mockUserInstance.save).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      message: "Logged out successfully",
    });
  });

  test("token hash not found in user's refreshTokens", async () => {
    mockUserInstance.refreshTokens = [
      makeRefreshTokenRecord({ tokenHash: "some-other-hash" }),
    ];
    User.findById.mockResolvedValue(mockUserInstance);
    await funs.logout(req, res);

    expect(mockUserInstance.save).toHaveBeenCalledTimes(1); // save still called, but no revocation
    expect(mockUserInstance.refreshTokens[0].revokedAt).toBeNull();
    expect(res.json).toHaveBeenCalledWith({
      message: "Logged out successfully",
    });
  });

  test("save failure still logs out", async () => {
    mockUserInstance.save.mockRejectedValue(new Error("DB error"));
    await funs.logout(req, res);

    // Console error should be called, but response still success
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(res.clearCookie).toHaveBeenCalledTimes(2);
    expect(res.json).toHaveBeenCalledWith({
      message: "Logged out successfully",
    });
  });

  test("revokes only the matching token when multiple tokens exist", async () => {
    const otherToken = makeRefreshTokenRecord({ tokenHash: "other-hash" });
    const matchingToken = makeRefreshTokenRecord({
      tokenHash: expectedTokenHash,
    });
    mockUserInstance.refreshTokens = [otherToken, matchingToken];
    User.findById.mockResolvedValue(mockUserInstance);

    await funs.logout(req, res);

    const revoked = mockUserInstance.refreshTokens.find(
      (t) => t.tokenHash === expectedTokenHash,
    );
    expect(revoked.revokedAt).toBeInstanceOf(Date);

    expect(
      mockUserInstance.refreshTokens.find((t) => t.tokenHash === "other-hash")
        .revokedAt,
    ).toBeNull();
  });
});

describe("tests for refreshToken", () => {
  let req, res;
  let mockUserInstance;
  let refreshTokenValue;
  let expectedTokenHash;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jwt.sign.mockReset();

    refreshTokenValue = "mocked-refresh-token";
    expectedTokenHash = hashToken(refreshTokenValue);

    // Default successful token record (non-revoked, not expired)
    const tokenRecord = makeRefreshTokenRecord({
      tokenHash: expectedTokenHash,
      expiresAt: new Date(Date.now() + 3600000),
    });

    mockUserInstance = {
      _id: "123",
      refreshTokens: [tokenRecord],
      save: jest.fn().mockResolvedValue(mockUserInstance),
      toObject: function () {
        return this;
      },
    };

    // Default mocks: token is valid, user found, record exists
    jwt.verify.mockReturnValue({ userId: "123" });
    jwt.decode.mockReturnValue({
      userId: "123",
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    User.findById.mockResolvedValue(mockUserInstance);

    req = {
      headers: {
        cookie: `refresh_token=${refreshTokenValue}`,
        "user-agent": "jest-test",
      },
      ip: "127.0.0.1",
    };

    res = makeRes();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("successful token rotation", async () => {
    jwt.sign
      .mockReturnValueOnce("new-access-token")
      .mockReturnValueOnce("new-refresh-token");

    await funs.refreshToken(req, res);

    const newToken = mockUserInstance.refreshTokens.find(
      (t) => t.tokenHash === hashToken("new-refresh-token"),
    );
    expect(newToken).toBeDefined();
    expect(newToken.expiresAt).toBeInstanceOf(Date);
    expect(mockUserInstance.refreshTokens.length).toBe(1);

    // Cookies set
    expect(res.cookie).toHaveBeenCalledWith(
      "auth_token",
      "new-access-token",
      expect.objectContaining({ httpOnly: true }),
    );
    expect(res.cookie).toHaveBeenCalledWith(
      "refresh_token",
      "new-refresh-token",
      expect.objectContaining({ httpOnly: true }),
    );

    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  test("no refresh token cookie", async () => {
    req.headers.cookie = "";
    await funs.refreshToken(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
    expect(res.clearCookie).toHaveBeenCalled(); // ensure cookies cleared
  });

  test("invalid refresh token (jwt.verify throws)", async () => {
    jwt.verify.mockImplementation(() => {
      throw new Error("invalid token");
    });

    await funs.refreshToken(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
    expect(res.clearCookie).toHaveBeenCalledTimes(2);
  });

  test("user not found", async () => {
    User.findById.mockResolvedValue(null);

    await funs.refreshToken(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
    expect(res.clearCookie).toHaveBeenCalledTimes(2);
  });

  test("refresh token record not found", async () => {
    mockUserInstance.refreshTokens = [
      makeRefreshTokenRecord({ tokenHash: "other-hash" }),
    ];
    User.findById.mockResolvedValue(mockUserInstance);

    await funs.refreshToken(req, res);

    expect(mockUserInstance.save).toHaveBeenCalledTimes(1); // resets tokens
    expect(mockUserInstance.refreshTokens).toEqual([]);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
    expect(res.clearCookie).toHaveBeenCalledTimes(2);
  });

  test("refresh token already revoked", async () => {
    mockUserInstance.refreshTokens = [
      makeRefreshTokenRecord({
        tokenHash: expectedTokenHash,
        revokedAt: new Date(),
      }),
    ];
    User.findById.mockResolvedValue(mockUserInstance);

    await funs.refreshToken(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
    expect(res.clearCookie).toHaveBeenCalledTimes(2);
  });

  test("refresh token expired", async () => {
    mockUserInstance.refreshTokens = [
      makeRefreshTokenRecord({
        tokenHash: expectedTokenHash,
        expiresAt: new Date(Date.now() - 1000), // in the past
      }),
    ];
    User.findById.mockResolvedValue(mockUserInstance);

    await funs.refreshToken(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
    expect(res.clearCookie).toHaveBeenCalledTimes(2);
  });

  test("save failure on rotation", async () => {
    jwt.sign
      .mockReturnValueOnce("new-access-token")
      .mockReturnValueOnce("new-refresh-token");
    mockUserInstance.save.mockRejectedValue(new Error("DB error"));

    await funs.refreshToken(req, res);

    // Should catch error, clear cookies, and return 401
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
    expect(res.clearCookie).toHaveBeenCalledTimes(2);
  });

  test("user.refreshTokens is undefined (treated as empty)", async () => {
    mockUserInstance.refreshTokens = undefined;
    User.findById.mockResolvedValue(mockUserInstance);

    await funs.refreshToken(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
    expect(res.clearCookie).toHaveBeenCalledTimes(2);
  });
});
