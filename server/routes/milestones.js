import express from "express";
import {
  listCategories,
  listLevelsByCategory,
  listChallengesByLevel,
  getChallenge,
  getMySubmissions,
  createSubmission,
  updateSubmission,
  getProgress,
} from "../controllers/milestones/milestonesController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/categories", listCategories);
router.get("/categories/:categoryId/levels", listLevelsByCategory);
router.get("/levels/:levelId/challenges", listChallengesByLevel);
router.get("/challenges/:id", getChallenge);

router.get("/submissions/my", verifyToken, getMySubmissions);
router.post("/submissions", verifyToken, createSubmission);
router.put("/submissions/:id", verifyToken, updateSubmission);
router.get("/progress", verifyToken, getProgress);

export default router;
