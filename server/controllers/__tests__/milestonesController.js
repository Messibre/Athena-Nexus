import {
  describe,
  expect,
  jest,
  test,
  beforeEach,
  afterEach,
} from "@jest/globals";

await jest.unstable_mockModule("../../models/MilestoneCategory.js", () => {
  const MockMilestoneCategory = {
    find: jest.fn(),
  };
  return { default: MockMilestoneCategory };
});

await jest.unstable_mockModule("../../models/MilestoneLevel.js", () => {
  const MockMilestoneLevel = {
    find: jest.fn(),
    findById: jest.fn(),
  };
  return { default: MockMilestoneLevel };
});

await jest.unstable_mockModule("../../models/MilestoneChallenge.js", () => {
  const MockMilestoneChallenge = {
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
  };
  return { default: MockMilestoneChallenge };
});

await jest.unstable_mockModule("../../models/MilestoneSubmission.js", () => {
  const MockMilestoneSubmission = {
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    countDocuments: jest.fn(),
    create: jest.fn(),
  };
  return { default: MockMilestoneSubmission };
});

await jest.unstable_mockModule("../../models/MilestoneProgress.js", () => {
  const MockMilestoneProgress = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    bulkWrite: jest.fn(),
  };
  return { default: MockMilestoneProgress };
});

await jest.unstable_mockModule("../../utils/validators.js", () => ({
  isValidGitHubUrl: jest.fn(),
  isValidUrl: jest.fn(),
  normalizeGitHubUrl: jest.fn(),
}));

const { default: MilestoneCategory } =
  await import("../../models/MilestoneCategory.js");
const { default: MilestoneLevel } =
  await import("../../models/MilestoneLevel.js");
const { default: MilestoneChallenge } =
  await import("../../models/MilestoneChallenge.js");
const { default: MilestoneSubmission } =
  await import("../../models/MilestoneSubmission.js");
const { default: MilestoneProgress } =
  await import("../../models/MilestoneProgress.js");
const { isValidGitHubUrl, isValidUrl, normalizeGitHubUrl } =
  await import("../../utils/validators.js");

const controller = await import("../milestones/milestonesController.js");

const makeRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

const createQueryChain = (result) => {
  const isError = result instanceof Error;
  const then = (resolve, reject) => {
    const p = isError ? Promise.reject(result) : Promise.resolve(result);
    return p.then(resolve, reject);
  };
  const chain = {
    sort: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    then,
  };
  return chain;
};

const createRejectingChain = (errorMessage = "Server error") =>
  createQueryChain(new Error(errorMessage));

describe("listCategories", () => {
  let req, res, consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    req = {};
    res = makeRes();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("returns active categories sorted by order", async () => {
    const categories = [
      { _id: "c1", key: "html", name: "HTML", order: 1 },
      { _id: "c2", key: "css", name: "CSS", order: 2 },
    ];
    MilestoneCategory.find.mockReturnValue(createQueryChain(categories));

    await controller.listCategories(req, res);

    expect(MilestoneCategory.find).toHaveBeenCalledWith({ isActive: true });
    expect(res.json).toHaveBeenCalledWith(categories);
  });

  test("returns empty array when no active categories", async () => {
    MilestoneCategory.find.mockReturnValue(createQueryChain([]));

    await controller.listCategories(req, res);

    expect(res.json).toHaveBeenCalledWith([]);
  });

  test("returns 500 on database error", async () => {
    MilestoneCategory.find.mockReturnValue(createRejectingChain("DB fail"));

    await controller.listCategories(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Failed to fetch categories",
      error: undefined,
    });
  });
});

describe("listLevelsByCategory", () => {
  let req, res, consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    req = { params: { categoryId: "cat1" } };
    res = makeRes();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("returns active levels for a category sorted by levelNumber", async () => {
    const levels = [
      { _id: "lvl1", levelNumber: 1, title: "Basics" },
      { _id: "lvl2", levelNumber: 2, title: "Advanced" },
    ];
    MilestoneLevel.find.mockReturnValue(createQueryChain(levels));

    await controller.listLevelsByCategory(req, res);

    expect(MilestoneLevel.find).toHaveBeenCalledWith({
      categoryId: "cat1",
      isActive: true,
    });
    expect(res.json).toHaveBeenCalledWith(levels);
  });

  test("returns empty array when no levels", async () => {
    MilestoneLevel.find.mockReturnValue(createQueryChain([]));

    await controller.listLevelsByCategory(req, res);

    expect(res.json).toHaveBeenCalledWith([]);
  });

  test("returns 500 on database error", async () => {
    MilestoneLevel.find.mockReturnValue(createRejectingChain("DB fail"));

    await controller.listLevelsByCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Failed to fetch levels",
      error: undefined,
    });
  });
});

describe("listChallengesByLevel", () => {
  let req, res, consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    req = { params: { levelId: "lvl1" } };
    res = makeRes();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("returns active challenges for a level sorted by createdAt", async () => {
    const challenges = [
      { _id: "ch1", title: "First" },
      { _id: "ch2", title: "Second" },
    ];
    MilestoneChallenge.find.mockReturnValue(createQueryChain(challenges));

    await controller.listChallengesByLevel(req, res);

    expect(MilestoneChallenge.find).toHaveBeenCalledWith({
      levelId: "lvl1",
      isActive: true,
    });
    expect(res.json).toHaveBeenCalledWith(challenges);
  });

  test("returns empty array when no challenges", async () => {
    MilestoneChallenge.find.mockReturnValue(createQueryChain([]));

    await controller.listChallengesByLevel(req, res);

    expect(res.json).toHaveBeenCalledWith([]);
  });

  test("returns 500 on database error", async () => {
    MilestoneChallenge.find.mockReturnValue(createRejectingChain("DB fail"));

    await controller.listChallengesByLevel(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Failed to fetch challenges",
      error: undefined,
    });
  });
});

describe("getChallenge", () => {
  let req, res, consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    req = { params: { id: "ch1" } };
    res = makeRes();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("returns an active challenge", async () => {
    const challenge = { _id: "ch1", title: "Build a website", isActive: true };
    MilestoneChallenge.findOne.mockResolvedValue(challenge);

    await controller.getChallenge(req, res);

    expect(MilestoneChallenge.findOne).toHaveBeenCalledWith({
      _id: "ch1",
      isActive: true,
    });
    expect(res.json).toHaveBeenCalledWith(challenge);
  });

  test("returns 404 when challenge not found or inactive", async () => {
    MilestoneChallenge.findOne.mockResolvedValue(null);

    await controller.getChallenge(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Challenge not found" });
  });

  test("returns 500 on database error", async () => {
    MilestoneChallenge.findOne.mockRejectedValue(new Error("DB fail"));

    await controller.getChallenge(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Failed to fetch challenge",
      error: undefined,
    });
  });
});

describe("getMySubmissions", () => {
  let req, res, consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    req = { user: { _id: "user123" } };
    res = makeRes();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("returns submissions for the current user with populated fields", async () => {
    const submissions = [{ _id: "sub1", userId: "user123" }];
    const queryChain = createQueryChain(submissions);
    MilestoneSubmission.find.mockReturnValue(queryChain);

    await controller.getMySubmissions(req, res);

    expect(MilestoneSubmission.find).toHaveBeenCalledWith({
      userId: "user123",
    });
    expect(queryChain.populate).toHaveBeenCalledWith("categoryId", "key name");
    expect(queryChain.populate).toHaveBeenCalledWith(
      "levelId",
      "levelNumber title",
    );
    expect(queryChain.populate).toHaveBeenCalledWith("challengeId", "title");
    expect(queryChain.sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(res.json).toHaveBeenCalledWith(submissions);
  });

  test("returns empty array when no submissions", async () => {
    MilestoneSubmission.find.mockReturnValue(createQueryChain([]));

    await controller.getMySubmissions(req, res);

    expect(res.json).toHaveBeenCalledWith([]);
  });

  test("returns 500 on database error", async () => {
    MilestoneSubmission.find.mockReturnValue(createRejectingChain("DB fail"));

    await controller.getMySubmissions(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Failed to fetch submissions",
      error: undefined,
    });
  });
});

describe("listPublicSubmissions", () => {
  let req, res, consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    req = {};
    res = makeRes();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("returns approved submissions with populated user and challenge info", async () => {
    const submissions = [{ _id: "sub1", status: "approved" }];
    const queryChain = createQueryChain(submissions);
    MilestoneSubmission.find.mockReturnValue(queryChain);

    await controller.listPublicSubmissions(req, res);

    expect(MilestoneSubmission.find).toHaveBeenCalledWith({
      status: "approved",
    });
    expect(queryChain.populate).toHaveBeenCalledWith(
      "userId",
      "username displayName",
    );
    expect(queryChain.populate).toHaveBeenCalledWith("categoryId", "key name");
    expect(queryChain.populate).toHaveBeenCalledWith(
      "levelId",
      "levelNumber title",
    );
    expect(queryChain.populate).toHaveBeenCalledWith("challengeId", "title");
    expect(queryChain.sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(res.json).toHaveBeenCalledWith(submissions);
  });

  test("returns empty array when no approved submissions", async () => {
    MilestoneSubmission.find.mockReturnValue(createQueryChain([]));

    await controller.listPublicSubmissions(req, res);

    expect(res.json).toHaveBeenCalledWith([]);
  });

  test("returns 500 on database error", async () => {
    MilestoneSubmission.find.mockReturnValue(createRejectingChain("DB fail"));

    await controller.listPublicSubmissions(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Failed to fetch submissions",
      error: undefined,
    });
  });
});

describe("createSubmission", () => {
  let req, res, consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    req = {
      user: { _id: "user123" },
      body: {
        challengeId: "ch1",
        repoUrl: "https://github.com/owner/repo",
        demoUrl: "https://demo.example.com",
        notes: "My solution",
      },
    };
    res = makeRes();

    normalizeGitHubUrl.mockImplementation((url) =>
      typeof url === "string" ? url.trim().replace(/\.git$/, "") : "",
    );
    isValidGitHubUrl.mockReturnValue(true);
    isValidUrl.mockReturnValue(true);

    // Challenge exists and is active
    MilestoneChallenge.findById.mockResolvedValue({
      _id: "ch1",
      levelId: "lvl1",
      categoryId: "cat1",
      isActive: true,
    });

    MilestoneChallenge.find.mockReturnValue(
      createQueryChain([{ _id: "ch1" }, { _id: "ch0" }]),
    );

    MilestoneSubmission.findOne.mockResolvedValue(null);
    MilestoneSubmission.countDocuments.mockResolvedValue(0);

    MilestoneLevel.find.mockReturnValue(
      createQueryChain([
        { _id: "lvl1", levelNumber: 1 },
        { _id: "lvl2", levelNumber: 2 },
      ]),
    );
    MilestoneProgress.find.mockReturnValue(createQueryChain([]));
    MilestoneProgress.bulkWrite.mockResolvedValue({});

    MilestoneLevel.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: "lvl1",
        levelNumber: 1,
        categoryId: "cat1",
      }),
    });
    MilestoneProgress.findOneAndUpdate.mockResolvedValue({});

    MilestoneSubmission.create.mockResolvedValue({
      _id: "sub1",
      userId: "user123",
      challengeId: "ch1",
      status: "pending",
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("creates a submission and updates progress", async () => {
    // Arrange: only one challenge for the level (so priorIds empty)
    MilestoneChallenge.find.mockReturnValue(createQueryChain([{ _id: "ch1" }]));

    await controller.createSubmission(req, res);

    expect(normalizeGitHubUrl).toHaveBeenCalledWith(
      "https://github.com/owner/repo",
    );
    expect(MilestoneChallenge.findById).toHaveBeenCalledWith("ch1");
    expect(MilestoneChallenge.find).toHaveBeenCalledWith({
      levelId: "lvl1",
      isActive: true,
    });
    expect(MilestoneSubmission.countDocuments).not.toHaveBeenCalled();
    expect(MilestoneSubmission.findOne).toHaveBeenCalledWith({
      userId: "user123",
      challengeId: "ch1",
    });
    expect(MilestoneSubmission.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user123",
        categoryId: "cat1",
        levelId: "lvl1",
        challengeId: "ch1",
        repoUrl: "https://github.com/owner/repo",
        status: "pending",
      }),
    );
    expect(MilestoneProgress.findOneAndUpdate).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ _id: "sub1", status: "pending" }),
    );
  });

  test("returns 400 when challengeId or repoUrl missing", async () => {
    req.body = { repoUrl: "https://github.com/owner/repo" }; // challengeId missing

    await controller.createSubmission(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Challenge and repo URL are required",
    });
  });

  test("returns 400 when repoUrl is invalid", async () => {
    isValidGitHubUrl.mockReturnValue(false);

    await controller.createSubmission(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid GitHub repo URL",
    });
  });

  test("returns 400 when demoUrl is invalid", async () => {
    isValidUrl.mockReturnValue(false);

    await controller.createSubmission(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid demo URL" });
  });

  test("returns 404 when challenge not found or inactive", async () => {
    MilestoneChallenge.findById.mockResolvedValue(null);

    await controller.createSubmission(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Challenge not found" });
  });

  test("returns 403 when previous challenges are not completed", async () => {
    // Two challenges in level, current challenge is second, priorIds has one
    MilestoneChallenge.find.mockReturnValue(
      createQueryChain([{ _id: "ch0" }, { _id: "ch1" }]), // order: ch0, ch1 => targetIndex=1, priorIds=[ch0]
    );
    MilestoneSubmission.countDocuments.mockResolvedValue(0); // no submissions for prior

    await controller.createSubmission(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "Complete previous challenges in this level first",
    });
  });

  test("returns 400 when submission already exists", async () => {
    MilestoneSubmission.findOne.mockResolvedValue({
      _id: "existing",
      challengeId: "ch1",
    });

    await controller.createSubmission(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Submission already exists for this challenge",
    });
  });

  test("returns 500 when ensureProgressForCategory fails", async () => {
    MilestoneLevel.find.mockReturnValue(
      createRejectingChain("Level find fail"),
    );

    await controller.createSubmission(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Failed to create submission",
      error: undefined,
    });
  });

  test("returns 500 when updateProgressOnSubmission fails (level not found)", async () => {
    MilestoneLevel.findById.mockResolvedValue(null); // level missing -> throws

    await controller.createSubmission(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Failed to create submission",
      error: undefined,
    });
  });

  test("returns 500 when MilestoneSubmission.create fails", async () => {
    MilestoneSubmission.create.mockRejectedValue(new Error("Create fail"));

    await controller.createSubmission(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Failed to create submission",
      error: undefined,
    });
  });
});

describe("updateSubmission", () => {
  let req, res, consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    req = {
      params: { id: "sub1" },
      user: { _id: "user123" },
      body: {
        repoUrl: "https://github.com/owner/new-repo",
        demoUrl: "https://demo.example.com",
        notes: "Updated notes",
      },
    };
    res = makeRes();

    normalizeGitHubUrl.mockImplementation((url) =>
      typeof url === "string" ? url.trim().replace(/\.git$/, "") : "",
    );
    isValidGitHubUrl.mockReturnValue(true);
    isValidUrl.mockReturnValue(true);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("updates submission fields and saves", async () => {
    const submission = {
      _id: "sub1",
      userId: "user123",
      repoUrl: "old",
      demoUrl: "",
      notes: "",
      status: "pending",
      save: jest.fn().mockResolvedValue({
        _id: "sub1",
        repoUrl: "https://github.com/owner/new-repo",
        demoUrl: "https://demo.example.com",
        notes: "Updated notes",
        status: "pending",
      }),
    };
    MilestoneSubmission.findById.mockResolvedValue(submission);

    await controller.updateSubmission(req, res);

    expect(MilestoneSubmission.findById).toHaveBeenCalledWith("sub1");
    expect(submission.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        repoUrl: "https://github.com/owner/new-repo",
        demoUrl: "https://demo.example.com",
        notes: "Updated notes",
      }),
    );
  });

  test("returns 404 when submission not found", async () => {
    MilestoneSubmission.findById.mockResolvedValue(null);

    await controller.updateSubmission(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Submission not found" });
  });

  test("returns 403 when user is not the owner", async () => {
    MilestoneSubmission.findById.mockResolvedValue({
      _id: "sub1",
      userId: "otherUser",
      save: jest.fn(),
    });

    await controller.updateSubmission(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Not authorized" });
  });

  test("returns 400 when submission is already approved", async () => {
    MilestoneSubmission.findById.mockResolvedValue({
      _id: "sub1",
      userId: "user123",
      status: "approved",
      save: jest.fn(),
    });

    await controller.updateSubmission(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Approved submissions cannot be updated",
    });
  });

  test("returns 400 when repoUrl is invalid", async () => {
    isValidGitHubUrl.mockReturnValue(false);
    MilestoneSubmission.findById.mockResolvedValue({
      _id: "sub1",
      userId: "user123",
      status: "pending",
      save: jest.fn(),
    });

    await controller.updateSubmission(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid GitHub repo URL",
    });
  });

  test("returns 400 when demoUrl is invalid", async () => {
    isValidUrl.mockReturnValue(false);
    MilestoneSubmission.findById.mockResolvedValue({
      _id: "sub1",
      userId: "user123",
      status: "pending",
      save: jest.fn(),
    });

    await controller.updateSubmission(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid demo URL" });
  });

  test("returns 500 when save fails", async () => {
    MilestoneSubmission.findById.mockResolvedValue({
      _id: "sub1",
      userId: "user123",
      status: "pending",
      save: jest.fn().mockRejectedValue(new Error("Save fail")),
    });

    await controller.updateSubmission(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Failed to update submission",
      error: undefined,
    });
  });

  test("returns 500 when findById rejects", async () => {
    MilestoneSubmission.findById.mockRejectedValue(new Error("DB fail"));

    await controller.updateSubmission(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Failed to update submission",
      error: undefined,
    });
  });
});

describe("getProgress", () => {
  let req, res, consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    req = { user: { _id: "user123" }, query: {} };
    res = makeRes();

    // Default mocks
    MilestoneCategory.find.mockReturnValue(
      createQueryChain([{ _id: "cat1" }, { _id: "cat2" }]),
    );
    MilestoneLevel.find.mockReturnValue(createQueryChain([])); // no levels -> ensureProgress returns []
    MilestoneProgress.find.mockReturnValue(createQueryChain([]));
    MilestoneProgress.bulkWrite.mockResolvedValue({});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("returns progress for a specific category when categoryId provided", async () => {
    req.query = { categoryId: "cat1" };
    const progressData = [
      { userId: "user123", levelId: "lvl1", status: "unlocked" },
    ];
    // ensureProgressForCategory runs: levels returns some, existing returns none
    MilestoneLevel.find.mockReturnValue(
      createQueryChain([{ _id: "lvl1", levelNumber: 1 }]),
    );
    MilestoneProgress.find
      .mockReturnValueOnce(createQueryChain([])) // for ensureProgress (existing)
      .mockReturnValueOnce(createQueryChain(progressData)); // for final query

    await controller.getProgress(req, res);

    expect(MilestoneLevel.find).toHaveBeenCalledWith({
      categoryId: "cat1",
      isActive: true,
    });
    expect(MilestoneProgress.find).toHaveBeenCalledTimes(2); // once in ensure, once final
    expect(res.json).toHaveBeenCalledWith(progressData);
  });

  test("returns all categories progress when no categoryId", async () => {
    MilestoneProgress.find.mockReturnValue(createQueryChain([]));

    await controller.getProgress(req, res);

    expect(MilestoneCategory.find).toHaveBeenCalledWith({ isActive: true });
    expect(MilestoneLevel.find).toHaveBeenCalledTimes(2);
    expect(MilestoneProgress.find).toHaveBeenCalledTimes(2);
    expect(res.json).toHaveBeenCalledWith([
      { categoryId: "cat1", progress: [] },
      { categoryId: "cat2", progress: [] },
    ]);
  });

  test("returns 500 on database error", async () => {
    MilestoneCategory.find.mockReturnValue(createRejectingChain("DB fail"));

    await controller.getProgress(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Failed to fetch progress",
      error: undefined,
    });
  });
});
