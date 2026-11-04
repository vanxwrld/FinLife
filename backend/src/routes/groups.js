import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { listGroups, createGroup, getGroupDetail, joinGroup, inviteMember } from '../controllers/groupController.js';

const router = express.Router();

router.get('/', requireAuth, listGroups);
router.post('/', requireAuth, createGroup);
router.get('/:id', requireAuth, getGroupDetail);
router.post('/join', requireAuth, joinGroup);
router.post('/:id/invite', requireAuth, inviteMember);

export default router;
