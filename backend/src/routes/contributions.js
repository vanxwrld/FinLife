import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { listContributions, createContribution, updateContribution, deleteContribution } from '../controllers/contributionController.js';

const router = express.Router();

router.get('/:grupId/contributions', requireAuth, listContributions);
router.post('/:grupId/contributions', requireAuth, createContribution);
router.put('/:grupId/contributions/:id', requireAuth, updateContribution);
router.delete('/:grupId/contributions/:id', requireAuth, deleteContribution);

export default router;
