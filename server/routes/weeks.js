import express from "express";
import {
  getWeeks,
  getActiveWeek,
  getWeekById,
  getWeekSubmissions,
  getPublicStats,
  getLeaderboard,
} from "../controllers/weeksController.js";

const router = express.Router();

router.get("/", getWeeks);
router.get("/active", getActiveWeek);
router.get("/leaderboard", getLeaderboard);
router.get("/:id", getWeekById);
router.get("/:id/submissions", getWeekSubmissions);
router.get("/stats/public", getPublicStats);

export default router;
