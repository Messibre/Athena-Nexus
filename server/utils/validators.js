export const normalizeGitHubUrl = (url) => {
  if (!url || typeof url !== "string") {
    return "";
  }

  return url
    .trim()
    .replace(/\.git$/i, "")
    .replace(/\/+$/, "");
};

export const isValidGitHubUrl = (url) => {
  try {
    const normalized = normalizeGitHubUrl(url);
    if (!normalized) {
      return false;
    }

    const parsed = new URL(normalized);
    if (parsed.protocol !== "https:" || parsed.hostname !== "github.com") {
      return false;
    }

    const segments = parsed.pathname.split("/").filter(Boolean);
    return segments.length === 2;
  } catch {
    return false;
  }
};

export const isValidUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === "http:" || urlObj.protocol === "https:";
  } catch {
    return false;
  }
};

export const isValidPassword = (password) => {
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
  return passwordRegex.test(password);
};
