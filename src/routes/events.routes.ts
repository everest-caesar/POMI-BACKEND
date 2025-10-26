import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  createEvent,
  listEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  rsvpEvent,
  cancelRsvp,
} from '../controllers/events.controller';

const router = Router();

// Public routes
router.get('/', listEvents);
router.get('/:id', getEvent);

// Private routes
router.post('/', authenticateToken, createEvent);
router.put('/:id', authenticateToken, updateEvent);
router.delete('/:id', authenticateToken, deleteEvent);
router.post('/:id/rsvp', authenticateToken, rsvpEvent);
router.delete('/:id/rsvp', authenticateToken, cancelRsvp);

export default router;
