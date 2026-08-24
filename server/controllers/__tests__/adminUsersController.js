import {
  describe,
  expect,
  jest,
  test,
  beforeEach,
  afterEach,
} from "@jest/globals";

// Mock validators
await jest.unstable_mockModule("../../utils/validators.js", () => ({
  isValidPassword: jest.fn().mockReturnValue(true),
  isValidUrl: jest.fn().mockReturnValue(true),
}));

// Mock User model
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

// Mock Submission model (used only for deleteUser check)
await jest.unstable_mockModule("../../models/Submission.js", () => {
  const MockSubmission = {
    find: jest.fn().mockResolvedValue([]),
  };
  return { default: MockSubmission };
});

const { default: User } = await import("../../models/User.js");
const { default: Submission } = await import("../../models/Submission.js");
const { isValidPassword, isValidUrl } =
  await import("../../utils/validators.js");
const controller = await import("../adminController.js");

const makeRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

describe("createUser", () => {
  let req, res, mockUserInstance;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    mockUserInstance = {
      _id: "u123",
      username: "newuser",
      password_hash: "ValidPass123",
      email: "user@example.com",
      role: "member",
      displayName: "New User",
      members: [{ name: "Member1" }],
      contactEmail: "user@example.com",
      save: jest.fn().mockResolvedValue(mockUserInstance),
    };

    User.mockImplementation((data) => {
      Object.assign(mockUserInstance, data);
      return mockUserInstance;
    });

    User.findOne.mockResolvedValue(null);
    isValidPassword.mockReturnValue(true);

    req = {
      body: {
        username: "newuser",
        password: "ValidPass123",
        email: "user@example.com",
        displayName: "New User",
        members: [{ name: "Member1" }],
        contactEmail: "user@example.com",
      },
    };
    res = makeRes();
  });
  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("creates a new user", async () => {
    await controller.createUser(req, res);

    expect(isValidPassword).toHaveBeenCalledWith("ValidPass123");
    expect(User.findOne).toHaveBeenCalledWith({ username: "newuser" });
    expect(User).toHaveBeenCalledWith({
      username: "newuser",
      password_hash: "ValidPass123",
      email: "user@example.com",
      role: "member",
      displayName: "New User",
      members: [{ name: "Member1" }],
      contactEmail: "user@example.com",
    });
    expect(mockUserInstance.save).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      id: "u123",
      username: "newuser",
      displayName: "New User",
      message: "Group created successfully",
    });
  });

  test("returns 400 when username or password missing", async () => {
    req.body.username = "";
    await controller.createUser(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Username and password are required",
    });
  });

  test("returns 400 when password invalid", async () => {
    isValidPassword.mockReturnValue(false);
    await controller.createUser(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message:
        "Password must be at least 8 characters and contain both letters and numbers",
    });
  });

  test("returns 400 when username already exists", async () => {
    User.findOne.mockResolvedValue({ _id: "existing" });
    await controller.createUser(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Username already exists",
    });
  });

  test("returns 500 on database error", async () => {
    mockUserInstance.save.mockRejectedValue(new Error("DB error"));
    await controller.createUser(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Server error" });
  });
});

describe("getUsers", () => {
  let req, res;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    req = {};
    res = makeRes();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });
  test("returns list of member users", async () => {
    const users = [{ _id: "u1", username: "user1" }];
    User.find.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue(users),
    });

    await controller.getUsers(req, res);

    expect(User.find).toHaveBeenCalledWith({ role: "member" });
    expect(res.json).toHaveBeenCalledWith(users);
  });

  test("returns empty array when no users", async () => {
    User.find.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue([]),
    });

    await controller.getUsers(req, res);

    expect(res.json).toHaveBeenCalledWith([]);
  });

  test("returns 500 on database error", async () => {
    User.find.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockRejectedValue(new Error("DB error")),
    });

    await controller.getUsers(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Server error" });
  });
});

describe("updateUser", () => {
  let req, res, mockUserInstance;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    mockUserInstance = {
      _id: "u123",
      username: "user1",
      displayName: "Original",
      email: "old@example.com",
      members: [],
      contactEmail: "",
      profileImageUrl: "",
      coverImageUrl: "",
      headline: "",
      bio: "",
      location: "",
      socialLinks: {},
      save: jest.fn().mockResolvedValue(mockUserInstance),
    };

    User.findById.mockResolvedValue(mockUserInstance);

    req = {
      params: { id: "u123" },
      user: { _id: "u123", role: "member" }, // self
      body: {
        displayName: "Updated",
        socialLinks: { github: "https://github.com/user" },
      },
    };
    res = makeRes();
    isValidUrl.mockReturnValue(true);
  });
  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });
  test("updates user when self", async () => {
    await controller.updateUser(req, res);

    expect(User.findById).toHaveBeenCalledWith("u123");
    expect(mockUserInstance.save).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      id: "u123",
      username: "user1",
      displayName: "Updated",
      members: [],
      email: "old@example.com",
      contactEmail: "",
      profileImageUrl: "",
      coverImageUrl: "",
      headline: "",
      bio: "",
      location: "",
      socialLinks: {
        website: "",
        github: "https://github.com/user",
        linkedin: "",
        x: "",
        instagram: "",
      },
    });
  });

  test("allows admin to update another user", async () => {
    req.params.id = "u456";
    req.user = { _id: "admin1", role: "admin" };
    mockUserInstance._id = "u456";
    await controller.updateUser(req, res);

    expect(User.findById).toHaveBeenCalledWith("u456");
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ id: "u456" }),
    );
  });

  test("returns 403 for non-admin, non-self", async () => {
    req.params.id = "u456";
    req.user = { _id: "u789", role: "member" };
    await controller.updateUser(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "Not authorized to update this user",
    });
  });

  test("returns 400 when invalid profileImageUrl", async () => {
    req.body.profileImageUrl = "not-a-url";
    isValidUrl.mockReturnValue(false);
    await controller.updateUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid profileImageUrl",
    });
  });

  test("returns 400 when socialLinks is not an object", async () => {
    req.body.socialLinks = "not-an-object";
    await controller.updateUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid social links" });
  });

  test("returns 400 when social link URL invalid", async () => {
    req.body.socialLinks = { github: "invalid" };
    isValidUrl.mockReturnValue(false);
    await controller.updateUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid social link: github",
    });
  });

  test("clears social links when null provided", async () => {
    req.body.socialLinks = null;
    await controller.updateUser(req, res);

    expect(mockUserInstance.socialLinks).toEqual({
      website: "",
      github: "",
      linkedin: "",
      x: "",
      instagram: "",
    });
  });

  test("returns 404 when user not found", async () => {
    User.findById.mockResolvedValue(null);
    await controller.updateUser(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
  });

  test("returns 500 on save error", async () => {
    mockUserInstance.save.mockRejectedValue(new Error("DB error"));
    await controller.updateUser(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Server error" });
  });
});

describe("resetUserPassword", () => {
  let req, res, mockUserInstance;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    mockUserInstance = {
      _id: "u123",
      save: jest.fn().mockResolvedValue(mockUserInstance),
    };
    User.findById.mockResolvedValue(mockUserInstance);
    isValidPassword.mockReturnValue(true);

    req = {
      params: { id: "u123" },
      body: { newPassword: "NewPass123" },
    };
    res = makeRes();
  });
  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });
  test("resets password successfully", async () => {
    await controller.resetUserPassword(req, res);

    expect(User.findById).toHaveBeenCalledWith("u123");
    expect(mockUserInstance.password_hash).toBe("NewPass123");
    expect(mockUserInstance.save).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      message: "Password reset successfully",
    });
  });

  test("returns 404 when user not found", async () => {
    User.findById.mockResolvedValue(null);
    await controller.resetUserPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
  });

  test("returns 400 when new password invalid", async () => {
    isValidPassword.mockReturnValue(false);
    await controller.resetUserPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Valid password is required (8+ chars, letters + numbers)",
    });
  });

  test("returns 500 on save error", async () => {
    mockUserInstance.save.mockRejectedValue(new Error("DB error"));
    await controller.resetUserPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Server error" });
  });
});

describe("deleteUser", () => {
  let req, res, mockUserInstance;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    mockUserInstance = { _id: "u123" };
    User.findById.mockResolvedValue(mockUserInstance);
    Submission.find.mockResolvedValue([]);
    User.findByIdAndDelete.mockResolvedValue({});

    req = { params: { id: "u123" } };
    res = makeRes();
  });
  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });
  test("deletes user with no submissions", async () => {
    await controller.deleteUser(req, res);

    expect(User.findById).toHaveBeenCalledWith("u123");
    expect(Submission.find).toHaveBeenCalledWith({ user_id: "u123" });
    expect(User.findByIdAndDelete).toHaveBeenCalledWith("u123");
    expect(res.json).toHaveBeenCalledWith({
      message: "User deleted successfully",
    });
  });

  test("returns 404 when user not found", async () => {
    User.findById.mockResolvedValue(null);
    await controller.deleteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
  });

  test("returns 400 when user has submissions", async () => {
    Submission.find.mockResolvedValue([{ _id: "sub1" }]);
    await controller.deleteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Cannot delete user with existing submissions",
    });
  });

  test("returns 500 on database error", async () => {
    User.findById.mockRejectedValue(new Error("DB error"));
    await controller.deleteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Server error" });
  });
});
