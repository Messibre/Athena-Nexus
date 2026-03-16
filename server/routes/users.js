import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { updateUser } from "../controllers/adminController.js";

const router = express.Router();

router.use(verifyToken);
router.put("/:id", updateUser);

export default router;
