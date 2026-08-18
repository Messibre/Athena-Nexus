import {
  describe,
  expect,
  jest,
  test,
  beforeEach,
  afterEach,
} from "@jest/globals";

await jest.unstable_mockModule("../../models/Submission.js", () => {
  const MockSubmission = jest.fn(function (data) {
    Object.assign(this, data);
    this.submission_id = this.submission_id || 123;
    this.week_id = this.week_id || "w1";
    this.user_id = this.user_id || "u1";
    this.status = this.status || "pending";
    this.github_repo_url = this.github_repo_url || "";
    this.github_live_demo_url = this.github_live_demo_url || "";
    this.description = this.description || "";
    this.tags = this.tags || [];
    this.screenshotUrl = this.screenshotUrl || "";
    return this;
  });

  MockSubmission.prototype.save = jest.fn().mockResolvedValue(this);
  MockSubmission.find = jest.fn();
  MockSubmission.findById = jest.fn();
  MockSubmission.findOne = jest.fn();
  MockSubmission.countDocuments = jest.fn();

  return { default: MockSubmission };
});

await jest.unstable_mockModule("../../models/Week.js", () => {
  const MockWeek = jest.fn(function (data) {
    Object.assign(this, data);
    this.week_id = this.week_id || 123;
    this.week_number = this.week_number || 1;
    this.title = this.title || "Week 1";
    this.description = this.description || "Description";
    this.deadlineDate = this.deadlineDate || null;
    return this;
  });

  MockWeek.find = jest.fn();
  MockWeek.findById = jest.fn();
  MockWeek.findOne = jest.fn();

  return { default: MockWeek };
});

await jest.unstable_mockModule("../../models/ActivityLog.js", () => {
  const MockActivityLog = jest.fn(function (data) {
    Object.assign(this, data);
    return this;
  });

  MockActivityLog.create = jest.fn().mockResolvedValue({});
  return { default: MockActivityLog };
});

await jest.unstable_mockModule("../../models/User.js", () => {
  const MockUser = jest.fn(function (data) {
    Object.assign(this, data);
    this._id = this._id || "123";
    return this;
  });

  MockUser.findById = jest.fn();
  MockUser.findOne = jest.fn();
  return { default: MockUser };
});

await jest.unstable_mockModule("../../middleware/auth.js", () => ({
  getTokenFromRequest: jest.fn(),
}));

await jest.unstable_mockModule("../../utils/validators.js", () => ({
  isValidGitHubUrl: jest.fn(),
  isValidUrl: jest.fn(),
}));

await jest.unstable_mockModule("jsonwebtoken", () => ({
  default: {
    verify: jest.fn(),
  },
}));

const { default: Submission } = await import("../../models/Submission.js");
const { default: Week } = await import("../../models/Week.js");
const { default: ActivityLog } = await import("../../models/ActivityLog.js");
const { default: User } = await import("../../models/User.js");
const { getTokenFromRequest } = await import("../../middleware/auth.js");
const { isValidGitHubUrl, isValidUrl } =
  await import("../../utils/validators.js");
const { default: jwt } = await import("jsonwebtoken");

const funs = await import("../submissionsController.js");

const makeRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

const makePopulateSortQuery = (result) => ({
  populate: jest.fn().mockReturnThis(),
  sort: jest.fn().mockResolvedValue(result),
});

const makeDoublePopulateQuery = (result) => {
  const secondPopulate = {
    populate: jest.fn().mockResolvedValue(result),
  };
  return {
    populate: jest.fn().mockReturnValue(secondPopulate),
  };
};

describe("getPublicSubmissions", () => {
  let req, res, consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    res = makeRes();
    req = { query: {} };
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("returns approved submissions filtered by weekId", async () => {
    req.query = { weekId: "w123" };
    const submissions = [
      { submission_id: 1, status: "approved", week_id: "w123" },
    ];
    const query = makePopulateSortQuery(submissions);
    Submission.find.mockReturnValue(query);

    await funs.getPublicSubmissions(req, res);

    expect(Submission.find).toHaveBeenCalledWith({
      status: "approved",
      week_id: "w123",
    });
    expect(query.populate).toHaveBeenCalledWith(
      "user_id",
      "username displayName",
    );
    expect(query.populate).toHaveBeenCalledWith("week_id", "week_number title");
    expect(query.sort).toHaveBeenCalledWith({ created_at: -1 });
    expect(res.json).toHaveBeenCalledWith(submissions);
  });

  test("returns approved submissions without weekId filter", async () => {
    req.query = {};
    const submissions = [{ submission_id: 1, status: "approved" }];
    const query = makePopulateSortQuery(submissions);
    Submission.find.mockReturnValue(query);

    await funs.getPublicSubmissions(req, res);

    expect(Submission.find).toHaveBeenCalledWith({ status: "approved" });
    expect(res.json).toHaveBeenCalledWith(submissions);
  });

  test("returns empty array when no submissions", async () => {
    Submission.find.mockReturnValue(makePopulateSortQuery([]));

    await funs.getPublicSubmissions(req, res);

    expect(res.json).toHaveBeenCalledWith([]);
  });

  test("returns 500 on database query rejection", async () => {
    Submission.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockRejectedValue(new Error("DB error")),
    });

    await funs.getPublicSubmissions(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Server error" });
  });
});

describe("getMySubmissions", () => {
  let req, res, consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    res = makeRes();
    req = { user: { _id: "u123" } };
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("returns submissions for the authenticated user", async () => {
    const submissions = [{ submission_id: 1, user_id: "u123" }];
    const query = makePopulateSortQuery(submissions);
    Submission.find.mockReturnValue(query);

    await funs.getMySubmissions(req, res);

    expect(Submission.find).toHaveBeenCalledWith({ user_id: "u123" });
    expect(query.populate).toHaveBeenCalledWith(
      "week_id",
      "week_number title deadlineDate",
    );
    expect(query.sort).toHaveBeenCalledWith({ created_at: -1 });
    expect(res.json).toHaveBeenCalledWith(submissions);
  });

  test("returns empty array when user has no submissions", async () => {
    Submission.find.mockReturnValue(makePopulateSortQuery([]));

    await funs.getMySubmissions(req, res);

    expect(res.json).toHaveBeenCalledWith([]);
  });

  test("returns 500 on database query rejection", async () => {
    Submission.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockRejectedValue(new Error("DB error")),
    });

    await funs.getMySubmissions(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Server error" });
  });
});

describe("getSubmissionById", () => {
  let req, res, consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    res = makeRes();
    req = { params: { id: "sub1" } };
    getTokenFromRequest.mockReturnValue(null);
    jwt.verify.mockReset();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("returns submission when the requester is the owner", async () => {
    const user = { _id: "u1", role: "member" };
    const submission = {
      _id: "sub1",
      status: "pending",
      user_id: { _id: { toString: () => "u1" } },
    };
    getTokenFromRequest.mockReturnValue("token");
    jwt.verify.mockReturnValue({ userId: "u1" });
    User.findById.mockResolvedValue(user);
    Submission.findById.mockReturnValue(makeDoublePopulateQuery(submission));

    await funs.getSubmissionById(req, res);

    expect(Submission.findById).toHaveBeenCalledWith("sub1");
    expect(res.json).toHaveBeenCalledWith(submission);
  });

  test("returns submission when the requester is an admin", async () => {
    const admin = { _id: "admin1", role: "admin" };
    const submission = {
      _id: "sub1",
      status: "pending",
      user_id: { _id: { toString: () => "owner1" } },
    };
    getTokenFromRequest.mockReturnValue("token");
    jwt.verify.mockReturnValue({ userId: "admin1" });
    User.findById.mockResolvedValue(admin);
    Submission.findById.mockReturnValue(makeDoublePopulateQuery(submission));

    await funs.getSubmissionById(req, res);

    expect(res.json).toHaveBeenCalledWith(submission);
  });

  test("returns approved submission without a token", async () => {
    const submission = {
      _id: "sub1",
      status: "approved",
      user_id: { _id: { toString: () => "owner1" } },
    };
    getTokenFromRequest.mockReturnValue(null);
    Submission.findById.mockReturnValue(makeDoublePopulateQuery(submission));

    await funs.getSubmissionById(req, res);

    expect(res.json).toHaveBeenCalledWith(submission);
  });

  test("returns 403 for non-approved submission without a token", async () => {
    const submission = { _id: "sub1", status: "pending" };
    getTokenFromRequest.mockReturnValue(null);
    Submission.findById.mockReturnValue(makeDoublePopulateQuery(submission));

    await funs.getSubmissionById(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "Submission not available",
    });
  });

  test("returns 403 for non-approved submission with invalid token", async () => {
    const submission = { _id: "sub1", status: "pending" };
    getTokenFromRequest.mockReturnValue("bad-token");
    jwt.verify.mockImplementation(() => {
      const error = new Error("Invalid token");
      error.name = "JsonWebTokenError";
      throw error;
    });
    Submission.findById.mockReturnValue(makeDoublePopulateQuery(submission));

    await funs.getSubmissionById(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "Submission not available",
    });
  });

  test("returns approved submission even with invalid token", async () => {
    const submission = { _id: "sub1", status: "approved" };
    getTokenFromRequest.mockReturnValue("bad-token");
    jwt.verify.mockImplementation(() => {
      const error = new Error("Invalid token");
      error.name = "JsonWebTokenError";
      throw error;
    });
    Submission.findById.mockReturnValue(makeDoublePopulateQuery(submission));

    await funs.getSubmissionById(req, res);

    expect(res.json).toHaveBeenCalledWith(submission);
  });

  test("returns 403 for non-owner, non-admin, non-approved submission", async () => {
    const user = { _id: "u2", role: "member" };
    const submission = {
      _id: "sub1",
      status: "pending",
      user_id: { _id: { toString: () => "u1" } },
    };
    getTokenFromRequest.mockReturnValue("token");
    jwt.verify.mockReturnValue({ userId: "u2" });
    User.findById.mockResolvedValue(user);
    Submission.findById.mockReturnValue(makeDoublePopulateQuery(submission));

    await funs.getSubmissionById(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "Not authorized to view this submission",
    });
  });

  test("returns 403 when submission user_id is missing and status is not approved", async () => {
    const user = { _id: "u2", role: "member" };
    const submission = { _id: "sub1", status: "pending", user_id: null };
    getTokenFromRequest.mockReturnValue("token");
    jwt.verify.mockReturnValue({ userId: "u2" });
    User.findById.mockResolvedValue(user);
    Submission.findById.mockReturnValue(makeDoublePopulateQuery(submission));

    await funs.getSubmissionById(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "Not authorized to view this submission",
    });
  });

  test("returns 500 when User.findById rejects inside auth block", async () => {
    const submission = {
      _id: "sub1",
      status: "pending",
      user_id: { _id: { toString: () => "u1" } },
    };
    getTokenFromRequest.mockReturnValue("valid-token");
    jwt.verify.mockReturnValue({ userId: "u2" });
    User.findById.mockRejectedValue(new Error("DB error"));
    Submission.findById.mockReturnValue(makeDoublePopulateQuery(submission));

    await funs.getSubmissionById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Server error" });
  });

  test("returns 404 when submission is not found", async () => {
    Submission.findById.mockReturnValue(makeDoublePopulateQuery(null));

    await funs.getSubmissionById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Submission not found" });
  });

  test("returns 500 on database query rejection (outer catch)", async () => {
    Submission.findById.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error("DB error")),
      }),
    });

    await funs.getSubmissionById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Server error" });
  });
});

describe("createSubmission", () => {
  let req, res, consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    res = makeRes();
    req = {
      user: { _id: "u1" },
      body: {
        week_id: "w1",
        github_repo_url: "https://github.com/owner/repo",
        github_live_demo_url: "https://example.com",
        description: "My project",
        tags: ["html", "css"],
        screenshotUrl: "https://example.com/screenshot.png",
      },
    };
    isValidGitHubUrl.mockReturnValue(true);
    isValidUrl.mockReturnValue(true);
    Week.findById.mockResolvedValue({
      _id: "w1",
      week_number: 1,
      deadlineDate: null,
    });
    Submission.findOne.mockResolvedValue(null);
    ActivityLog.create.mockResolvedValue({});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("creates a submission with pending status and logs activity", async () => {
    await funs.createSubmission(req, res);

    expect(Week.findById).toHaveBeenCalledWith("w1");
    expect(Submission.findOne).toHaveBeenCalledWith({
      user_id: "u1",
      week_id: "w1",
    });
    expect(ActivityLog.create).toHaveBeenCalledWith({
      user_id: "u1",
      action: "submit",
      detail: "Submitted for week 1",
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        week_id: "w1",
        user_id: "u1",
        status: "pending",
        github_repo_url: "https://github.com/owner/repo",
      }),
    );
  });

  test("returns 400 when week_id or github_repo_url is missing", async () => {
    req.body = { github_repo_url: "https://github.com/owner/repo" };

    await funs.createSubmission(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Week ID and GitHub repo URL are required",
    });
  });

  test("returns 400 for invalid GitHub URL", async () => {
    isValidGitHubUrl.mockReturnValue(false);

    await funs.createSubmission(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message:
        "Invalid GitHub URL. Must be in format: https://github.com/owner/repo",
    });
  });

  test("returns 400 for invalid live demo URL", async () => {
    isValidUrl.mockReturnValue(false);

    await funs.createSubmission(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid live demo URL" });
  });

  test("returns 404 when week is not found", async () => {
    Week.findById.mockResolvedValue(null);

    await funs.createSubmission(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Week not found" });
  });

  test("returns 400 when the submission deadline has passed", async () => {
    Week.findById.mockResolvedValue({
      _id: "w1",
      week_number: 1,
      deadlineDate: new Date("2020-01-01"),
    });

    await funs.createSubmission(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Submission deadline has passed",
    });
  });

  test("returns 400 when user already submitted for the week", async () => {
    Submission.findOne.mockResolvedValue({
      _id: "existing",
      week_id: "w1",
      user_id: "u1",
    });

    await funs.createSubmission(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message:
        "You have already submitted for this week. Use update endpoint to modify.",
    });
  });

  test("returns 500 when Week.findById rejects", async () => {
    Week.findById.mockRejectedValue(new Error("DB error"));

    await funs.createSubmission(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Server error" });
  });

  test("returns 500 when submission save fails", async () => {
    Submission.prototype.save.mockRejectedValueOnce(new Error("Save failed"));

    await funs.createSubmission(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Server error" });
  });
});

describe("updateSubmission", () => {
  let req, res, consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    res = makeRes();
    req = {
      params: { id: "sub1" },
      user: { _id: "u1" },
      body: {
        github_repo_url: "https://github.com/owner/new-repo",
        github_live_demo_url: "https://example.com",
        description: "Updated",
        tags: ["js"],
        screenshotUrl: "https://example.com/new.png",
      },
    };
    isValidGitHubUrl.mockReturnValue(true);
    isValidUrl.mockReturnValue(true);
    Week.findById.mockResolvedValue({
      _id: "w1",
      week_number: 1,
      deadlineDate: null,
    });
    ActivityLog.create.mockResolvedValue({});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("returns 404 when submission is not found", async () => {
    Submission.findById.mockResolvedValue(null);

    await funs.updateSubmission(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Submission not found" });
  });

  test("returns 403 when user is not the owner", async () => {
    Submission.findById.mockResolvedValue({
      _id: "sub1",
      user_id: "different-user",
      week_id: "w1",
      status: "pending",
      save: jest.fn().mockResolvedValue({}),
    });

    await funs.updateSubmission(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "Not authorized to update this submission",
    });
  });

  test("returns 400 when the deadline has passed", async () => {
    Submission.findById.mockResolvedValue({
      _id: "sub1",
      user_id: "u1",
      week_id: "w1",
      status: "pending",
      save: jest.fn().mockResolvedValue({}),
    });
    Week.findById.mockResolvedValue({
      _id: "w1",
      week_number: 1,
      deadlineDate: new Date("2020-01-01"),
    });

    await funs.updateSubmission(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Cannot update submission after deadline",
    });
  });

  test("returns 400 for invalid GitHub URL", async () => {
    Submission.findById.mockResolvedValue({
      _id: "sub1",
      user_id: "u1",
      week_id: "w1",
      status: "pending",
      save: jest.fn().mockResolvedValue({}),
    });
    isValidGitHubUrl.mockReturnValue(false);

    await funs.updateSubmission(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message:
        "Invalid GitHub URL. Must be in format: https://github.com/owner/repo",
    });
  });

  test("returns 400 for invalid live demo URL", async () => {
    Submission.findById.mockResolvedValue({
      _id: "sub1",
      user_id: "u1",
      week_id: "w1",
      status: "pending",
      save: jest.fn().mockResolvedValue({}),
    });
    isValidUrl.mockReturnValue(false);

    await funs.updateSubmission(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid live demo URL" });
  });

  test("updates fields, resets rejected status to pending, logs activity", async () => {
    const existingSubmission = {
      _id: "sub1",
      user_id: "u1",
      week_id: "w1",
      status: "rejected",
      github_repo_url: "old",
      github_live_demo_url: "old",
      description: "old",
      tags: [],
      screenshotUrl: "",
      save: jest.fn().mockResolvedValueThis
        ? jest.fn().mockResolvedValue({
            _id: "sub1",
            user_id: "u1",
            week_id: "w1",
            status: "pending",
            github_repo_url: "https://github.com/owner/new-repo",
            github_live_demo_url: "https://example.com",
            description: "Updated",
            tags: ["js"],
            screenshotUrl: "https://example.com/new.png",
          })
        : jest.fn().mockResolvedValue({
            _id: "sub1",
            user_id: "u1",
            week_id: "w1",
            status: "pending",
            github_repo_url: "https://github.com/owner/new-repo",
            github_live_demo_url: "https://example.com",
            description: "Updated",
            tags: ["js"],
            screenshotUrl: "https://example.com/new.png",
          }),
    };

    Submission.findById.mockResolvedValue(existingSubmission);

    await funs.updateSubmission(req, res);

    expect(existingSubmission.save).toHaveBeenCalled();
    expect(ActivityLog.create).toHaveBeenCalledWith({
      user_id: "u1",
      action: "update",
      detail: "Updated submission for week 1",
    });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "pending",
        github_repo_url: "https://github.com/owner/new-repo",
        description: "Updated",
      }),
    );
  });

  test("does not change status when it was already pending or approved", async () => {
    const existingSubmission = {
      _id: "sub1",
      user_id: "u1",
      week_id: "w1",
      status: "approved",
      save: jest.fn().mockResolvedValue({
        _id: "sub1",
        user_id: "u1",
        week_id: "w1",
        status: "approved",
        github_repo_url: "updated",
      }),
    };
    Submission.findById.mockResolvedValue(existingSubmission);

    await funs.updateSubmission(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: "approved" }),
    );
  });

  test("returns 500 when Week.findById rejects", async () => {
    Submission.findById.mockResolvedValue({
      _id: "sub1",
      user_id: "u1",
      week_id: "w1",
      status: "pending",
      save: jest.fn().mockResolvedValue({}),
    });
    Week.findById.mockRejectedValue(new Error("DB error"));

    await funs.updateSubmission(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Server error" });
  });

  test("returns 500 when submission save rejects", async () => {
    Submission.findById.mockResolvedValue({
      _id: "sub1",
      user_id: "u1",
      week_id: "w1",
      status: "pending",
      save: jest.fn().mockRejectedValue(new Error("Save error")),
    });

    await funs.updateSubmission(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Server error" });
  });

  test("returns 404 when week is not found", async () => {
    Submission.findById.mockResolvedValue({
      _id: "sub1",
      user_id: "u1",
      week_id: "w1",
      status: "pending",
      save: jest.fn().mockResolvedValue({}),
    });
    Week.findById.mockResolvedValue(null);

    await funs.updateSubmission(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Week not found" });
  });
  test("normalizes github_live_demo_url from null to empty string", async () => {
    const existingSubmission = {
      _id: "sub1",
      user_id: "u1",
      week_id: "w1",
      status: "pending",
      github_repo_url: "old",
      github_live_demo_url: "old",
      description: "old",
      tags: [],
      screenshotUrl: "",
      save: jest.fn().mockResolvedValue({
        _id: "sub1",
        user_id: "u1",
        week_id: "w1",
        status: "pending",
        github_repo_url: "https://github.com/owner/new-repo",
        github_live_demo_url: "",
        description: "Updated",
        tags: ["js"],
        screenshotUrl: "https://example.com/new.png",
      }),
    };
    Submission.findById.mockResolvedValue(existingSubmission);
    req.body = {
      github_repo_url: "https://github.com/owner/new-repo",
      github_live_demo_url: null, // explicitly null
      description: "Updated",
      tags: ["js"],
      screenshotUrl: "https://example.com/new.png",
    };

    await funs.updateSubmission(req, res);

    expect(existingSubmission.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ github_live_demo_url: "" }),
    );
  });
});
