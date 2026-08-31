import {
  describe,
  expect,
  jest,
  test,
  beforeEach,
  afterEach,
} from "@jest/globals";

await jest.unstable_mockModule("jsonwebtoken", () => ({
  default: {
    verify: jest.fn(),
  },
}));

await jest.unstable_mockModule("../../models/User.js", () => ({
  default: {
    findById: jest.fn(),
  },
}));

const { default: jwt } = await import("jsonwebtoken");
const { default: User } = await import("../../models/User.js");
const { getTokenFromRequest, verifyToken, isAdmin } =
  await import("../auth.js");

const makeRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

const makeReq = (overrides = {}) => ({
  headers: {},
  cookies: {},
  ...overrides,
});

describe("getTokenFromRequest", () => {
  test("returns token from Authorization header (Bearer)", () => {
    const req = makeReq({
      headers: { authorization: "Bearer abc123" },
    });
    expect(getTokenFromRequest(req)).toBe("abc123");
  });

  test("returns token from cookies when no Authorization header", () => {
    process.env.AUTH_COOKIE_NAME = "auth_token";
    const req = makeReq({
      headers: { cookie: "auth_token=cookie-token; other=value" },
    });
    expect(getTokenFromRequest(req)).toBe("cookie-token");
  });

  test("returns null when no token present", () => {
    const req = makeReq();
    expect(getTokenFromRequest(req)).toBeNull();
  });
});

describe("verifyToken", () => {
  let req, res, next;

  beforeEach(() => {
    req = makeReq();
    res = makeRes();
    next = jest.fn();
    jwt.verify.mockReset();
    User.findById.mockReset();
  });

  test("calls next() when token is valid and user exists", async () => {
    const token = "valid-token";
    req.headers.authorization = `Bearer ${token}`;
    jwt.verify.mockReturnValue({ userId: "user123" });
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: "user123", role: "member" }),
    });

    await verifyToken(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET);
    expect(User.findById).toHaveBeenCalledWith("user123");
    expect(req.user).toEqual({ _id: "user123", role: "member" });
    expect(next).toHaveBeenCalledTimes(1);
  });

  test("returns 401 when no token", async () => {
    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
    expect(next).not.toHaveBeenCalled();
  });

  test("returns 401 when jwt.verify throws", async () => {
    req.headers.authorization = "Bearer invalid-token";
    jwt.verify.mockImplementation(() => {
      throw new Error("Invalid token");
    });

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
    expect(next).not.toHaveBeenCalled();
  });

  test("returns 401 when user not found", async () => {
    req.headers.authorization = "Bearer valid-token";
    jwt.verify.mockReturnValue({ userId: "nonexistent" });
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
    expect(next).not.toHaveBeenCalled();
  });
});

describe("isAdmin", () => {
  let req, res, next;

  beforeEach(() => {
    res = makeRes();
    next = jest.fn();
  });

  test("calls next() if user is admin", () => {
    req = { user: { role: "admin" } };
    isAdmin(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  test("returns 403 if user is not admin", () => {
    req = { user: { role: "member" } };
    isAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "Access denied. Admin only.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("returns 403 if no user attached", () => {
    req = {};
    isAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
