import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { listExpenses, createExpense, deleteExpense } from '../controllers/expenseController.js';

const router = express.Router();

router.get('/:grupId/expenses', requireAuth, listExpenses);
router.post('/:grupId/expenses', requireAuth, createExpense);
router.delete('/:grupId/expenses/:id', requireAuth, deleteExpense);

export default router;
