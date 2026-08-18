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
    findById: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };
  return { default: MockMilestoneCategory };
});

await jest.unstable_mockModule("../../models/MilestoneLevel.js", () => {
  const MockMilestoneLevel = {
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };
  return { default: MockMilestoneLevel };
});

await jest.unstable_mockModule("../../models/MilestoneChallenge.js", () => {
  const MockMilestoneChallenge = {
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };
  return { default: MockMilestoneChallenge };
});

await jest.unstable_mockModule("../../models/MilestoneSubmission.js", () => {
  const MockMilestoneSubmission = {
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
    save: jest.fn(),
  };
  return { default: MockMilestoneSubmission };
});

await jest.unstable_mockModule("../../models/MilestoneProgress.js", () => {
  const MockMilestoneProgress = {
    find: jest.fn(),
    findOne: jest.fn(),
    bulkWrite: jest.fn(),
    findOneAndUpdate: jest.fn(),
  };
  return { default: MockMilestoneProgress };
});

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

const controller = await import("../milestones/adminMilestonesController.js");

const makeRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

const createQueryChain = (result) => {
  const then = (resolve, reject) => {
    const p =
      result instanceof Error
        ? Promise.reject(result)
        : Promise.resolve(result);
    return p.then(resolve, reject);
  };
  return {
    sort: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    then,
  };
};

const createRejectingChain = (message = "Server error") =>
  createQueryChain(new Error(message));

const mockChain = (mockFn, result) =>
  mockFn.mockReturnValue(createQueryChain(result));

describe("createCategory", () => {
  let req, res, consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    req = {
      body: {
        key: "html",
        name: "HTML",
        description: "HTML category",
        order: 1,
        isActive: true,
      },
    };
    res = makeRes();
    MilestoneCategory.findOne.mockResolvedValue(null);
    MilestoneCategory.create.mockResolvedValue({
      _id: "cat1",
      key: "html",
      name: "HTML",
      description: "HTML category",
      order: 1,
      isActive: true,
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("creates a new category", async () => {
    await controller.createCategory(req, res);

    expect(MilestoneCategory.findOne).toHaveBeenCalledWith({ key: "html" });
    expect(MilestoneCategory.create).toHaveBeenCalledWith({
      key: "html",
      name: "HTML",
      description: "HTML category",
      order: 1,
      isActive: true,
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ key: "html", name: "HTML" }),
    );
  });

  test("returns 400 when key or name missing", async () => {
    req.body = { key: "html" }; // name missing

    await controller.createCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Key and name are required",
    });
  });

  test("returns 400 when key already exists", async () => {
    MilestoneCategory.findOne.mockResolvedValue({
      _id: "existing",
      key: "html",
    });

    await controller.createCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Category key already exists",
    });
  });

  test("returns 500 on database error", async () => {
    MilestoneCategory.findOne.mockRejectedValue(new Error("DB fail"));

    await controller.createCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Failed to create category",
      error: undefined,
    });
  });
});

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

  test("returns all categories sorted by order", async () => {
    const categories = [
      { _id: "cat1", name: "HTML", order: 1 },
      { _id: "cat2", name: "CSS", order: 2 },
    ];
    mockChain(MilestoneCategory.find, categories);

    await controller.listCategories(req, res);

    expect(MilestoneCategory.find).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(categories);
  });

  test("returns empty array when no categories", async () => {
    mockChain(MilestoneCategory.find, []);

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

describe("getCategory", () => {
  let req, res, consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    req = { params: { id: "cat1" } };
    res = makeRes();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("returns category by id", async () => {
    const category = { _id: "cat1", name: "HTML" };
    MilestoneCategory.findById.mockResolvedValue(category);

    await controller.getCategory(req, res);

    expect(MilestoneCategory.findById).toHaveBeenCalledWith("cat1");
    expect(res.json).toHaveBeenCalledWith(category);
  });

  test("returns 404 when category not found", async () => {
    MilestoneCategory.findById.mockResolvedValue(null);

    await controller.getCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Category not found" });
  });

  test("returns 500 on database error", async () => {
    MilestoneCategory.findById.mockRejectedValue(new Error("DB fail"));

    await controller.getCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Failed to fetch category",
      error: undefined,
    });
  });
});

describe("updateCategory", () => {
  let req, res, consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    req = {
      params: { id: "cat1" },
      body: {
        key: "html",
        name: "HTML Updated",
        description: "Updated desc",
        order: 2,
        isActive: false,
      },
    };
    res = makeRes();

    // Default: category found, no duplicate key, save succeeds
    const category = {
      _id: "cat1",
      key: "old-key",
      name: "Old",
      description: "Old desc",
      order: 0,
      isActive: true,
      save: jest.fn().mockResolvedValue({
        _id: "cat1",
        key: "html",
        name: "HTML Updated",
        description: "Updated desc",
        order: 2,
        isActive: false,
      }),
    };
    MilestoneCategory.findById.mockResolvedValue(category);
    MilestoneCategory.findOne.mockResolvedValue(null);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("updates category and saves", async () => {
    await controller.updateCategory(req, res);

    expect(MilestoneCategory.findById).toHaveBeenCalledWith("cat1");
    // Check that findOne was called when key changed
    expect(MilestoneCategory.findOne).toHaveBeenCalledWith({ key: "html" });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ key: "html", name: "HTML Updated" }),
    );
  });

  test("returns 404 when category not found", async () => {
    MilestoneCategory.findById.mockResolvedValue(null);

    await controller.updateCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Category not found" });
  });

  test("returns 400 when new key already exists", async () => {
    MilestoneCategory.findOne.mockResolvedValue({ _id: "other", key: "html" });

    await controller.updateCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Category key already exists",
    });
  });

  test("returns 500 on save error", async () => {
    const category = {
      _id: "cat1",
      key: "old-key",
      name: "Old",
      description: "Old desc",
      order: 0,
      isActive: true,
      save: jest.fn().mockRejectedValue(new Error("Save fail")),
    };
    MilestoneCategory.findById.mockResolvedValue(category);

    await controller.updateCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Failed to update category",
      error: undefined,
    });
  });
});

describe("deleteCategory", () => {
  let req, res, consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    req = { params: { id: "cat1" } };
    res = makeRes();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("deletes category when no levels exist", async () => {
    MilestoneCategory.findById.mockResolvedValue({
      _id: "cat1",
      name: "HTML",
    });
    MilestoneLevel.countDocuments.mockResolvedValue(0);
    MilestoneCategory.findByIdAndDelete.mockResolvedValue({});

    await controller.deleteCategory(req, res);

    expect(MilestoneCategory.findById).toHaveBeenCalledWith("cat1");
    expect(MilestoneLevel.countDocuments).toHaveBeenCalledWith({
      categoryId: "cat1",
    });
    expect(MilestoneCategory.findByIdAndDelete).toHaveBeenCalledWith("cat1");
    expect(res.json).toHaveBeenCalledWith({ message: "Category deleted" });
  });

  test("returns 404 when category not found", async () => {
    MilestoneCategory.findById.mockResolvedValue(null);

    await controller.deleteCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Category not found" });
  });

  test("returns 400 when category has levels", async () => {
    MilestoneCategory.findById.mockResolvedValue({ _id: "cat1" });
    MilestoneLevel.countDocuments.mockResolvedValue(3);

    await controller.deleteCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Cannot delete category with levels",
    });
  });

  test("returns 500 on database error", async () => {
    MilestoneCategory.findById.mockRejectedValue(new Error("DB fail"));

    await controller.deleteCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Failed to delete category",
      error: undefined,
    });
  });
});

describe("createLevel", () => {
  let req, res, consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    req = {
      body: {
        categoryId: "cat1",
        levelNumber: 1,
        title: "Level 1",
        description: "Basics",
        isActive: true,
      },
    };
    res = makeRes();

    MilestoneCategory.findById.mockResolvedValue({ _id: "cat1" });
    MilestoneLevel.findOne.mockResolvedValue(null);
    MilestoneLevel.create.mockResolvedValue({
      _id: "lvl1",
      categoryId: "cat1",
      levelNumber: 1,
      title: "Level 1",
      description: "Basics",
      isActive: true,
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("creates a new level", async () => {
    await controller.createLevel(req, res);

    expect(MilestoneCategory.findById).toHaveBeenCalledWith("cat1");
    expect(MilestoneLevel.findOne).toHaveBeenCalledWith({
      categoryId: "cat1",
      levelNumber: 1,
    });
    expect(MilestoneLevel.create).toHaveBeenCalledWith({
      categoryId: "cat1",
      levelNumber: 1,
      title: "Level 1",
      description: "Basics",
      isActive: true,
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ levelNumber: 1, title: "Level 1" }),
    );
  });

  test("returns 400 when required fields missing", async () => {
    req.body = { categoryId: "cat1", levelNumber: 1 }; // title missing

    await controller.createLevel(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Category, level number, and title are required",
    });
  });

  test("returns 404 when category not found", async () => {
    MilestoneCategory.findById.mockResolvedValue(null);

    await controller.createLevel(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Category not found" });
  });

  test("returns 400 when level number already exists", async () => {
    MilestoneLevel.findOne.mockResolvedValue({ _id: "existing" });

    await controller.createLevel(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Level already exists" });
  });

  test("returns 500 on database error", async () => {
    MilestoneCategory.findById.mockRejectedValue(new Error("DB fail"));

    await controller.createLevel(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Failed to create level",
      error: undefined,
    });
  });
});

describe("listLevels", () => {
  let req, res, consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    req = { query: {} };
    res = makeRes();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("returns all levels (no filter)", async () => {
    const levels = [
      { _id: "lvl1", levelNumber: 1 },
      { _id: "lvl2", levelNumber: 2 },
    ];
    mockChain(MilestoneLevel.find, levels);

    await controller.listLevels(req, res);

    expect(MilestoneLevel.find).toHaveBeenCalledWith({});
    expect(res.json).toHaveBeenCalledWith(levels);
  });

  test("filters by categoryId when provided", async () => {
    req.query.categoryId = "cat1";
    mockChain(MilestoneLevel.find, []);

    await controller.listLevels(req, res);

    expect(MilestoneLevel.find).toHaveBeenCalledWith({ categoryId: "cat1" });
  });

  test("returns 500 on database error", async () => {
    MilestoneLevel.find.mockReturnValue(createRejectingChain("DB fail"));

    await controller.listLevels(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Failed to fetch levels",
      error: undefined,
    });
  });
});

describe("getLevel", () => {
  let req, res, consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    req = { params: { id: "lvl1" } };
    res = makeRes();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("returns level by id", async () => {
    const level = { _id: "lvl1", levelNumber: 1 };
    MilestoneLevel.findById.mockResolvedValue(level);

    await controller.getLevel(req, res);

    expect(res.json).toHaveBeenCalledWith(level);
  });

  test("returns 404 when level not found", async () => {
    MilestoneLevel.findById.mockResolvedValue(null);

    await controller.getLevel(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Level not found" });
  });

  test("returns 500 on database error", async () => {
    MilestoneLevel.findById.mockRejectedValue(new Error("DB fail"));

    await controller.getLevel(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Failed to fetch level",
      error: undefined,
    });
  });
});

describe("updateLevel", () => {
  let req, res, consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    req = {
      params: { id: "lvl1" },
      body: {
        levelNumber: 2,
        title: "Updated",
        description: "New desc",
        isActive: false,
      },
    };
    res = makeRes();

    const level = {
      _id: "lvl1",
      categoryId: "cat1",
      levelNumber: 1,
      title: "Old",
      description: "Old desc",
      isActive: true,
      save: jest.fn().mockResolvedValue({
        _id: "lvl1",
        categoryId: "cat1",
        levelNumber: 2,
        title: "Updated",
        description: "New desc",
        isActive: false,
      }),
    };
    MilestoneLevel.findById.mockResolvedValue(level);
    MilestoneLevel.findOne.mockResolvedValue(null);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("updates level and saves", async () => {
    await controller.updateLevel(req, res);

    expect(MilestoneLevel.findById).toHaveBeenCalledWith("lvl1");
    expect(MilestoneLevel.findOne).toHaveBeenCalledWith({
      categoryId: "cat1",
      levelNumber: 2,
    });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ levelNumber: 2, title: "Updated" }),
    );
  });

  test("returns 404 when level not found", async () => {
    MilestoneLevel.findById.mockResolvedValue(null);

    await controller.updateLevel(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Level not found" });
  });

  test("returns 400 when new level number already exists", async () => {
    MilestoneLevel.findOne.mockResolvedValue({ _id: "other" });

    await controller.updateLevel(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Level number already exists",
    });
  });

  test("returns 500 on save error", async () => {
    const level = {
      _id: "lvl1",
      categoryId: "cat1",
      levelNumber: 1,
      title: "Old",
      description: "Old desc",
      isActive: true,
      save: jest.fn().mockRejectedValue(new Error("Save fail")),
    };
    MilestoneLevel.findById.mockResolvedValue(level);

    await controller.updateLevel(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Failed to update level",
      error: undefined,
    });
  });
});

describe("deleteLevel", () => {
  let req, res, consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    req = { params: { id: "lvl1" } };
    res = makeRes();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("deletes level when no challenges/submissions", async () => {
    MilestoneLevel.findById.mockResolvedValue({ _id: "lvl1" });
    MilestoneChallenge.countDocuments.mockResolvedValue(0);
    MilestoneSubmission.countDocuments.mockResolvedValue(0);
    MilestoneLevel.findByIdAndDelete.mockResolvedValue({});

    await controller.deleteLevel(req, res);

    expect(MilestoneChallenge.countDocuments).toHaveBeenCalledWith({
      levelId: "lvl1",
    });
    expect(MilestoneSubmission.countDocuments).toHaveBeenCalledWith({
      levelId: "lvl1",
    });
    expect(MilestoneLevel.findByIdAndDelete).toHaveBeenCalledWith("lvl1");
    expect(res.json).toHaveBeenCalledWith({ message: "Level deleted" });
  });

  test("returns 404 when level not found", async () => {
    MilestoneLevel.findById.mockResolvedValue(null);

    await controller.deleteLevel(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Level not found" });
  });

  test("returns 400 when level has challenges", async () => {
    MilestoneLevel.findById.mockResolvedValue({ _id: "lvl1" });
    MilestoneChallenge.countDocuments.mockResolvedValue(2);

    await controller.deleteLevel(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Cannot delete level with challenges",
    });
  });

  test("returns 400 when level has submissions", async () => {
    MilestoneLevel.findById.mockResolvedValue({ _id: "lvl1" });
    MilestoneChallenge.countDocuments.mockResolvedValue(0);
    MilestoneSubmission.countDocuments.mockResolvedValue(1);

    await controller.deleteLevel(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Cannot delete level with submissions",
    });
  });

  test("returns 500 on database error", async () => {
    MilestoneLevel.findById.mockRejectedValue(new Error("DB fail"));

    await controller.deleteLevel(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Failed to delete level",
      error: undefined,
    });
  });
});

describe("createChallenge", () => {
  let req, res, consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    req = {
      body: {
        categoryId: "cat1",
        levelId: "lvl1",
        title: "Build a page",
        description: "Desc",
        requirements: ["html"],
        resources: ["url"],
        tags: ["html"],
        difficulty: "intermediate",
        isActive: true,
      },
    };
    res = makeRes();

    MilestoneLevel.findById.mockResolvedValue({
      _id: "lvl1",
      categoryId: "cat1",
    });
    MilestoneChallenge.create.mockResolvedValue({
      _id: "ch1",
      categoryId: "cat1",
      levelId: "lvl1",
      title: "Build a page",
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("creates a new challenge", async () => {
    await controller.createChallenge(req, res);

    expect(MilestoneLevel.findById).toHaveBeenCalledWith("lvl1");
    expect(MilestoneChallenge.create).toHaveBeenCalledWith({
      categoryId: "cat1",
      levelId: "lvl1",
      title: "Build a page",
      description: "Desc",
      requirements: ["html"],
      resources: ["url"],
      tags: ["html"],
      difficulty: "intermediate",
      isActive: true,
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Build a page" }),
    );
  });

  test("returns 400 when required fields missing", async () => {
    req.body = { categoryId: "cat1", levelId: "lvl1" }; // title missing

    await controller.createChallenge(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Category, level, and title are required",
    });
  });

  test("returns 404 when level not found", async () => {
    MilestoneLevel.findById.mockResolvedValue(null);

    await controller.createChallenge(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Level not found" });
  });

  test("returns 400 when level does not belong to category", async () => {
    MilestoneLevel.findById.mockResolvedValue({
      _id: "lvl1",
      categoryId: "differentCat",
    });

    await controller.createChallenge(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Level does not belong to category",
    });
  });

  test("returns 500 on database error", async () => {
    MilestoneLevel.findById.mockRejectedValue(new Error("DB fail"));

    await controller.createChallenge(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Failed to create challenge",
      error: undefined,
    });
  });
});

describe("listChallenges", () => {
  let req, res, consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    req = { query: {} };
    res = makeRes();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("returns all challenges without filters", async () => {
    const challenges = [{ _id: "ch1" }, { _id: "ch2" }];
    mockChain(MilestoneChallenge.find, challenges);

    await controller.listChallenges(req, res);

    expect(MilestoneChallenge.find).toHaveBeenCalledWith({});
    expect(res.json).toHaveBeenCalledWith(challenges);
  });

  test("applies categoryId and levelId filters", async () => {
    req.query.categoryId = "cat1";
    req.query.levelId = "lvl1";
    mockChain(MilestoneChallenge.find, []);

    await controller.listChallenges(req, res);

    expect(MilestoneChallenge.find).toHaveBeenCalledWith({
      categoryId: "cat1",
      levelId: "lvl1",
    });
  });

  test("returns 500 on database error", async () => {
    MilestoneChallenge.find.mockReturnValue(createRejectingChain("DB fail"));

    await controller.listChallenges(req, res);

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

  test("returns challenge by id", async () => {
    const challenge = { _id: "ch1", title: "Build" };
    MilestoneChallenge.findById.mockResolvedValue(challenge);

    await controller.getChallenge(req, res);

    expect(res.json).toHaveBeenCalledWith(challenge);
  });

  test("returns 404 when challenge not found", async () => {
    MilestoneChallenge.findById.mockResolvedValue(null);

    await controller.getChallenge(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Challenge not found" });
  });

  test("returns 500 on database error", async () => {
    MilestoneChallenge.findById.mockRejectedValue(new Error("DB fail"));

    await controller.getChallenge(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Failed to fetch challenge",
      error: undefined,
    });
  });
});

describe("updateChallenge", () => {
  let req, res, consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    req = {
      params: { id: "ch1" },
      body: {
        title: "Updated",
        description: "New desc",
        requirements: ["html"],
        resources: [],
        tags: ["css"],
        difficulty: "advanced",
        isActive: false,
      },
    };
    res = makeRes();

    const challenge = {
      _id: "ch1",
      title: "Old",
      description: "Old desc",
      requirements: [],
      resources: [],
      tags: [],
      difficulty: "beginner",
      isActive: true,
      save: jest.fn().mockResolvedValue({
        _id: "ch1",
        title: "Updated",
        description: "New desc",
        requirements: ["html"],
        resources: [],
        tags: ["css"],
        difficulty: "advanced",
        isActive: false,
      }),
    };
    MilestoneChallenge.findById.mockResolvedValue(challenge);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("updates challenge and saves", async () => {
    await controller.updateChallenge(req, res);

    expect(MilestoneChallenge.findById).toHaveBeenCalledWith("ch1");
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Updated", difficulty: "advanced" }),
    );
  });

  test("returns 404 when challenge not found", async () => {
    MilestoneChallenge.findById.mockResolvedValue(null);

    await controller.updateChallenge(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Challenge not found" });
  });

  test("returns 500 on save error", async () => {
    const challenge = {
      _id: "ch1",
      title: "Old",
      description: "Old desc",
      requirements: [],
      resources: [],
      tags: [],
      difficulty: "beginner",
      isActive: true,
      save: jest.fn().mockRejectedValue(new Error("Save fail")),
    };
    MilestoneChallenge.findById.mockResolvedValue(challenge);

    await controller.updateChallenge(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Failed to update challenge",
      error: undefined,
    });
  });
});

describe("deleteChallenge", () => {
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

  test("deletes challenge when no submissions", async () => {
    MilestoneChallenge.findById.mockResolvedValue({ _id: "ch1" });
    MilestoneSubmission.countDocuments.mockResolvedValue(0);
    MilestoneChallenge.findByIdAndDelete.mockResolvedValue({});

    await controller.deleteChallenge(req, res);

    expect(MilestoneSubmission.countDocuments).toHaveBeenCalledWith({
      challengeId: "ch1",
    });
    expect(MilestoneChallenge.findByIdAndDelete).toHaveBeenCalledWith("ch1");
    expect(res.json).toHaveBeenCalledWith({ message: "Challenge deleted" });
  });

  test("returns 404 when challenge not found", async () => {
    MilestoneChallenge.findById.mockResolvedValue(null);

    await controller.deleteChallenge(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Challenge not found" });
  });

  test("returns 400 when challenge has submissions", async () => {
    MilestoneChallenge.findById.mockResolvedValue({ _id: "ch1" });
    MilestoneSubmission.countDocuments.mockResolvedValue(1);

    await controller.deleteChallenge(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Cannot delete challenge with submissions",
    });
  });

  test("returns 500 on database error", async () => {
    MilestoneChallenge.findById.mockRejectedValue(new Error("DB fail"));

    await controller.deleteChallenge(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Failed to delete challenge",
      error: undefined,
    });
  });
});

describe("listSubmissions", () => {
  let req, res, consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    req = { query: {} };
    res = makeRes();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("returns all submissions without filters", async () => {
    const submissions = [{ _id: "sub1" }];
    mockChain(MilestoneSubmission.find, submissions);

    await controller.listSubmissions(req, res);

    expect(MilestoneSubmission.find).toHaveBeenCalledWith({});
    expect(res.json).toHaveBeenCalledWith(submissions);
  });

  test("applies all filters", async () => {
    req.query = {
      status: "approved",
      categoryId: "cat1",
      levelId: "lvl1",
      challengeId: "ch1",
      userId: "user1",
    };
    mockChain(MilestoneSubmission.find, []);

    await controller.listSubmissions(req, res);

    expect(MilestoneSubmission.find).toHaveBeenCalledWith({
      status: "approved",
      categoryId: "cat1",
      levelId: "lvl1",
      challengeId: "ch1",
      userId: "user1",
    });
  });

  test("returns 500 on database error", async () => {
    MilestoneSubmission.find.mockReturnValue(createRejectingChain("DB fail"));

    await controller.listSubmissions(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Failed to fetch submissions",
      error: undefined,
    });
  });
});

describe("getSubmission", () => {
  let req, res, consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    req = { params: { id: "sub1" } };
    res = makeRes();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("returns submission by id with populated fields", async () => {
    const submission = { _id: "sub1", userId: {} };
    const queryChain = createQueryChain(submission);
    MilestoneSubmission.findById.mockReturnValue(queryChain);

    await controller.getSubmission(req, res);

    expect(MilestoneSubmission.findById).toHaveBeenCalledWith("sub1");
    // Verify population calls
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
    expect(res.json).toHaveBeenCalledWith(submission);
  });

  test("returns 404 when submission not found", async () => {
    mockChain(MilestoneSubmission.findById, null);

    await controller.getSubmission(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Submission not found" });
  });

  test("returns 500 on database error", async () => {
    MilestoneSubmission.findById.mockReturnValue(
      createRejectingChain("DB fail"),
    );

    await controller.getSubmission(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Failed to fetch submission",
      error: undefined,
    });
  });
});

describe("updateSubmissionStatus", () => {
  let req, res, consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    req = {
      params: { id: "sub1" },
      body: {
        status: "approved",
        reviewerNotes: "Great work",
      },
    };
    res = makeRes();

    const submission = {
      _id: "sub1",
      status: "pending",
      reviewerNotes: "",
      save: jest.fn().mockResolvedValue({
        _id: "sub1",
        status: "approved",
        reviewerNotes: "Great work",
      }),
    };
    MilestoneSubmission.findById.mockResolvedValue(submission);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("updates status and reviewer notes", async () => {
    await controller.updateSubmissionStatus(req, res);

    expect(MilestoneSubmission.findById).toHaveBeenCalledWith("sub1");
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "approved",
        reviewerNotes: "Great work",
      }),
    );
  });

  test("returns 400 when status is invalid", async () => {
    req.body.status = "invalid";

    await controller.updateSubmissionStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid status" });
  });

  test("returns 404 when submission not found", async () => {
    MilestoneSubmission.findById.mockResolvedValue(null);

    await controller.updateSubmissionStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Submission not found" });
  });

  test("returns 500 on save error", async () => {
    const submission = {
      _id: "sub1",
      status: "pending",
      reviewerNotes: "",
      save: jest.fn().mockRejectedValue(new Error("Save fail")),
    };
    MilestoneSubmission.findById.mockResolvedValue(submission);

    await controller.updateSubmissionStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Failed to update submission status",
      error: undefined,
    });
  });
});
