import {
  login,
  signup,
  logout,
  refresh,
  getMe,
  changePassword,
} from "../authApi";
import api from "../axios";

jest.mock("../axios", () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
}));

describe("authApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("login calls POST /api/auth/login with payload and skipAuthRedirect", () => {
    const payload = { username: "test", password: "Pass123" };
    login(payload);
    expect(api.post).toHaveBeenCalledWith("/api/auth/login", payload, {
      skipAuthRedirect: true,
    });
  });

  test("signup calls POST /api/auth/signup with payload and skipAuthRedirect", () => {
    const payload = { username: "new", password: "Pass123" };
    signup(payload);
    expect(api.post).toHaveBeenCalledWith("/api/auth/signup", payload, {
      skipAuthRedirect: true,
    });
  });

  test("logout calls POST /api/auth/logout with null and skipAuthRedirect", () => {
    logout();
    expect(api.post).toHaveBeenCalledWith("/api/auth/logout", null, {
      skipAuthRedirect: true,
    });
  });

  test("refresh calls POST /api/auth/refresh with null and skipAuthRedirect", () => {
    refresh();
    expect(api.post).toHaveBeenCalledWith("/api/auth/refresh", null, {
      skipAuthRedirect: true,
    });
  });

  test("getMe calls GET /api/auth/me with skipAuthRedirect", () => {
    getMe();
    expect(api.get).toHaveBeenCalledWith("/api/auth/me", {
      skipAuthRedirect: true,
    });
  });

  test("changePassword calls POST /api/auth/change-password with payload and skipAuthRedirect", () => {
    const payload = { currentPassword: "old", newPassword: "NewPass123" };
    changePassword(payload);
    expect(api.post).toHaveBeenCalledWith(
      "/api/auth/change-password",
      payload,
      { skipAuthRedirect: true },
    );
  });
});
