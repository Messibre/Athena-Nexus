import express from "express";
import { verifyToken } from "../middleware/auth.js";
import {
  getPublicSubmissions,
  getMySubmissions,
  getSubmissionById,
  createSubmission,
  updateSubmission,
} from "../controllers/submissionsController.js";

const router = express.Router();

router.get("/public", getPublicSubmissions);
router.get("/my-submissions", verifyToken, getMySubmissions);
router.get("/:id", getSubmissionById);
router.post("/", verifyToken, createSubmission);
router.put("/:id", verifyToken, updateSubmission);

export default router;
