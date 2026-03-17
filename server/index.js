import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
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

app.set("trust proxy", false);


app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || process.env.CLIENT_URL || "*",
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const connectDB = async () => {
  try {
    const mongoURI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/athena-nexus";
    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoURI);
    console.log("✅ MongoDB Connected");
    return true;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    console.error("Full error:", error);
    return false;
  }
};


app.use("/api/auth", authRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/weeks", weekRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/milestones", milestonesRoutes);
app.use("/api/admin/milestones", adminMilestonesRoutes);
app.use("/api/users", usersRoutes);


app.get("/api/health", (req, res) => {
  const dbStatus =
    mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  res.json({
    status: "OK",
    message: "Server is running",
    database: dbStatus,
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
    process.exit(1);
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

startServer();
