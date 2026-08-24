import {
  describe,
  expect,
  jest,
  test,
  beforeEach,
  afterEach,
} from "@jest/globals";

// Mock ActivityLog model
await jest.unstable_mockModule("../../models/ActivityLog.js", () => {
  const MockActivityLog = {
    find: jest.fn(),
  };
  return { default: MockActivityLog };
});

const { default: ActivityLog } = await import("../../models/ActivityLog.js");
const controller = await import("../activityController.js");

const makeRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

// Helper to create a chainable Mongoose-like query
const createQueryChain = (result) => {
  const then = (resolve, reject) => {
    const p =
      result instanceof Error
        ? Promise.reject(result)
        : Promise.resolve(result);
    return p.then(resolve, reject);
  };
  return {
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnValue({ then }),
  };
};

// Creates a chain that rejects
const createRejectingChain = (message = "Server error") =>
  createQueryChain(new Error(message));

describe("getActivityLogs", () => {
  let req, res;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    req = { query: {} };
    res = makeRes();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("returns all activity logs with default limit 100", async () => {
    const logs = [
      { _id: "log1", action: "login" },
      { _id: "log2", action: "logout" },
    ];
    const queryChain = createQueryChain(logs);
    ActivityLog.find.mockReturnValue(queryChain);

    await controller.getActivityLogs(req, res);

    expect(ActivityLog.find).toHaveBeenCalledWith({});
    expect(queryChain.populate).toHaveBeenCalledWith("user_id", "username");
    expect(queryChain.sort).toHaveBeenCalledWith({ timestamp: -1 });
    expect(queryChain.limit).toHaveBeenCalledWith(100);
    expect(res.json).toHaveBeenCalledWith(logs);
  });

  test("filters by action when provided", async () => {
    req.query.action = "login";
    ActivityLog.find.mockReturnValue(createQueryChain([]));

    await controller.getActivityLogs(req, res);

    expect(ActivityLog.find).toHaveBeenCalledWith({ action: "login" });
  });

  test("parses limit from query string", async () => {
    req.query.limit = "25";
    const queryChain = createQueryChain([]);
    ActivityLog.find.mockReturnValue(queryChain);

    await controller.getActivityLogs(req, res);

    expect(queryChain.limit).toHaveBeenCalledWith(25);
  });

  test("returns empty array when no logs found", async () => {
    ActivityLog.find.mockReturnValue(createQueryChain([]));

    await controller.getActivityLogs(req, res);

    expect(res.json).toHaveBeenCalledWith([]);
  });

  test("returns 500 on database error", async () => {
    ActivityLog.find.mockReturnValue(createRejectingChain("DB fail"));

    await controller.getActivityLogs(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Server error" });
  });
});

describe("getMyActivityLogs", () => {
  let req, res;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    req = {
      user: { _id: "user123" },
      query: {},
    };
    res = makeRes();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("returns activity logs for the current user with default limit 8", async () => {
    const logs = [
      { _id: "log1", user_id: "user123", action: "login" },
      { _id: "log2", user_id: "user123", action: "update" },
    ];
    const queryChain = createQueryChain(logs);
    ActivityLog.find.mockReturnValue(queryChain);

    await controller.getMyActivityLogs(req, res);

    expect(ActivityLog.find).toHaveBeenCalledWith({ user_id: "user123" });
    expect(queryChain.populate).toHaveBeenCalledWith(
      "user_id",
      "username displayName",
    );
    expect(queryChain.sort).toHaveBeenCalledWith({ timestamp: -1 });
    expect(queryChain.limit).toHaveBeenCalledWith(8);
    expect(res.json).toHaveBeenCalledWith(logs);
  });

  test("parses custom limit from query", async () => {
    req.query.limit = "15";
    const queryChain = createQueryChain([]);
    ActivityLog.find.mockReturnValue(queryChain);

    await controller.getMyActivityLogs(req, res);

    expect(queryChain.limit).toHaveBeenCalledWith(15);
  });

  test("returns empty array when user has no logs", async () => {
    ActivityLog.find.mockReturnValue(createQueryChain([]));

    await controller.getMyActivityLogs(req, res);

    expect(res.json).toHaveBeenCalledWith([]);
  });

  test("returns 500 on database error", async () => {
    ActivityLog.find.mockReturnValue(createRejectingChain("DB fail"));

    await controller.getMyActivityLogs(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Server error" });
  });
});
