import express from "express";
import {
  createCategory,
  listCategories,
  getCategory,
  updateCategory,
  deleteCategory,
  createLevel,
  listLevels,
  getLevel,
  updateLevel,
  deleteLevel,
  createChallenge,
  listChallenges,
  getChallenge,
  updateChallenge,
  deleteChallenge,
  listSubmissions,
  getSubmission,
  updateSubmissionStatus,
} from "../controllers/milestones/adminMilestonesController.js";
import { verifyToken, isAdmin } from "../middleware/auth.js";

const router = express.Router();

router.use(verifyToken);
router.use(isAdmin);

router.post("/categories", createCategory);
router.get("/categories", listCategories);
router.get("/categories/:id", getCategory);
router.put("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);

router.post("/levels", createLevel);
router.get("/levels", listLevels);
router.get("/levels/:id", getLevel);
router.put("/levels/:id", updateLevel);
router.delete("/levels/:id", deleteLevel);

router.post("/challenges", createChallenge);
router.get("/challenges", listChallenges);
router.get("/challenges/:id", getChallenge);
router.put("/challenges/:id", updateChallenge);
router.delete("/challenges/:id", deleteChallenge);

router.get("/submissions", listSubmissions);
router.get("/submissions/:id", getSubmission);
router.put("/submissions/:id/status", updateSubmissionStatus);

export default router;
