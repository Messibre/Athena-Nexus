import { describe, expect, test } from "@jest/globals";

const { normalizeGitHubUrl, isValidGitHubUrl, isValidUrl, isValidPassword } =
  await import("../validators.js");

describe("normalizeGitHubUrl", () => {
  test("returns trimmed URL without trailing .git and slash", () => {
    expect(normalizeGitHubUrl("  https://github.com/owner/repo.git/  ")).toBe(
      "https://github.com/owner/repo",
    );
  });

  test("returns empty string for non-string or empty input", () => {
    expect(normalizeGitHubUrl("")).toBe("");
    expect(normalizeGitHubUrl(null)).toBe("");
    expect(normalizeGitHubUrl(undefined)).toBe("");
    expect(normalizeGitHubUrl(123)).toBe("");
  });

  test("removes .git suffix only at end", () => {
    expect(normalizeGitHubUrl("https://github.com/owner/repo.git")).toBe(
      "https://github.com/owner/repo",
    );
    expect(normalizeGitHubUrl("https://github.com/owner/repo.git.extra")).toBe(
      "https://github.com/owner/repo.git.extra",
    );
  });

  test("removes trailing slashes", () => {
    expect(normalizeGitHubUrl("https://github.com/owner/repo/")).toBe(
      "https://github.com/owner/repo",
    );
    expect(normalizeGitHubUrl("https://github.com/owner/repo///")).toBe(
      "https://github.com/owner/repo",
    );
  });
});

describe("isValidGitHubUrl", () => {
  test("returns true for valid HTTPS GitHub owner/repo URL", () => {
    expect(isValidGitHubUrl("https://github.com/owner/repo")).toBe(true);
    expect(isValidGitHubUrl("https://github.com/owner/repo.git")).toBe(true);
    expect(isValidGitHubUrl("https://github.com/owner/repo/")).toBe(true);
  });

  test("returns false for non-HTTPS or non-github domains", () => {
    expect(isValidGitHubUrl("http://github.com/owner/repo")).toBe(false);
    expect(isValidGitHubUrl("https://gitlab.com/owner/repo")).toBe(false);
    expect(isValidGitHubUrl("https://github.com/owner/repo/sub")).toBe(false);
  });

  test("returns false for malformed URLs", () => {
    expect(isValidGitHubUrl("not-a-url")).toBe(false);
    expect(isValidGitHubUrl("https://github.com")).toBe(false);
    expect(isValidGitHubUrl("https://github.com/owner")).toBe(false);
    expect(isValidGitHubUrl("")).toBe(false);
  });
});

describe("isValidUrl", () => {
  test("returns true for http and https URLs", () => {
    expect(isValidUrl("http://example.com")).toBe(true);
    expect(isValidUrl("https://example.com/path?q=1")).toBe(true);
  });

  test("returns false for invalid protocols or malformed", () => {
    expect(isValidUrl("ftp://example.com")).toBe(false);
    expect(isValidUrl("javascript:void(0)")).toBe(false);
    expect(isValidUrl("not-a-url")).toBe(false);
    expect(isValidUrl("")).toBe(false);
  });
});

describe("isValidPassword", () => {
  test("returns true for password with letters and numbers, length >= 8", () => {
    expect(isValidPassword("Passw0rd")).toBe(true);
    expect(isValidPassword("a1b2c3d4")).toBe(true);
    expect(isValidPassword("Abc123!@")).toBe(true);
  });

  test("returns false for too short password", () => {
    expect(isValidPassword("Ab1")).toBe(false);
  });

  test("returns false for password without numbers", () => {
    expect(isValidPassword("Password")).toBe(false);
  });

  test("returns false for password without letters", () => {
    expect(isValidPassword("12345678")).toBe(false);
  });

  test("returns false for empty or non-string", () => {
    expect(isValidPassword("")).toBe(false);
    expect(isValidPassword(null)).toBe(false);
    expect(isValidPassword(undefined)).toBe(false);
  });
});
