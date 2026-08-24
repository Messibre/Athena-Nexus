import {
  describe,
  expect,
  jest,
  test,
  beforeEach,
  afterEach,
} from "@jest/globals";

// Mock Feedback model
await jest.unstable_mockModule("../../models/Feedback.js", () => {
  const MockFeedback = {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
  };
  return { default: MockFeedback };
});

const { default: Feedback } = await import("../../models/Feedback.js");
const controller = await import("../feedbackController.js");

const makeRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

// Helper to create a fake feedback document with _id.toString()
const makeFeedbackDoc = (overrides = {}) => ({
  _id: {
    toString: jest.fn().mockReturnValue("fb123"),
  },
  category: "bug",
  message: "Test message",
  email: "user@example.com",
  pageUrl: "https://example.com/page",
  userAgent: "Mozilla/5.0",
  status: "new",
  save: jest.fn().mockResolvedValue(this),
  ...overrides,
});

describe("createFeedback", () => {
  let req, res;
  let consoleLogSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    req = {
      body: {
        category: "bug",
        message: "This is a bug report",
        email: "User@Example.com",
      },
      get: jest.fn((header) => {
        if (header === "referer") return "https://example.com/page";
        if (header === "user-agent") return "Mozilla/5.0";
        return "";
      }),
    };
    res = makeRes();

    // Default successful feedback creation
    Feedback.create.mockResolvedValue(
      makeFeedbackDoc({
        category: "bug",
        message: "This is a bug report",
        email: "user@example.com",
        pageUrl: "https://example.com/page",
        userAgent: "Mozilla/5.0",
      }),
    );
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  test("creates feedback successfully", async () => {
    await controller.createFeedback(req, res);

    expect(Feedback.create).toHaveBeenCalledWith({
      category: "bug",
      message: "This is a bug report",
      email: "user@example.com",
      pageUrl: "https://example.com/page",
      userAgent: "Mozilla/5.0",
    });
    expect(consoleLogSpy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: "Thanks for the feedback. It has been sent anonymously.",
    });
  });

  test("returns 400 when category is missing", async () => {
    req.body.category = "";
    await controller.createFeedback(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Category and message are required",
    });
  });

  test("returns 400 when message is missing", async () => {
    req.body.message = "";
    await controller.createFeedback(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Category and message are required",
    });
  });

  test("returns 400 when category is invalid", async () => {
    req.body.category = "invalid";
    await controller.createFeedback(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid feedback category",
    });
  });

  test("returns 400 when message is empty after trim", async () => {
    req.body.message = "   ";
    await controller.createFeedback(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Message is required",
    });
  });

  test("returns 400 when message exceeds 1000 characters", async () => {
    req.body.message = "a".repeat(1001);
    await controller.createFeedback(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Message must be 1000 characters or less",
    });
  });

  test("returns 400 when email is invalid", async () => {
    req.body.email = "invalid-email";
    await controller.createFeedback(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid email address",
    });
  });

  test("accepts empty email and lowercases valid email", async () => {
    req.body.email = "  USER@Example.COM  ";
    await controller.createFeedback(req, res);
    expect(Feedback.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: "user@example.com" }),
    );
  });

  test("handles missing referer and user-agent headers", async () => {
    req.get.mockReturnValue("");
    await controller.createFeedback(req, res);
    expect(Feedback.create).toHaveBeenCalledWith(
      expect.objectContaining({ pageUrl: "", userAgent: "" }),
    );
  });

  test("returns 500 when Feedback.create rejects", async () => {
    Feedback.create.mockRejectedValue(new Error("DB error"));
    await controller.createFeedback(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Server error" });
  });
});

describe("listFeedback", () => {
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

  test("returns all feedback with default sorting", async () => {
    const feedbackList = [
      makeFeedbackDoc({ _id: { toString: () => "1" } }),
      makeFeedbackDoc({ _id: { toString: () => "2" } }),
    ];
    Feedback.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue(feedbackList),
    });

    await controller.listFeedback(req, res);

    expect(Feedback.find).toHaveBeenCalledWith({});
    expect(res.json).toHaveBeenCalledWith(feedbackList);
  });

  test("applies category and status filters", async () => {
    req.query = { category: "bug", status: "new" };
    Feedback.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([]),
    });

    await controller.listFeedback(req, res);

    expect(Feedback.find).toHaveBeenCalledWith({
      category: "bug",
      status: "new",
    });
  });

  test("sorts ascending when order=asc", async () => {
    req.query = { order: "asc", sortBy: "createdAt" };
    const sortMock = jest.fn().mockResolvedValue([]);
    Feedback.find.mockReturnValue({ sort: sortMock });

    await controller.listFeedback(req, res);

    expect(sortMock).toHaveBeenCalledWith({ createdAt: 1 });
  });

  test("sorts descending by default", async () => {
    const sortMock = jest.fn().mockResolvedValue([]);
    Feedback.find.mockReturnValue({ sort: sortMock });

    await controller.listFeedback(req, res);

    expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
  });

  test("returns 500 when Feedback.find rejects", async () => {
    Feedback.find.mockReturnValue({
      sort: jest.fn().mockRejectedValue(new Error("DB error")),
    });

    await controller.listFeedback(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Server error" });
  });
});

describe("updateFeedbackStatus", () => {
  let req, res;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    req = {
      params: { id: "fb123" },
      body: { status: "read" },
    };
    res = makeRes();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("updates status successfully", async () => {
    const feedback = makeFeedbackDoc({ status: "new" });
    Feedback.findById.mockResolvedValue(feedback);

    await controller.updateFeedbackStatus(req, res);

    expect(Feedback.findById).toHaveBeenCalledWith("fb123");
    expect(feedback.status).toBe("read");
    expect(feedback.save).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(feedback);
  });

  test("returns 400 when status is invalid", async () => {
    req.body.status = "invalid";
    await controller.updateFeedbackStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid feedback status",
    });
  });

  test("returns 404 when feedback not found", async () => {
    Feedback.findById.mockResolvedValue(null);
    await controller.updateFeedbackStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Feedback not found" });
  });

  test("returns 500 when save fails", async () => {
    const feedback = makeFeedbackDoc({ status: "new" });
    feedback.save.mockRejectedValue(new Error("DB error"));
    Feedback.findById.mockResolvedValue(feedback);

    await controller.updateFeedbackStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Server error" });
  });
});
