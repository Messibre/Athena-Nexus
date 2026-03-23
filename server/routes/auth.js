import express from "express";
import { loginLimiter } from "../middleware/rateLimiter.js";
import { verifyToken } from "../middleware/auth.js";
import {
  signup,
  login,
  getMe,
  changePassword,
  logout,
  refreshToken,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", loginLimiter, login);
router.post("/refresh", refreshToken);
router.post("/logout", logout);
router.get("/me", verifyToken, getMe);
router.post("/change-password", verifyToken, changePassword);

export default router;
