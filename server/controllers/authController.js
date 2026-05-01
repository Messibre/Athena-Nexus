import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import ActivityLog from "../models/ActivityLog.js";
import { isValidPassword } from "../utils/validators.js";

const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "auth_token";
const REFRESH_COOKIE_NAME = process.env.REFRESH_COOKIE_NAME || "refresh_token";
const ACCESS_TOKEN_EXPIRE = process.env.JWT_EXPIRE || "15m";
const REFRESH_TOKEN_EXPIRE = process.env.JWT_REFRESH_EXPIRE || "7d";
const REFRESH_COOKIE_MAX_AGE =
  parseInt(process.env.REFRESH_COOKIE_MAX_AGE_MS || "604800000", 10) ||
  1000 * 60 * 60 * 24 * 7;
const MAX_REFRESH_TOKENS_PER_USER = 15;
const OAUTH_STATE_EXPIRE = "10m";
const OAUTH_REDIRECT_PATH = "/dashboard";

const getRefreshSecret = () =>
  process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

const getClientBaseUrl = () => {
  const origin = process.env.FRONTEND_URL || process.env.CLIENT_URL || "";
  return origin.replace(/\/+$/, "");
};

const getOAuthStateSecret = () => process.env.JWT_SECRET;

const buildRedirectUrl = (path = OAUTH_REDIRECT_PATH) => {
  const baseUrl = getClientBaseUrl();
  if (!baseUrl) {
    return path;
  }

  return `${baseUrl}${path}`;
};

const sanitizeReturnTo = (value) => {
  if (!value || typeof value !== "string") {
    return OAUTH_REDIRECT_PATH;
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return OAUTH_REDIRECT_PATH;
  }

  return value;
};

const getOAuthConfig = (provider) => {
  const baseUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || "";

  if (provider === "google") {
    return {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      userInfoUrl: "https://www.googleapis.com/oauth2/v3/userinfo",
      scope: "openid email profile",
      redirectUri:
        process.env.GOOGLE_OAUTH_REDIRECT_URI ||
        `${baseUrl}/api/auth/oauth/google/callback`,
    };
  }

  if (provider === "github") {
    return {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      authorizeUrl: "https://github.com/login/oauth/authorize",
      tokenUrl: "https://github.com/login/oauth/access_token",
      userInfoUrl: "https://api.github.com/user",
      emailsUrl: "https://api.github.com/user/emails",
      scope: "read:user user:email",
      redirectUri:
        process.env.GITHUB_OAUTH_REDIRECT_URI ||
        `${baseUrl}/api/auth/oauth/github/callback`,
    };
  }

  return null;
};

const oauthFetch = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.headers || {}),
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = typeof data === "string" ? data : data?.error_description || data?.message;
    throw new Error(message || "OAuth request failed");
  }

  return data;
};

const getProviderProfile = async (provider, accessToken) => {
  const config = getOAuthConfig(provider);

  if (provider === "google") {
    return oauthFetch(config.userInfoUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }

  const profile = await oauthFetch(config.userInfoUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "Athena Nexus",
      Accept: "application/vnd.github+json",
    },
  });

  let primaryEmail = profile.email || "";
  if (!primaryEmail) {
    try {
      const emails = await oauthFetch(config.emailsUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "User-Agent": "Athena Nexus",
          Accept: "application/vnd.github+json",
        },
      });
      primaryEmail =
        emails.find((item) => item.primary && item.verified)?.email ||
        emails.find((item) => item.verified)?.email ||
        emails[0]?.email ||
        "";
    } catch (emailError) {
      primaryEmail = "";
    }
  }

  return {
    ...profile,
    email: primaryEmail,
  };
};

const exchangeOAuthCode = async (provider, code) => {
  const config = getOAuthConfig(provider);

  if (provider === "google") {
    return oauthFetch(config.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        grant_type: "authorization_code",
      }),
    });
  }

  return oauthFetch(config.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.redirectUri,
    }),
  });
};

const buildOAuthUserData = (provider, profile) => {
  const providerName = provider === "google" ? "google" : "github";
  const providerId = String(profile.sub || profile.id || profile.node_id || "");
  const usernameSeed =
    provider === "google"
      ? profile.email?.split("@")[0]
      : profile.login || profile.email?.split("@")[0];
  const username =
    `${providerName}_${usernameSeed || providerId || crypto.randomUUID()}`
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 32);

  const displayName =
    profile.name || profile.login || profile.email?.split("@")[0] || username;

  return {
    username,
    displayName,
    email: profile.email || "",
    profileImageUrl: profile.picture || profile.avatar_url || "",
    socialLinks: {
      github: profile.html_url || "",
      website: "",
      linkedin: "",
      x: "",
      instagram: "",
    },
    providerId,
  };
};

const findOrCreateOAuthUser = async (provider, profile) => {
  const providerField = provider === "google" ? "googleId" : "githubId";
  const providerId = String(profile.sub || profile.id || profile.node_id || "");
  const email = profile.email || "";

  if (!providerId) {
    throw new Error("OAuth provider did not return a stable user id");
  }

  let user = await User.findOne({ [providerField]: providerId });

  if (!user && email) {
    user = await User.findOne({ email });
  }

  const baseUserData = buildOAuthUserData(provider, profile);

  if (!user) {
    const fallbackUsername = `${baseUserData.username}_${providerId.slice(-6)}`;
    user = new User({
      username: fallbackUsername,
      password_hash: crypto.randomBytes(24).toString("hex"),
      email,
      displayName: baseUserData.displayName,
      profileImageUrl: baseUserData.profileImageUrl,
      socialLinks: baseUserData.socialLinks,
      contactEmail: email,
      [providerField]: providerId,
      authProviders: {
        google: provider === "google",
        github: provider === "github",
        local: false,
      },
    });
  } else {
    user[providerField] = providerId;
    user.authProviders = {
      ...(user.authProviders || {}),
      [provider]: true,
    };
    if (!user.displayName && baseUserData.displayName) {
      user.displayName = baseUserData.displayName;
    }
    if (!user.email && email) {
      user.email = email;
      user.contactEmail = email;
    }
    if (!user.profileImageUrl && baseUserData.profileImageUrl) {
      user.profileImageUrl = baseUserData.profileImageUrl;
    }
  }

  await user.save();
  return user;
};

const issueOAuthRedirect = (res, provider, returnTo) => {
  const config = getOAuthConfig(provider);

  if (!config?.clientId || !config?.clientSecret) {
    return res.status(500).json({
      message: `OAuth for ${provider} is not configured`,
    });
  }

  const state = jwt.sign(
    {
      provider,
      returnTo: sanitizeReturnTo(returnTo),
    },
    getOAuthStateSecret(),
    { expiresIn: OAUTH_STATE_EXPIRE },
  );

  const authUrl = new URL(config.authorizeUrl);
  authUrl.searchParams.set("client_id", config.clientId);
  authUrl.searchParams.set("redirect_uri", config.redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", config.scope);
  authUrl.searchParams.set("state", state);

  if (provider === "google") {
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent select_account");
  }

  return res.redirect(authUrl.toString());
};

const finalizeOAuthLogin = async (req, res, provider) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({ message: "Missing OAuth code or state" });
    }

    const decodedState = jwt.verify(state, getOAuthStateSecret());
    if (decodedState.provider !== provider) {
      return res.status(400).json({ message: "OAuth provider mismatch" });
    }

    const tokens = await exchangeOAuthCode(provider, code);
    const accessToken = tokens.access_token || tokens.accessToken;

    if (!accessToken) {
      return res.status(400).json({ message: "OAuth provider did not return an access token" });
    }

    const profile = await getProviderProfile(provider, accessToken);
    const user = await findOrCreateOAuthUser(provider, profile);

    try {
      await ActivityLog.create({
        user_id: user._id,
        action: `${provider}_login`,
        detail: `${provider} OAuth login`,
      });
    } catch {
      console.error("Failed to write activity log");
    }

    await issueAuthCookies(res, user, req);

    const redirectTo = buildRedirectUrl(decodedState.returnTo || OAUTH_REDIRECT_PATH);
    return res.redirect(redirectTo);
  } catch (error) {
    console.error(`${provider} OAuth login failed:`, error.message);
    return res.redirect(
      `${buildRedirectUrl("/login")}?error=${encodeURIComponent(
        error.message || "OAuth login failed",
      )}`,
    );
  }
};

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const getCookieOptions = () => {
  const isProd = process.env.NODE_ENV === "production";
  const sameSite = process.env.AUTH_COOKIE_SAME_SITE || "lax";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite,
    maxAge: 1000 * 60 * 60,
    path: "/",
  };
};

const getRefreshCookieOptions = () => ({
  ...getCookieOptions(),
  maxAge: REFRESH_COOKIE_MAX_AGE,
});

const parseCookies = (cookieHeader = "") => {
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, part) => {
      const separatorIndex = part.indexOf("=");
      if (separatorIndex <= 0) return acc;

      const key = part.slice(0, separatorIndex);
      const value = part.slice(separatorIndex + 1);
      acc[key] = decodeURIComponent(value);
      return acc;
    }, {});
};

const setAuthCookie = (res, token) => {
  res.cookie(AUTH_COOKIE_NAME, token, getCookieOptions());
};

const setRefreshCookie = (res, token) => {
  res.cookie(REFRESH_COOKIE_NAME, token, getRefreshCookieOptions());
};

const clearRefreshCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    ...getRefreshCookieOptions(),
    maxAge: undefined,
  });
};

const clearAuthCookie = (res) => {
  res.clearCookie(AUTH_COOKIE_NAME, {
    ...getCookieOptions(),
    maxAge: undefined,
  });
};

const createAccessToken = (user) => {
  return jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRE },
  );
};

const createRefreshToken = (user) => {
  const jti = crypto.randomUUID();
  const token = jwt.sign(
    { userId: user._id, role: user.role, jti },
    getRefreshSecret(),
    { expiresIn: REFRESH_TOKEN_EXPIRE },
  );
  return { token, jti };
};

const buildUserResponse = (user) => ({
  id: user._id,
  username: user.username,
  role: user.role,
  displayName: user.displayName,
  email: user.email,
  members: user.members,
  contactEmail: user.contactEmail,
  profileImageUrl: user.profileImageUrl || "",
  coverImageUrl: user.coverImageUrl || "",
  headline: user.headline || "",
  bio: user.bio || "",
  location: user.location || "",
  socialLinks: user.socialLinks || {},
});

const persistRefreshToken = async (user, refreshToken, req) => {
  const decoded = jwt.decode(refreshToken);
  const expiresAt = decoded?.exp
    ? new Date(decoded.exp * 1000)
    : new Date(Date.now() + REFRESH_COOKIE_MAX_AGE);
  const tokenHash = hashToken(refreshToken);

  user.refreshTokens = (user.refreshTokens || [])
    .filter((item) => !item.revokedAt && new Date(item.expiresAt) > new Date())
    .slice(-MAX_REFRESH_TOKENS_PER_USER + 1);

  user.refreshTokens.push({
    tokenHash,
    expiresAt,
    userAgent: req.headers["user-agent"] || "",
    ip: req.ip || req.socket?.remoteAddress || "",
  });

  await user.save();
};

const issueAuthCookies = async (res, user, req) => {
  const accessToken = createAccessToken(user);
  const { token: refreshToken } = createRefreshToken(user);

  await persistRefreshToken(user, refreshToken, req);

  setAuthCookie(res, accessToken);
  setRefreshCookie(res, refreshToken);
};

export const signup = async (req, res) => {
  try {
    const { username, password, displayName, email, members } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters and contain both letters and numbers",
      });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    let membersArray = [];
    if (members) {
      if (typeof members === "string") {
        membersArray = members
          .split(",")
          .map((name) => ({ name: name.trim() }))
          .filter((m) => m.name);
      } else if (Array.isArray(members)) {
        membersArray = members;
      }
    }

    const user = new User({
      username,
      password_hash: password,
      role: "member",
      displayName: displayName || username,
      email: email || "",
      members: membersArray,
      contactEmail: email || "",
    });

    await user.save();

    await ActivityLog.create({
      user_id: user._id,
      action: "login",
      detail: "New user registered",
    });

    await issueAuthCookies(res, user, req);

    res.status(201).json({
      user: buildUserResponse(user),
      message: "Account created successfully!",
    });
  } catch (error) {
    console.error("Signup failed");
    if (error.code === 11000) {
      return res.status(400).json({ message: "Username already exists" });
    }
    res.status(500).json({ message: "Server error during signup" });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not set in environment variables");
      return res.status(500).json({ message: "Server configuration error" });
    }

    const user = await User.findOne({ username });
    if (!user) {
      try {
        await ActivityLog.create({
          action: "failed_login",
          detail: "Failed login attempt",
        });
      } catch (logError) {
        console.error("Failed to write activity log");
      }
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      try {
        await ActivityLog.create({
          user_id: user._id,
          action: "failed_login",
          detail: "Invalid password",
        });
      } catch (logError) {
        console.error("Failed to write activity log");
      }
      return res.status(401).json({ message: "Invalid credentials" });
    }

    try {
      await ActivityLog.create({
        user_id: user._id,
        action: "login",
        detail: "Successful login",
      });
    } catch (logError) {
      console.error("Failed to write activity log");
    }

    await issueAuthCookies(res, user, req);

    res.json({
      user: buildUserResponse(user),
    });
  } catch (error) {
    console.error("Login failed");
    res.status(500).json({
      message: "Server error during login",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const startOAuthLogin = async (req, res) => {
  const provider = String(req.params.provider || "").toLowerCase();
  const returnTo = req.query.returnTo || req.query.redirectTo || OAUTH_REDIRECT_PATH;

  if (!["google", "github"].includes(provider)) {
    return res.status(400).json({ message: "Unsupported OAuth provider" });
  }

  return issueOAuthRedirect(res, provider, returnTo);
};

export const oauthCallback = async (req, res) => {
  const provider = String(req.params.provider || "").toLowerCase();

  if (!["google", "github"].includes(provider)) {
    return res.status(400).json({ message: "Unsupported OAuth provider" });
  }

  return finalizeOAuthLogin(req, res, provider);
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password_hash");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    res.json({
      user: buildUserResponse(user),
    });
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current and new passwords are required" });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    if (!isValidPassword(newPassword)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters and contain both letters and numbers",
      });
    }

    user.password_hash = newPassword;
    user.refreshTokens = [];
    await user.save();

    await issueAuthCookies(res, user, req);

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Password change failed");
    res.status(500).json({ message: "Server error" });
  }
};

export const logout = async (req, res) => {
  try {
    const cookies = parseCookies(req.headers.cookie);
    const refreshToken = cookies[REFRESH_COOKIE_NAME];

    if (refreshToken) {
      const decoded = jwt.decode(refreshToken);
      if (decoded?.userId) {
        const user = await User.findById(decoded.userId);
        if (user && Array.isArray(user.refreshTokens)) {
          const tokenHash = hashToken(refreshToken);
          user.refreshTokens = user.refreshTokens.map((item) => {
            if (item.tokenHash === tokenHash && !item.revokedAt) {
              return { ...item.toObject(), revokedAt: new Date() };
            }
            return item;
          });
          await user.save();
        }
      }
    }
  } catch {
    // noop
  }

  clearAuthCookie(res);
  clearRefreshCookie(res);
  return res.json({ message: "Logged out successfully" });
};

export const refreshToken = async (req, res) => {
  try {
    const cookies = parseCookies(req.headers.cookie);
    const refreshTokenValue = cookies[REFRESH_COOKIE_NAME];

    if (!refreshTokenValue) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshTokenValue, getRefreshSecret());
    } catch {
      clearAuthCookie(res);
      clearRefreshCookie(res);
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      clearAuthCookie(res);
      clearRefreshCookie(res);
      return res.status(401).json({ message: "Unauthorized" });
    }

    const providedTokenHash = hashToken(refreshTokenValue);
    const currentRecord = (user.refreshTokens || []).find(
      (item) =>
        item.tokenHash === providedTokenHash &&
        !item.revokedAt &&
        new Date(item.expiresAt) > new Date(),
    );

    if (!currentRecord) {
      user.refreshTokens = [];
      await user.save();
      clearAuthCookie(res);
      clearRefreshCookie(res);
      return res.status(401).json({ message: "Unauthorized" });
    }

    const accessToken = createAccessToken(user);
    const { token: nextRefreshToken } = createRefreshToken(user);
    const nextRefreshTokenHash = hashToken(nextRefreshToken);
    const nextDecoded = jwt.decode(nextRefreshToken);

    user.refreshTokens = (user.refreshTokens || [])
      .map((item) => {
        if (item.tokenHash === providedTokenHash) {
          return {
            ...item.toObject(),
            revokedAt: new Date(),
            replacedByTokenHash: nextRefreshTokenHash,
          };
        }
        return item;
      })
      .filter(
        (item) => !item.revokedAt && new Date(item.expiresAt) > new Date(),
      );

    user.refreshTokens.push({
      tokenHash: nextRefreshTokenHash,
      expiresAt: nextDecoded?.exp
        ? new Date(nextDecoded.exp * 1000)
        : new Date(Date.now() + REFRESH_COOKIE_MAX_AGE),
      userAgent: req.headers["user-agent"] || "",
      ip: req.ip || req.socket?.remoteAddress || "",
    });

    await user.save();

    setAuthCookie(res, accessToken);
    setRefreshCookie(res, nextRefreshToken);

    return res.json({ success: true });
  } catch {
    clearAuthCookie(res);
    clearRefreshCookie(res);
    return res.status(401).json({ message: "Unauthorized" });
  }
};
