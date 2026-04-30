import express from "express";
import { verifyToken, isAdmin } from "../middleware/auth.js";
import {
  createFeedback,
  listFeedback,
  updateFeedbackStatus,
} from "../controllers/feedbackController.js";

const router = express.Router();

router.post("/", createFeedback);
router.get("/", verifyToken, isAdmin, listFeedback);
router.patch("/:id", verifyToken, isAdmin, updateFeedbackStatus);

export default router;
