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
const MAX_REFRESH_TOKENS_PER_USER = 8;

const getRefreshSecret = () =>
  process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

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
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        displayName: user.displayName,
      },
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
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        displayName: user.displayName,
      },
    });
  } catch (error) {
    console.error("Login failed");
    res.status(500).json({
      message: "Server error during login",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password_hash");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    res.json({
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        displayName: user.displayName,
        members: user.members,
        contactEmail: user.contactEmail,
      },
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
