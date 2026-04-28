import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_DISPLAY_NAME = process.env.ADMIN_DISPLAY_NAME || "Administrator";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";

const createAdmin = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error("MONGODB_URI is required in the environment");
      process.exit(1);
    }

    if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
      console.error("ADMIN_USERNAME and ADMIN_PASSWORD are required in .env");
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const existingAdmin = await User.findOne({ username: ADMIN_USERNAME });
    if (existingAdmin) {
      console.log("Admin user already exists");
      process.exit(0);
    }

    const admin = new User({
      username: ADMIN_USERNAME,
      password_hash: ADMIN_PASSWORD,
      role: "admin",
      displayName: ADMIN_DISPLAY_NAME,
      email: ADMIN_EMAIL,
    });

    await admin.save();
    console.log("Admin user created successfully!");
    console.log(`Username: ${ADMIN_USERNAME}`);
    console.log("Please change the password after first login.");

    process.exit(0);
  } catch (error) {
    console.error("Error creating admin:", error);
    process.exit(1);
  }
};

createAdmin();
