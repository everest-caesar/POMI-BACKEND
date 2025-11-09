import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { createEvent, getEvents, getEvent, updateEvent, deleteEvent, rsvpEvent, cancelRsvp, getUserEvents, } from '../controllers/eventController.js';
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
export default router;
//# sourceMappingURL=events.routes.js.map