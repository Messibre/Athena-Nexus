import {
  describe,
  expect,
  jest,
  test,
  beforeEach,
  afterEach,
} from "@jest/globals";

await jest.unstable_mockModule("../../models/Week.js", () => {
  const MockWeek = jest.fn(function (data) {
    Object.assign(this, data);
    this.week_id = this.week_id || 123;
    this.week_number = this.week_number || 1;
    this.title = this.title || "week 1";
    this.description = this.description || "HTML fundamentals";
    this.isActive = this.isActive || true;
    return this;
  });
  MockWeek.find = jest.fn().mockResolvedValue(null);
  MockWeek.findOne = jest.fn().mockResolvedValue(null);
  MockWeek.findById = jest.fn().mockResolvedValue(null);
  MockWeek.countDocuments = jest.fn().mockResolvedValue(null);

  return { default: MockWeek };
});

await jest.unstable_mockModule("../../models/Submission.js", () => {
  const MockSubmission = jest.fn(function (data) {
    Object.assign(this, data);
    this.submission_id = this.submission_id || 123;
    this.week_id = this.week_id || 123;
    this.user_id = this.user_id || 123;
    this.status = this.status || "approved";
    return this;
  });
  MockSubmission.find = jest.fn().mockResolvedValue(null);
  MockSubmission.countDocuments = jest.fn().mockResolvedValue(null);

  return { default: MockSubmission };
});
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
  MockUser.countDocuments = jest.fn().mockResolvedValue(null);
  return { default: MockUser };
});

await jest.unstable_mockModule("../../models/MilestoneSubmission.js", () => {
  const MockMilestoneSubmission = jest.fn(function (data) {
    Object.assign(this, data);
    this.milestone_submission_id = this.milestone_submission_id || 123;
    this.userId = this.userId || 123;
    return this;
  });
  MockMilestoneSubmission.find = jest.fn().mockResolvedValue(null);
  return { default: MockMilestoneSubmission };
});
const { default: Week } = await import("../../models/Week.js");
const { default: Submission } = await import("../../models/Submission.js");
const { default: User } = await import("../../models/User.js");
const { default: MilestoneSubmission } =
  await import("../../models/MilestoneSubmission.js");

const funs = await import("../weeksController.js");

const makeRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

const makeSortQuery = (result) => ({
  sort: jest.fn().mockResolvedValue(result),
});

const makeSubmissionQuery = (result) => ({
  populate: jest.fn().mockReturnThis(),
  sort: jest.fn().mockResolvedValue(result),
});

const makeLeaderboardQuery = (result) => ({
  populate: jest.fn().mockReturnThis(),
  select: jest.fn().mockResolvedValue(result),
});

describe("getWeeks", () => {
  let req;
  let res;
  let mockWeekInstance;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    mockWeekInstance = {
      week_id: 123,
      week_number: 2,
      title: "week 1",
      description: "html fundamentals",
      isActive: true,
    };
    req = {};
    res = makeRes();
    Week.find = jest.fn().mockReturnValue(makeSortQuery([mockWeekInstance]));
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("returns weeks successfully", async () => {
    const query = Week.find();

    await funs.getWeeks(req, res);

    expect(Week.find).toHaveBeenCalled();
    expect(query.sort).toHaveBeenCalledWith({ week_number: -1 });
    expect(res.json).toHaveBeenCalledWith([mockWeekInstance]);
  });

  test("returns empty array if no weeks found", async () => {
    Week.find = jest.fn().mockReturnValue(makeSortQuery([]));

    await funs.getWeeks(req, res);

    expect(Week.find).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith([]);
  });

  test("returns 500 status for Db error", async () => {
    Week.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockRejectedValue(new Error("Server error")),
    });

    await funs.getWeeks(req, res);

    expect(Week.find).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Server error" });
  });
});

describe("getActiveWeek", () => {
  let req;
  let res;
  let mockWeekInstance;
  let consoleSpyError;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpyError = jest.spyOn(console, "error").mockImplementation(() => {});
    req = {};
    res = makeRes();

    mockWeekInstance = {
      week_id: 123,
      title: "week 1",
      description: "html fundamentals",
      isActive: true,
    };

    Week.findOne.mockResolvedValue(mockWeekInstance);
  });

  afterEach(() => {
    consoleSpyError.mockRestore();
  });

  test("returns active week successfully", async () => {
    await funs.getActiveWeek(req, res);

    expect(Week.findOne).toHaveBeenCalledWith({ isActive: true });
    expect(res.json).toHaveBeenCalledWith(mockWeekInstance);
  });

  test("returns 404 for no active weeks", async () => {
    Week.findOne.mockResolvedValue(null);

    await funs.getActiveWeek(req, res);

    expect(Week.findOne).toHaveBeenCalledWith({ isActive: true });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "No active week found" });
  });

  test("returns 500 for server error", async () => {
    Week.findOne.mockRejectedValue(new Error("Server error"));

    await funs.getActiveWeek(req, res);

    expect(Week.findOne).toHaveBeenCalledWith({ isActive: true });
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Server error" });
  });
});

describe("getWeekById", () => {
  let req;
  let res;
  let consoleSpyError;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpyError = jest.spyOn(console, "error").mockImplementation(() => {});
    req = { params: { id: "42" } };
    res = makeRes();
  });

  afterEach(() => {
    consoleSpyError.mockRestore();
  });

  test("returns a week by id", async () => {
    const week = { week_id: 42, title: "Week 42" };
    Week.findById.mockResolvedValue(week);

    await funs.getWeekById(req, res);

    expect(Week.findById).toHaveBeenCalledWith("42");
    expect(res.json).toHaveBeenCalledWith(week);
  });

  test("returns 404 when week is missing", async () => {
    Week.findById.mockResolvedValue(null);

    await funs.getWeekById(req, res);

    expect(Week.findById).toHaveBeenCalledWith("42");
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Week not found" });
  });

  test("returns 500 when lookup fails", async () => {
    Week.findById.mockRejectedValue(new Error("Server error"));

    await funs.getWeekById(req, res);

    expect(Week.findById).toHaveBeenCalledWith("42");
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Server error" });
  });
});

describe("getWeekSubmissions", () => {
  let req;
  let res;
  let consoleSpyError;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpyError = jest.spyOn(console, "error").mockImplementation(() => {});
    req = { params: { id: "8" } };
    res = makeRes();
  });

  afterEach(() => {
    consoleSpyError.mockRestore();
  });

  test("returns approved submissions for a week", async () => {
    const submissions = [
      { submission_id: 1, week_id: "8", status: "approved" },
      { submission_id: 2, week_id: "8", status: "approved" },
    ];
    const query = makeSubmissionQuery(submissions);
    Submission.find.mockReturnValue(query);

    await funs.getWeekSubmissions(req, res);

    expect(Submission.find).toHaveBeenCalledWith({
      week_id: "8",
      status: "approved",
    });
    expect(query.populate).toHaveBeenCalledWith(
      "user_id",
      "username displayName members",
    );
    expect(query.sort).toHaveBeenCalledWith({ created_at: -1 });
    expect(res.json).toHaveBeenCalledWith(submissions);
  });

  test("returns empty array when there are no approved submissions", async () => {
    const query = makeSubmissionQuery([]);
    Submission.find.mockReturnValue(query);

    await funs.getWeekSubmissions(req, res);

    expect(res.json).toHaveBeenCalledWith([]);
  });

  test("returns 500 on database failure", async () => {
    Submission.find.mockImplementation(() => ({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockRejectedValue(new Error("Server error")),
    }));

    await funs.getWeekSubmissions(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Server error" });
  });
});

describe("getPublicStats", () => {
  let req;
  let res;
  let consoleSpyError;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpyError = jest.spyOn(console, "error").mockImplementation(() => {});
    req = {};
    res = makeRes();
  });

  afterEach(() => {
    consoleSpyError.mockRestore();
  });

  test("returns public stats counts", async () => {
    User.countDocuments.mockResolvedValue(12);
    Week.countDocuments.mockResolvedValue(7);
    Submission.countDocuments.mockResolvedValue(42);

    await funs.getPublicStats(req, res);

    expect(User.countDocuments).toHaveBeenCalledWith({ role: "member" });
    expect(Week.countDocuments).toHaveBeenCalled();
    expect(Submission.countDocuments).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      totalUsers: 12,
      totalWeeks: 7,
      totalSubmissions: 42,
    });
  });

  test("returns zero counts when collections are empty", async () => {
    User.countDocuments.mockResolvedValue(0);
    Week.countDocuments.mockResolvedValue(0);
    Submission.countDocuments.mockResolvedValue(0);

    await funs.getPublicStats(req, res);

    expect(res.json).toHaveBeenCalledWith({
      totalUsers: 0,
      totalWeeks: 0,
      totalSubmissions: 0,
    });
  });

  test("returns 500 when a count query fails", async () => {
    User.countDocuments.mockRejectedValue(new Error("Server error"));

    await funs.getPublicStats(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Server error" });
  });
});

describe("getLeaderboard", () => {
  let req;
  let res;
  let consoleSpyError;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpyError = jest.spyOn(console, "error").mockImplementation(() => {});
    req = {};
    res = makeRes();
  });

  afterEach(() => {
    consoleSpyError.mockRestore();
  });

  test("aggregates weekly and milestone submissions into a ranked leaderboard", async () => {
    const zoe = {
      _id: { toString: () => "u1" },
      username: "zoe",
      displayName: "Zoe",
      profileImageUrl: "/zoe.png",
      members: ["Zoe Team"],
    };
    const amy = {
      _id: { toString: () => "u2" },
      username: "amy",
      displayName: "Amy",
      profileImageUrl: "/amy.png",
      members: [],
    };
    const bob = {
      _id: { toString: () => "u3" },
      username: "bob",
      displayName: "Bob",
      profileImageUrl: "/bob.png",
      members: ["Bob Team"],
    };

    Submission.find.mockReturnValue(
      makeLeaderboardQuery([{ user_id: zoe }, { user_id: amy }]),
    );
    MilestoneSubmission.find.mockReturnValue(
      makeLeaderboardQuery([{ userId: zoe }, { userId: bob }]),
    );

    await funs.getLeaderboard(req, res);

    expect(Submission.find).toHaveBeenCalledWith({ status: "approved" });
    expect(MilestoneSubmission.find).toHaveBeenCalledWith({
      status: "approved",
    });
    expect(res.json).toHaveBeenCalledWith([
      expect.objectContaining({
        userId: "u1",
        displayName: "Zoe",
        projectCount: 2,
        weeklyProjects: 1,
        milestoneProjects: 1,
        points: 20,
        rank: 1,
        badge: "gold",
      }),
      expect.objectContaining({
        userId: "u2",
        displayName: "Amy",
        projectCount: 1,
        weeklyProjects: 1,
        milestoneProjects: 0,
        points: 10,
        rank: 2,
        badge: "silver",
      }),
      expect.objectContaining({
        userId: "u3",
        displayName: "Bob",
        projectCount: 1,
        weeklyProjects: 0,
        milestoneProjects: 1,
        points: 10,
        rank: 3,
        badge: "bronze",
      }),
    ]);
  });

  test("returns an empty leaderboard when there are no approved submissions", async () => {
    Submission.find.mockReturnValue(makeLeaderboardQuery([]));
    MilestoneSubmission.find.mockReturnValue(makeLeaderboardQuery([]));

    await funs.getLeaderboard(req, res);

    expect(res.json).toHaveBeenCalledWith([]);
  });

  test("ignores submission records with missing users", async () => {
    Submission.find.mockReturnValue(
      makeLeaderboardQuery([{ user_id: null }, { user_id: undefined }]),
    );
    MilestoneSubmission.find.mockReturnValue(
      makeLeaderboardQuery([{ userId: null }]),
    );

    await funs.getLeaderboard(req, res);

    expect(res.json).toHaveBeenCalledWith([]);
  });

  test("returns 500 when one of the leaderboard queries fails", async () => {
    Submission.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error("Server error")),
      }),
    });
    MilestoneSubmission.find.mockReturnValue(makeLeaderboardQuery([]));

    await funs.getLeaderboard(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Server error" });
  });
});
