import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import { apiLimiter } from "./middleware/rateLimiter.js";
import { connectToDatabase, isDatabaseConnected } from "./utils/db.js";
import authRoutes from "./routes/auth.js";
import submissionRoutes from "./routes/submissions.js";
import weekRoutes from "./routes/weeks.js";
import adminRoutes from "./routes/admin.js";
import activityRoutes from "./routes/activity.js";
import milestonesRoutes from "./routes/milestones.js";
import adminMilestonesRoutes from "./routes/adminMilestones.js";
import usersRoutes from "./routes/users.js";
import feedbackRoutes from "./routes/feedback.js";

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

const app = express();
const isServerless = process.env.VERCEL === "1";

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
app.use((req, res, next) => {
  if (!isServerless) {
    return next();
  }

  const rewrittenPath =
    req.path === "/server/index.js" && typeof req.query?.path === "string"
      ? req.query.path
      : null;

  if (!rewrittenPath) {
    return next();
  }

  const normalizedPath = rewrittenPath.startsWith("/")
    ? rewrittenPath
    : `/${rewrittenPath}`;

  const forwardedQuery = new URLSearchParams();
  Object.entries(req.query).forEach(([key, value]) => {
    if (key === "path") {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (entry !== undefined && entry !== null) {
          forwardedQuery.append(key, String(entry));
        }
      });
      return;
    }

    if (value !== undefined && value !== null) {
      forwardedQuery.append(key, String(value));
    }
  });

  const queryString = forwardedQuery.toString();
  req.url = `/api${normalizedPath}${queryString ? `?${queryString}` : ""}`;

  return next();
});

const ensureDatabaseConnection = async (req, res, next) => {
  try {
    await connectToDatabase();
    return next();
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    return res.status(503).json({
      message: "Database unavailable. Please try again later.",
    });
  }
};

const apiRouter = express.Router();

apiRouter.use(apiLimiter);

apiRouter.get("/health", async (req, res) => {
  try {
    await connectToDatabase();
  } catch (error) {
    console.error("Health check MongoDB connection failed:", error.message);
  }

  const dbConnected = isDatabaseConnected();

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

apiRouter.use(ensureDatabaseConnection);
apiRouter.use("/auth", authRoutes);
apiRouter.use("/submissions", submissionRoutes);
apiRouter.use("/weeks", weekRoutes);
apiRouter.use("/admin", adminRoutes);
apiRouter.use("/activity", activityRoutes);
apiRouter.use("/milestones", milestonesRoutes);
apiRouter.use("/admin/milestones", adminMilestonesRoutes);
apiRouter.use("/users", usersRoutes);
apiRouter.use("/feedback", feedbackRoutes);

app.use("/api", apiRouter);

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
  if (!process.env.JWT_SECRET) {
    console.error("⚠️  WARNING: JWT_SECRET is not set!");
    console.error("Run: cd server && npm run generate-secret");
    console.error("Then add JWT_SECRET to your .env file");
  }

  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  });

  try {
    await connectToDatabase();
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error(
      "⚠️  MongoDB connection failed, but the API is still running.",
    );
    console.error("Please check:");
    console.error(
      "1. MongoDB is running (local) or connection string is correct (Atlas)",
    );
    console.error("2. MONGODB_URI is set correctly");
    console.error(error.message);
  }
};

if (!isServerless) {
  startServer();
}

export default app;
