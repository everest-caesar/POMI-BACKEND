import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  createMatch,
  listMatches,
  getMatch,
  updateMatch,
  deleteMatch,
} from '../controllers/mentorship.controller.js';

const router = Router();

// Mentorship matches
router.get('/matches', authenticateToken, listMatches);
router.get('/matches/:id', authenticateToken, getMatch);

router.post('/matches', authenticateToken, createMatch);
router.put('/matches/:id', authenticateToken, updateMatch);
router.delete('/matches/:id', authenticateToken, deleteMatch);

export default router;
