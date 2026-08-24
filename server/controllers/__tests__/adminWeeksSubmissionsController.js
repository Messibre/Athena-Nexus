import {
  describe,
  expect,
  jest,
  test,
  beforeEach,
  afterEach,
} from "@jest/globals";

await jest.unstable_mockModule("../../utils/validators.js", () => ({
  isValidPassword: jest.fn(),
  isValidUrl: jest.fn().mockReturnValue(true),
}));
await jest.unstable_mockModule("../../models/User.js", () => {
  const MockUser = jest.fn(function (data) {
    Object.assign(this, data);
    this._id = this._id || "u1";
    this.save = jest.fn().mockResolvedValue(this);
    return this;
  });

  MockUser.findOne = jest.fn().mockResolvedValue(null);
  MockUser.find = jest.fn();
  MockUser.findById = jest.fn().mockResolvedValue(null);
  MockUser.findByIdAndDelete = jest.fn().mockResolvedValue({});
  MockUser.countDocuments = jest.fn().mockResolvedValue(0);

  return { default: MockUser };
});

// Mock Week model
await jest.unstable_mockModule("../../models/Week.js", () => {
  const MockWeek = jest.fn(function (data) {
    Object.assign(this, data);
    this._id = this._id || "w1";
    this.save = jest.fn().mockResolvedValue(this);
    return this;
  });

  MockWeek.findOne = jest.fn().mockResolvedValue(null);
  MockWeek.find = jest.fn();
  MockWeek.findById = jest.fn().mockResolvedValue(null);
  MockWeek.findByIdAndDelete = jest.fn().mockResolvedValue({});
  MockWeek.countDocuments = jest.fn().mockResolvedValue(0);

  return { default: MockWeek };
});

// Mock Submission model
await jest.unstable_mockModule("../../models/Submission.js", () => {
  const MockSubmission = jest.fn(function (data) {
    Object.assign(this, data);
    this._id = this._id || "s1";
    this.save = jest.fn().mockResolvedValue(this);
    return this;
  });

  MockSubmission.find = jest.fn();
  MockSubmission.findById = jest.fn().mockResolvedValue(null);
  MockSubmission.countDocuments = jest.fn().mockResolvedValue(0);

  return { default: MockSubmission };
});

// Mock Feedback model (for getStats)
await jest.unstable_mockModule("../../models/Feedback.js", () => {
  return {
    default: {
      countDocuments: jest.fn().mockResolvedValue(0),
    },
  };
});

const { default: User } = await import("../../models/User.js");
const { default: Week } = await import("../../models/Week.js");
const { default: Submission } = await import("../../models/Submission.js");
const { default: Feedback } = await import("../../models/Feedback.js");
const controller = await import("../adminController.js");

const makeRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
  setHeader: jest.fn().mockReturnThis(),
  send: jest.fn(),
});

describe("createWeek", () => {
  let req, res, mockWeekInstance;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    mockWeekInstance = {
      _id: "w123",
      week_number: 1,
      title: "Week 1",
      description: "Fundamentals",
      startDate: new Date("2026-01-01"),
      deadlineDate: new Date("2026-01-08"),
      resources: ["url1"],
      isActive: false,
      save: jest.fn().mockResolvedValue(mockWeekInstance),
    };

    Week.mockImplementation((data) => {
      Object.assign(mockWeekInstance, data);
      return mockWeekInstance;
    });

    Week.findOne.mockResolvedValue(null);

    req = {
      body: {
        week_number: 1,
        title: "Week 1",
        description: "Fundamentals",
        startDate: "2026-01-01",
        deadlineDate: "2026-01-08",
        resources: ["url1"],
      },
    };
    res = makeRes();
  });
  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("creates a new week", async () => {
    await controller.createWeek(req, res);

    expect(Week.findOne).toHaveBeenCalledWith({ week_number: 1 });
    expect(Week).toHaveBeenCalledWith({
      week_number: 1,
      title: "Week 1",
      description: "Fundamentals",
      startDate: new Date("2026-01-01"),
      deadlineDate: new Date("2026-01-08"),
      resources: ["url1"],
      isActive: false,
    });
    expect(mockWeekInstance.save).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockWeekInstance);
  });

  test("returns 400 when week_number missing", async () => {
    req.body.week_number = undefined;
    await controller.createWeek(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Week number is required",
    });
  });

  test("returns 400 when title not a string", async () => {
    req.body.title = 123;
    await controller.createWeek(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Title must be a string",
    });
  });

  test("returns 400 when description not a string", async () => {
    req.body.description = true;
    await controller.createWeek(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Description must be a string",
    });
  });

  test("returns 400 for invalid startDate", async () => {
    req.body.startDate = "not-a-date";
    await controller.createWeek(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid startDate" });
  });

  test("returns 400 for invalid deadlineDate", async () => {
    req.body.deadlineDate = "not-a-date";
    await controller.createWeek(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid deadlineDate" });
  });

  test("returns 400 when deadlineDate before startDate", async () => {
    req.body.startDate = "2026-01-10";
    req.body.deadlineDate = "2026-01-01";
    await controller.createWeek(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "deadlineDate must be after startDate",
    });
  });

  test("returns 400 when week_number already exists", async () => {
    Week.findOne.mockResolvedValue({ _id: "existing" });
    await controller.createWeek(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Week number already exists",
    });
  });

  test("returns 500 on save error", async () => {
    mockWeekInstance.save.mockRejectedValue(new Error("DB error"));
    await controller.createWeek(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Server error" });
  });
});

describe("updateWeek", () => {
  let req, res, mockWeekInstance;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    mockWeekInstance = {
      _id: "w123",
      title: "Old",
      description: "Old desc",
      startDate: null,
      deadlineDate: null,
      resources: [],
      isActive: false,
      save: jest.fn().mockResolvedValue(mockWeekInstance),
    };
    Week.findById.mockResolvedValue(mockWeekInstance);
    req = {
      params: { id: "w123" },
      body: {
        title: "New",
        startDate: "2026-01-01",
        deadlineDate: "2026-01-08",
      },
    };
    res = makeRes();
  });
  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("updates week successfully", async () => {
    await controller.updateWeek(req, res);
    expect(Week.findById).toHaveBeenCalledWith("w123");
    expect(mockWeekInstance.save).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(mockWeekInstance);
  });

  test("returns 404 when week not found", async () => {
    Week.findById.mockResolvedValue(null);
    await controller.updateWeek(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Week not found" });
  });

  test("returns 400 for invalid startDate", async () => {
    req.body.startDate = "invalid";
    await controller.updateWeek(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid startDate" });
  });

  test("returns 400 for invalid deadlineDate", async () => {
    req.body.deadlineDate = "invalid";
    await controller.updateWeek(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid deadlineDate" });
  });

  test("returns 400 when deadlineDate before startDate", async () => {
    req.body.startDate = "2026-01-10";
    req.body.deadlineDate = "2026-01-01";
    await controller.updateWeek(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "deadlineDate must be after startDate",
    });
  });

  test("returns 500 on save error", async () => {
    mockWeekInstance.save.mockRejectedValue(new Error("DB error"));
    await controller.updateWeek(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Server error" });
  });
});

describe("deleteWeek", () => {
  let req, res;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    Week.findById.mockResolvedValue({ _id: "w123" });
    Submission.find.mockResolvedValue([]);
    Week.findByIdAndDelete.mockResolvedValue({});
    req = { params: { id: "w123" } };
    res = makeRes();
  });
  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("deletes week with no submissions", async () => {
    await controller.deleteWeek(req, res);
    expect(Submission.find).toHaveBeenCalledWith({ week_id: "w123" });
    expect(Week.findByIdAndDelete).toHaveBeenCalledWith("w123");
    expect(res.json).toHaveBeenCalledWith({
      message: "Week deleted successfully",
    });
  });

  test("returns 404 when week not found", async () => {
    Week.findById.mockResolvedValue(null);
    await controller.deleteWeek(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Week not found" });
  });

  test("returns 400 when submissions exist", async () => {
    Submission.find.mockResolvedValue([{ _id: "s1" }]);
    await controller.deleteWeek(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Cannot delete week with existing submissions",
    });
  });

  test("returns 500 on database error", async () => {
    Week.findById.mockRejectedValue(new Error("DB error"));
    await controller.deleteWeek(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Server error" });
  });
});

describe("getSubmissions", () => {
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
  test("returns submissions with filters", async () => {
    req.query = { weekId: "w1", status: "approved" };
    const submissions = [{ _id: "s1", status: "approved" }];
    Submission.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue(submissions),
    });

    await controller.getSubmissions(req, res);

    expect(Submission.find).toHaveBeenCalledWith({
      week_id: "w1",
      status: "approved",
    });
    expect(res.json).toHaveBeenCalledWith(submissions);
  });

  test("returns empty array when no submissions", async () => {
    Submission.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue([]),
    });

    await controller.getSubmissions(req, res);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  test("returns 500 on database error", async () => {
    Submission.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockRejectedValue(new Error("DB error")),
    });

    await controller.getSubmissions(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Server error" });
  });
});

describe("updateSubmissionStatus", () => {
  let req, res, mockSubmission;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    mockSubmission = {
      _id: "s123",
      status: "pending",
      save: jest.fn().mockResolvedValue(mockSubmission),
    };
    Submission.findById.mockResolvedValue(mockSubmission);
    req = { params: { id: "s123" }, body: { status: "approved" } };
    res = makeRes();
  });
  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("updates status successfully", async () => {
    await controller.updateSubmissionStatus(req, res);
    expect(mockSubmission.status).toBe("approved");
    expect(mockSubmission.save).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(mockSubmission);
  });

  test("returns 404 when submission not found", async () => {
    Submission.findById.mockResolvedValue(null);
    await controller.updateSubmissionStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Submission not found" });
  });

  test("returns 400 for invalid status", async () => {
    req.body.status = "invalid";
    await controller.updateSubmissionStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid status" });
  });

  test("returns 500 on save error", async () => {
    mockSubmission.save.mockRejectedValue(new Error("DB error"));
    await controller.updateSubmissionStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Server error" });
  });
});

describe("exportSubmissions", () => {
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
  test("exports CSV successfully", async () => {
    const submissions = [
      {
        _id: "s1",
        week_id: { week_number: 1, title: "Week 1" },
        user_id: { displayName: "Team A", username: "teama" },
        github_repo_url: "https://github.com/a/repo",
        github_live_demo_url: "https://demo.com",
        status: "approved",
        description: "Hello, world",
        created_at: new Date("2026-01-01T12:00:00Z"),
      },
    ];
    Submission.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue(submissions),
    });

    await controller.exportSubmissions(req, res);

    expect(Submission.find).toHaveBeenCalledWith({});
    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "text/csv");
    expect(res.send).toHaveBeenCalled();
    const csv = res.send.mock.calls[0][0];
    expect(csv).toContain(
      "Week,Group Name,GitHub Repo,Live Demo,Status,Description,Submitted At",
    );
    expect(csv).toContain(
      '1,"Team A","https://github.com/a/repo","https://demo.com",approved,"Hello; world",2026-01-01T12:00:00.000Z',
    );
  });

  test("returns 500 on database error", async () => {
    Submission.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockRejectedValue(new Error("DB error")),
    });

    await controller.exportSubmissions(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Server error" });
  });
});

describe("getStats", () => {
  let req, res;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    req = {};
    res = makeRes();
    // Set all countDocuments to resolve to 0 by default
    User.countDocuments.mockResolvedValue(0);
    Week.countDocuments.mockResolvedValue(0);
    Submission.countDocuments.mockResolvedValue(0);
    Feedback.countDocuments.mockResolvedValue(0);
  });
  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });
  test("returns stats", async () => {
    User.countDocuments.mockResolvedValue(10);
    Week.countDocuments.mockResolvedValue(5);
    Submission.countDocuments
      .mockResolvedValueOnce(20) // totalSubmissions
      .mockResolvedValueOnce(8) // approvedSubmissions
      .mockResolvedValueOnce(12); // pendingSubmissions
    Feedback.countDocuments.mockResolvedValue(3);

    await controller.getStats(req, res);

    expect(User.countDocuments).toHaveBeenCalledWith({ role: "member" });
    expect(Week.countDocuments).toHaveBeenCalled();
    expect(Submission.countDocuments).toHaveBeenCalledTimes(3);
    expect(Feedback.countDocuments).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      totalUsers: 10,
      totalWeeks: 5,
      totalSubmissions: 20,
      approvedSubmissions: 8,
      pendingSubmissions: 12,
      totalFeedback: 3,
    });
  });

  test("returns 500 on database error", async () => {
    User.countDocuments.mockRejectedValue(new Error("DB error"));
    await controller.getStats(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Server error" });
  });
});
