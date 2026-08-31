import { describe, expect, jest, test, beforeEach } from "@jest/globals";

await jest.unstable_mockModule("express-rate-limit", () => {
  const rateLimit = jest.fn((options) => {
    const middleware = (req, res, next) => next();
    middleware.options = options;
    return middleware;
  });
  return { default: rateLimit };
});

await jest.unstable_mockModule("../../models/ActivityLog.js", () => ({
  default: {
    create: jest.fn(),
  },
}));

const { default: rateLimit } = await import("express-rate-limit");
const { default: ActivityLog } = await import("../../models/ActivityLog.js");
const { loginLimiter, apiLimiter } = await import("../rateLimiter.js");

describe("loginLimiter configuration", () => {
  test("uses expected rate limit settings", () => {
    expect(rateLimit).toHaveBeenCalled();
    const loginOptions = rateLimit.mock.calls[0][0];
    expect(loginOptions.windowMs).toBe(5 * 60 * 1000);
    expect(loginOptions.max).toBe(3);
    expect(loginOptions.message).toContain("Too many login attempts");
    expect(loginOptions.standardHeaders).toBe(true);
    expect(loginOptions.legacyHeaders).toBe(false);
    expect(typeof loginOptions.keyGenerator).toBe("function");
    expect(typeof loginOptions.handler).toBe("function");
  });

  test("keyGenerator returns IP from req.ip", () => {
    const loginOptions = rateLimit.mock.calls[0][0];
    const keyGen = loginOptions.keyGenerator;
    const req = { ip: "1.2.3.4" };
    expect(keyGen(req)).toBe("1.2.3.4");
  });

  test("keyGenerator falls back to socket.remoteAddress", () => {
    const loginOptions = rateLimit.mock.calls[0][0];
    const keyGen = loginOptions.keyGenerator;
    const req = { socket: { remoteAddress: "5.6.7.8" } };
    expect(keyGen(req)).toBe("5.6.7.8");
  });

  test("keyGenerator returns 'unknown' if no IP available", () => {
    const loginOptions = rateLimit.mock.calls[0][0];
    const keyGen = loginOptions.keyGenerator;
    const req = {};
    expect(keyGen(req)).toBe("unknown");
  });

  test("handler logs activity and responds 429", async () => {
    const loginOptions = rateLimit.mock.calls[0][0];
    const handler = loginOptions.handler;
    const req = { ip: "1.2.3.4" };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    await handler(req, res);
    expect(ActivityLog.create).toHaveBeenCalledWith({
      action: "failed_login",
      detail: "Rate limit exceeded",
    });
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({
      message: expect.stringContaining("Too many login attempts"),
    });
  });

  test("handler handles ActivityLog.create failure gracefully", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const loginOptions = rateLimit.mock.calls[0][0];
    const handler = loginOptions.handler;
    ActivityLog.create.mockRejectedValue(new Error("DB error"));
    const req = { ip: "1.2.3.4" };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});

describe("apiLimiter configuration", () => {
  test("uses expected general rate limit settings", () => {
    expect(rateLimit).toHaveBeenCalledTimes(2);
    const apiOptions = rateLimit.mock.calls[1][0];
    expect(apiOptions.windowMs).toBe(15 * 60 * 1000);
    expect(apiOptions.max).toBe(100);
    expect(apiOptions.message).toContain("Too many requests");
    expect(typeof apiOptions.keyGenerator).toBe("function");
  });
});
