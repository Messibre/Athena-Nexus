import express from 'express';
import { loginLimiter } from '../middleware/rateLimiter.js';
import { signup, login, getMe, changePassword } from '../controllers/authController.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', loginLimiter, login);
router.get('/me', getMe);
router.post('/change-password', changePassword);

export default router;
