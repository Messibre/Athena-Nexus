import express from "express";
import { verifyToken, isAdmin } from "../middleware/auth.js";
import { getActivityLogs, getMyActivityLogs } from "../controllers/activityController.js";

const router = express.Router();

router.get("/", verifyToken, isAdmin, getActivityLogs);
router.get("/me", verifyToken, getMyActivityLogs);

export default router;
