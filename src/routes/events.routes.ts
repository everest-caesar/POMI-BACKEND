import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  rsvpEvent,
  cancelRsvp,
  getUserEvents,
  getPendingEvents,
  approveEvent,
  rejectEvent,
} from '../controllers/eventController.js';

const router = Router();

/**
 * @route   GET /api/v1/events
 * @desc    Get all events with filters
 * @query   { category?, search?, limit?, skip? }
 * @returns { events[], pagination }
 */
router.get('/', getEvents);

/**
 * @route   GET /api/v1/events/:id
 * @desc    Get single event
 * @returns { event }
 */
router.get('/:id', getEvent);

/**
 * @route   GET /api/v1/events/user/my-events
 * @desc    Get current user's events
 * @auth    Required
 * @returns { events[] }
 */
router.get('/user/my-events', authenticate, getUserEvents);

/**
 * @route   POST /api/v1/events
 * @desc    Create new event
 * @auth    Required
 * @body    { title, description, location, date, startTime, endTime, category, organizer, maxAttendees?, image?, tags? }
 * @returns { event }
 */
router.post('/', authenticate, createEvent);

/**
 * @route   PUT /api/v1/events/:id
 * @desc    Update event (organizer only)
 * @auth    Required
 * @body    { title?, description?, location?, date?, startTime?, endTime?, category?, maxAttendees?, image?, tags? }
 * @returns { event }
 */
router.put('/:id', authenticate, updateEvent);

/**
 * @route   DELETE /api/v1/events/:id
 * @desc    Delete event (organizer only)
 * @auth    Required
 * @returns { message }
 */
router.delete('/:id', authenticate, deleteEvent);

/**
 * @route   POST /api/v1/events/:id/rsvp
 * @desc    RSVP to event
 * @auth    Required
 * @returns { event }
 */
router.post('/:id/rsvp', authenticate, rsvpEvent);

/**
 * @route   DELETE /api/v1/events/:id/rsvp
 * @desc    Cancel RSVP
 * @auth    Required
 * @returns { event }
 */
router.delete('/:id/rsvp', authenticate, cancelRsvp);

/**
 * @route   GET /api/v1/events/admin/pending
 * @desc    Get pending events for admin review
 * @auth    Required (admin only)
 * @returns { events[], pagination }
 */
router.get('/admin/pending', authenticate, getPendingEvents);

/**
 * @route   PUT /api/v1/events/admin/:id/approve
 * @desc    Approve event
 * @auth    Required (admin only)
 * @returns { event }
 */
router.put('/admin/:id/approve', authenticate, approveEvent);

/**
 * @route   PUT /api/v1/events/admin/:id/reject
 * @desc    Reject event
 * @auth    Required (admin only)
 * @body    { rejectionReason? }
 * @returns { event }
 */
router.put('/admin/:id/reject', authenticate, rejectEvent);

export default router;
