import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import { apiLimiter } from "./middleware/rateLimiter.js";
import authRoutes from "./routes/auth.js";
import submissionRoutes from "./routes/submissions.js";
import weekRoutes from "./routes/weeks.js";
import adminRoutes from "./routes/admin.js";
import activityRoutes from "./routes/activity.js";
import milestonesRoutes from "./routes/milestones.js";
import adminMilestonesRoutes from "./routes/adminMilestones.js";
import usersRoutes from "./routes/users.js";

dotenv.config();

const app = express();
const isServerless = process.env.VERCEL === "1";
let isDbConnected = false;
let dbConnectPromise = null;

app.set("trust proxy", process.env.NODE_ENV === "production" ? 1 : false);

app.use(helmet());

const normalizeOrigin = (value) => value?.trim().replace(/\/+$/, "");

const configuredOrigins = [
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : null,
  ...(process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((value) => value.trim())
    : []),
]
  .map(normalizeOrigin)
  .filter(Boolean);

const defaultOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].map(normalizeOrigin);

const includeLocalOrigins =
  process.env.NODE_ENV !== "production" ||
  process.env.ALLOW_LOCAL_ORIGINS === "true";

const isLocalDevOrigin = (origin = "") =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);

const allowedOrigins = new Set([
  ...configuredOrigins,
  ...(includeLocalOrigins ? defaultOrigins : []),
]);

app.use(
  cors({
    origin: (origin, callback) => {
      const normalizedOrigin = normalizeOrigin(origin);

      if (
        !origin ||
        allowedOrigins.has(normalizedOrigin) ||
        (includeLocalOrigins && isLocalDevOrigin(normalizedOrigin))
      ) {
        return callback(null, true);
      }

      return callback(new Error("CORS_NOT_ALLOWED"));
    },
    credentials: true,
    optionsSuccessStatus: 204,
  }),
);

app.use((err, req, res, next) => {
  if (err?.message === "CORS_NOT_ALLOWED") {
    return res.status(403).json({ message: "Origin not allowed by CORS" });
  }

  return next(err);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", apiLimiter);

app.get("/api/health", (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;

  res.status(dbConnected ? 200 : 503).json({
    status: dbConnected ? "OK" : "DEGRADED",
    message: dbConnected
      ? "Server is running"
      : "Server is running but database is not connected",
    database: dbConnected ? "connected" : "disconnected",
    environment: process.env.NODE_ENV || "development",
    isServerless,
    hasMongoUri: Boolean(process.env.MONGODB_URI),
    timestamp: new Date().toISOString(),
  });
});

const connectDB = async () => {
  if (isDbConnected && mongoose.connection.readyState === 1) {
    return true;
  }

  if (dbConnectPromise) {
    return dbConnectPromise;
  }

  dbConnectPromise = (async () => {
    try {
      const mongoURI =
        process.env.MONGODB_URI || "mongodb://localhost:27017/athena-nexus";
      console.log("Connecting to MongoDB...");
      await mongoose.connect(mongoURI);
      isDbConnected = true;
      console.log("✅ MongoDB Connected");
      return true;
    } catch (error) {
      isDbConnected = false;
      console.error("❌ MongoDB connection error:", error.message);
      console.error("Full error:", error);
      return false;
    } finally {
      dbConnectPromise = null;
    }
  })();

  return dbConnectPromise;
};

app.use(async (req, res, next) => {
  if (req.path === "/api/health") {
    return next();
  }

  const dbConnected = await connectDB();

  if (!dbConnected) {
    return res.status(503).json({
      message: "Database unavailable. Please try again later.",
    });
  }

  return next();
});

app.use("/api/auth", authRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/weeks", weekRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/milestones", milestonesRoutes);
app.use("/api/admin/milestones", adminMilestonesRoutes);
app.use("/api/users", usersRoutes);

app.use("/api/*", (req, res) => {
  res.status(404).json({
    message: "API route not found",
    path: req.originalUrl,
  });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  const dbConnected = await connectDB();

  if (!dbConnected) {
    console.error("Failed to connect to MongoDB. Server will not start.");
    console.error("Please check:");
    console.error(
      "1. MongoDB is running (local) or connection string is correct (Atlas)",
    );
    console.error("2. MONGODB_URI in .env file is correct");
    return;
  }

  if (!process.env.JWT_SECRET) {
    console.error("⚠️  WARNING: JWT_SECRET is not set!");
    console.error("Run: cd server && npm run generate-secret");
    console.error("Then add JWT_SECRET to your .env file");
  }

  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  });
};

if (!isServerless) {
  startServer();
}

export default app;
