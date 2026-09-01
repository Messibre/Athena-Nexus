import MockAdapter from "axios-mock-adapter";
import api from "../axios";

const mock = new MockAdapter(api);

afterEach(() => {
  mock.reset();
});

describe("Axios interceptor – error normalisation", () => {
  test("adds normalizedMessage from server response message", async () => {
    mock.onGet("/test-endpoint").reply(400, { message: "Bad request custom" });

    try {
      await api.get("/test-endpoint");
    } catch (error) {
      expect(error.normalizedMessage).toBe("Bad request custom");
    }
  });

  test("handles network error and sets friendly message", async () => {
    mock.onGet("/test-endpoint").networkError();

    try {
      await api.get("/test-endpoint");
    } catch (error) {
      expect(error.normalizedMessage).toBe(
        "Unable to reach the server. Please check your connection and try again.",
      );
    }
  });

  test("handles timeout error", async () => {
    mock.onGet("/test-endpoint").timeout();

    try {
      await api.get("/test-endpoint");
    } catch (error) {
      expect(error.code).toBe("ECONNABORTED");
      expect(error.normalizedMessage).toContain("taking longer than expected");
    }
  });

  test.each([
    [
      400,
      "We couldn't process that request. Please review your details and try again.",
    ],
    [403, "You do not have permission to do that."],
    [404, "We couldn't find that page or resource."],
    [409, "That item already exists. Try a different value."],
    [422, "Some of the information looks incomplete or invalid."],
    [429, "You're doing that too often. Please wait a moment and try again."],
    [500, "The server ran into a problem. Please try again shortly."],
  ])("returns correct message for status %d", async (status, expected) => {
    mock.onGet("/test-endpoint").reply(status);

    try {
      await api.get("/test-endpoint");
    } catch (error) {
      expect(error.normalizedMessage).toBe(expected);
    }
  });

  test("returns correct message for 401 when refresh fails and redirects", async () => {
    const originalLocation = window.location;
    Object.defineProperty(window, "location", {
      writable: true,
      value: { href: "", assign: jest.fn(), replace: jest.fn() },
    });

    mock.onGet("/test-endpoint").reply(401);
    mock.onPost("/api/auth/refresh").reply(401); // refresh fails

    try {
      await api.get("/test-endpoint");
    } catch (error) {
      expect(error.normalizedMessage).toBe(
        "Your session has expired. Please sign in again.",
      );
    }

    Object.defineProperty(window, "location", {
      writable: true,
      value: originalLocation,
    });
  });

  test("dispatches app:error event for 500 errors", async () => {
    const dispatchSpy = jest.spyOn(window, "dispatchEvent");
    mock.onGet("/test-endpoint").reply(500);

    try {
      await api.get("/test-endpoint");
    } catch (error) {
      expect(dispatchSpy).toHaveBeenCalled();
      const event = dispatchSpy.mock.calls[0][0];
      expect(event.type).toBe("app:error");
      expect(event.detail.message).toContain("server ran into a problem");
    }
  });
});

describe("Axios interceptor – token refresh", () => {
  test("retries original request after successful token refresh", async () => {
    mock.onPost("/api/auth/refresh").reply(200, { success: true });
    mock
      .onGet("/test-endpoint")
      .replyOnce(401)
      .onGet("/test-endpoint")
      .reply(200, { data: "success" });

    const response = await api.get("/test-endpoint");
    expect(response.data).toEqual({ data: "success" });
  });

  test("redirects to /login when refresh fails", async () => {
    const originalLocation = window.location;
    const assignMock = jest.fn();
    Object.defineProperty(window, "location", {
      writable: true,
      value: { href: "", assign: assignMock, replace: jest.fn() },
    });

    mock.onPost("/api/auth/refresh").reply(401);
    mock.onGet("/test-endpoint").reply(401);

    try {
      await api.get("/test-endpoint");
    } catch (error) {
      expect(window.location.href).toBe("/login");
    }

    Object.defineProperty(window, "location", {
      writable: true,
      value: originalLocation,
    });
  });
});
