import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getBalance, getTransactions } from '../controllers/balanceController.js';

const router = express.Router();

router.get('/:grupId/balance', requireAuth, getBalance);
router.get('/:grupId/transactions', requireAuth, getTransactions);

export default router;
