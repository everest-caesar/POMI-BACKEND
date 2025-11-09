import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  createGroup,
  listGroups,
  getGroup,
  updateGroup,
  deleteGroup,
  joinGroup,
  leaveGroup,
} from '../controllers/community.controller.js';

const router = Router();

// Community groups
router.get('/groups', listGroups);
router.get('/groups/:id', getGroup);

router.post('/groups', authenticateToken, createGroup);
router.put('/groups/:id', authenticateToken, updateGroup);
router.delete('/groups/:id', authenticateToken, deleteGroup);
router.post('/groups/:id/members', authenticateToken, joinGroup);
router.delete('/groups/:id/members/:userId', authenticateToken, leaveGroup);

export default router;
