import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { register, login, getMe, updatePushToken } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, getMe);
router.post('/push-token', requireAuth, updatePushToken);

export default router;
