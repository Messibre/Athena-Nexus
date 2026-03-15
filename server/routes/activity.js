import express from "express";
import { verifyToken, isAdmin } from "../middleware/auth.js";
import { getActivityLogs } from "../controllers/activityController.js";

const router = express.Router();

router.get("/", verifyToken, isAdmin, getActivityLogs);

export default router;
