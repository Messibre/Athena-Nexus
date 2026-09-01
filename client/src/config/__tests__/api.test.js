import api from "../api";
import * as apiModules from "../api";

describe("API barrel exports", () => {
  test("default export is the axios instance", () => {
    expect(api).toBeDefined();
    expect(api.get).toBeInstanceOf(Function);
    expect(api.post).toBeInstanceOf(Function);
  });

  test("exports all feature API modules", () => {
    expect(apiModules.authApi).toBeDefined();
    expect(apiModules.weeksApi).toBeDefined();
    expect(apiModules.submissionsApi).toBeDefined();
    expect(apiModules.adminApi).toBeDefined();
    expect(apiModules.milestonesApi).toBeDefined();
    expect(apiModules.usersApi).toBeDefined();
    expect(apiModules.feedbackApi).toBeDefined();
    expect(apiModules.activityApi).toBeDefined();
  });
});
