process.env.JWT_SECRET = "test-jwt-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
process.env.AUTH_COOKIE_NAME = "auth_token";
process.env.REFRESH_COOKIE_NAME = "refresh_token";

import { describe, expect, jest, test, beforeEach } from "@jest/globals";

jest.setTimeout(15000);
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
} = funs;

const makeRefreshTokenRecord = (overrides = {}) => {
  const base = {
    tokenHash: "",
    expiresAt: new Date(Date.now() + 7 * 24 * 3600000),
    createdAt: new Date(),
    revokedAt: null,
    replacedByTokenHash: null,
    ...overrides,
  };
  base.toObject = () => ({ ...base });
  return base;
};

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

// describe("test signup function", () => {
//   let req, res;
//   let mockUserInstance;

//   beforeEach(() => {
//     jest.clearAllMocks();

//     User.mockImplementation((data) => {
//       const instance = {
//         _id: 123,
//         username: data.username || "kebede",
//         password_hash: data.password_hash || "hashed123",
//         role: data.role || "member",
//         displayName: data.displayName || "Kebede",
//         email: data.email || "kebede@example.com",
//         members: data.members || [],
//         contactEmail: data.contactEmail || "kebede@example.com",
//         profileImageUrl: "",
//         coverImageUrl: "",
//         headline: "",
//         bio: "",
//         location: "",
//         socialLinks: {},
//         refreshTokens: [],
//         save: jest.fn().mockResolvedValue(instance),
//         comparePassword: jest.fn().mockResolvedValue(true),
//         toObject: jest.fn().mockReturnValue(instance),
//       };
//       mockUserInstance = instance;
//       return instance;
//     });

//     User.findOne.mockResolvedValue(null);
//     User.findById.mockResolvedValue(null);

//     isValidPassword.mockReturnValue(true);

//     req = {
//       headers: { "user-agent": "jest-test" },
//       body: {
//         username: "kebede",
//         password: "ValidPass123",
//         displayName: "Kebede",
//         email: "kebede@example.com",
//         members: ["Abebe", "Alemu"],
//       },
//     };

//     res = {
//       status: jest.fn().mockReturnThis(),
//       json: jest.fn(),
//       cookie: jest.fn().mockReturnThis(),
//       clearCookie: jest.fn().mockReturnThis(),
//     };

//     ActivityLog.create = jest.fn().mockResolvedValue(true);

//     process.env.JWT_SECRET = "test-jwt-secret";
//     process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
//     process.env.AUTH_COOKIE_NAME = "auth_token";
//     process.env.REFRESH_COOKIE_NAME = "refresh_token";
//   });

//   test("user signs up successfully", async () => {
//     await funs.signup(req, res);

//     expect(isValidPassword).toHaveBeenCalledWith(req.body.password);

//     expect(User.findOne).toHaveBeenCalledWith({ username: req.body.username });

//     expect(User).toHaveBeenCalledWith({
//       username: req.body.username,
//       password_hash: req.body.password,
//       role: "member",
//       displayName: req.body.displayName,
//       email: req.body.email,
//       members: req.body.members,
//       contactEmail: req.body.email,
//     });

//     expect(mockUserInstance.save).toHaveBeenCalledTimes(2);

//     expect(jwt.sign).toHaveBeenCalledWith(
//       { userId: 123, role: "member" },
//       process.env.JWT_SECRET,
//       { expiresIn: expect.any(String) },
//     );

//     expect(jwt.sign).toHaveBeenCalledWith(
//       expect.objectContaining({
//         userId: 123,
//         role: "member",
//         jti: expect.any(String),
//       }),
//       process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
//       { expiresIn: expect.any(String) },
//     );

//     expect(res.cookie).toHaveBeenCalledWith(
//       "auth_token",
//       "mocked-access-token",
//       expect.objectContaining({ httpOnly: true }),
//     );
//     expect(res.cookie).toHaveBeenCalledWith(
//       "refresh_token",
//       "mocked-refresh-token",
//       expect.objectContaining({ httpOnly: true, maxAge: expect.any(Number) }),
//     );

//     expect(ActivityLog.create).toHaveBeenCalledWith({
//       user_id: 123,
//       action: "login",
//       detail: "New user registered",
//     });

//     expect(res.status).toHaveBeenCalledWith(201);
//     expect(res.json).toHaveBeenCalledWith({
//       user: expect.objectContaining({
//         id: 123,
//         username: "kebede",
//         role: "member",
//         displayName: "Kebede",
//         email: "kebede@example.com",
//         members: ["Abebe", "Alemu"],
//       }),
//       message: "Account created successfully!",
//     });
//   });

//   test("username not found (empty username)", async () => {
//     req.body.username = "";
//     await funs.signup(req, res);

//     expect(res.status).toHaveBeenCalledWith(400);
//     expect(res.json).toHaveBeenCalledWith({
//       message: "Username and password are required",
//     });
//   });

//   test("password not found (empty password)", async () => {
//     req.body.password = "";
//     await funs.signup(req, res);

//     expect(res.status).toHaveBeenCalledWith(400);
//     expect(res.json).toHaveBeenCalledWith({
//       message: "Username and password are required",
//     });
//   });

//   test("invalid password", async () => {
//     isValidPassword.mockReturnValue(false);

//     await funs.signup(req, res);

//     expect(isValidPassword).toHaveBeenCalledWith(req.body.password);
//     expect(res.status).toHaveBeenCalledWith(400);
//     expect(res.json).toHaveBeenCalledWith({
//       message:
//         "Password must be at least 8 characters and contain both letters and numbers",
//     });
//   });

//   test("user already exists", async () => {
//     User.findOne.mockResolvedValue({ _id: 999, username: "kebede" });

//     await funs.signup(req, res);

//     expect(isValidPassword).toHaveBeenCalledWith(req.body.password);
//     expect(res.status).toHaveBeenCalledWith(400);
//     expect(res.json).toHaveBeenCalledWith({
//       message: "Username already exists",
//     });
//   });
//   test("server error during signup in database saving error", async () => {
//     mockUserInstance.save = jest
//       .fn()
//       .mockRejectedValue(new Error("Database error"));
//     await funs.signup(req, res);
//     expect(res.status).toHaveBeenCalledWith(500);
//     expect(res.json).toHaveBeenCalledWith({
//       message: "An error occurred while creating the account",
//     });
//   });
// });

// describe("tests for login", () => {
//   let req, res;
//   let mockUserInstance;

//   beforeEach(() => {
//     jest.clearAllMocks();

//     mockUserInstance = {
//       _id: 123,
//       username: "kebede",
//       password_hash: "hashed123",
//       role: "member",
//       displayName: "Kebede",
//       email: "kebede@example.com",
//       members: ["Abebe", "Alemu"],
//       contactEmail: "kebede@example.com",
//       profileImageUrl: "",
//       coverImageUrl: "",
//       headline: "",
//       bio: "",
//       location: "",
//       socialLinks: {},
//       refreshTokens: [],
//       save: jest.fn().mockResolvedValue(mockUserInstance),
//       comparePassword: jest.fn().mockResolvedValue(true),
//       toObject: jest.fn().mockReturnValue(mockUserInstance),
//     };

//     User.findOne.mockResolvedValue(mockUserInstance);
//     User.findById.mockResolvedValue(mockUserInstance);

//     jwt.sign
//       .mockReturnValueOnce("mocked-access-token")
//       .mockReturnValueOnce("mocked-refresh-token");
//     req = {
//       headers: { "user-agent": "jest-test" },

//       body: {
//         username: "kebede",
//         password: "ValidPass123",
//       },
//     };

//     res = {
//       status: jest.fn().mockReturnThis(),
//       json: jest.fn(),
//       cookie: jest.fn().mockReturnThis(),
//       clearCookie: jest.fn().mockReturnThis(),
//     };

//     ActivityLog.create = jest.fn().mockResolvedValue(true);
//     process.env.JWT_SECRET = "test-jwt-secret";
//     process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
//     process.env.AUTH_COOKIE_NAME = "auth_token";
//     process.env.REFRESH_COOKIE_NAME = "refresh_token";
//   });

//   test("user signs in successfully", async () => {
//     await funs.login(req, res);

//     expect(User.findOne).toHaveBeenCalledWith({ username: req.body.username });
//     expect(mockUserInstance.comparePassword).toHaveBeenCalledWith(
//       req.body.password,
//     );

//     expect(mockUserInstance.save).toHaveBeenCalledTimes(1);

//     expect(jwt.sign).toHaveBeenCalledWith(
//       { userId: 123, role: "member" },
//       process.env.JWT_SECRET,
//       { expiresIn: expect.any(String) },
//     );

//     expect(jwt.sign).toHaveBeenCalledWith(
//       expect.objectContaining({
//         userId: 123,
//         role: "member",
//         jti: expect.any(String),
//       }),
//       process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
//       { expiresIn: expect.any(String) },
//     );

//     expect(res.cookie).toHaveBeenCalledWith(
//       "auth_token",
//       "mocked-access-token",
//       expect.objectContaining({ httpOnly: true }),
//     );
//     expect(res.cookie).toHaveBeenCalledWith(
//       "refresh_token",
//       "mocked-refresh-token",
//       expect.objectContaining({ httpOnly: true, maxAge: expect.any(Number) }),
//     );

//     expect(ActivityLog.create).toHaveBeenCalledWith({
//       user_id: 123,
//       action: "login",
//       detail: "Successful login",
//     });

//     expect(res.json).toHaveBeenCalledWith({
//       user: expect.objectContaining({
//         id: 123,
//         username: "kebede",
//         role: "member",
//         displayName: "Kebede",
//         email: "kebede@example.com",
//         members: ["Abebe", "Alemu"],
//       }),
//     });
//   });

//   test("username not entered", async () => {
//     req.body.username = "";
//     await funs.login(req, res);

//     expect(res.status).toHaveBeenCalledWith(400);
//     expect(res.json).toHaveBeenCalledWith({
//       message: "Username and password are required",
//     });
//   });

//   test("password not entered", async () => {
//     req.body.password = "";
//     await funs.login(req, res);

//     expect(res.status).toHaveBeenCalledWith(400);
//     expect(res.json).toHaveBeenCalledWith({
//       message: "Username and password are required",
//     });
//   });

//   test("username not found in db", async () => {
//     User.findOne.mockResolvedValue(null);

//     await funs.login(req, res);

//     expect(ActivityLog.create).toHaveBeenCalledWith({
//       action: "failed_login",
//       detail: "Failed login attempt",
//     });
//     expect(res.status).toHaveBeenCalledWith(401);
//     expect(res.json).toHaveBeenCalledWith({ message: "Invalid credentials" });
//   });

//   test("Invalid password", async () => {
//     mockUserInstance.comparePassword.mockResolvedValue(false);

//     await funs.login(req, res);

//     expect(ActivityLog.create).toHaveBeenCalledWith({
//       user_id: 123,
//       action: "failed_login",
//       detail: "Invalid password",
//     });
//     expect(res.status).toHaveBeenCalledWith(401);
//     expect(res.json).toHaveBeenCalledWith({ message: "Invalid credentials" });
// });
// });

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
});
