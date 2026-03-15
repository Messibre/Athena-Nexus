import express from "express";
import { verifyToken, isAdmin } from "../middleware/auth.js";
import {
  createWeek,
  updateWeek,
  deleteWeek,
  createUser,
  getUsers,
  updateUser,
  resetUserPassword,
  deleteUser,
  getSubmissions,
  updateSubmissionStatus,
  exportSubmissions,
  getStats,
} from "../controllers/adminController.js";

const router = express.Router();

router.use(verifyToken);
router.use(isAdmin);

router.post("/weeks", createWeek);
router.put("/weeks/:id", updateWeek);
router.delete("/weeks/:id", deleteWeek);
router.post("/users", createUser);
router.get("/users", getUsers);
router.put("/users/:id", verifyToken, updateUser);
router.post("/users/:id/reset-password", resetUserPassword);
router.delete("/users/:id", deleteUser);
router.get("/submissions", getSubmissions);
router.put("/submissions/:id/status", updateSubmissionStatus);
router.get("/submissions/export", exportSubmissions);
router.get("/stats", getStats);

export default router;
