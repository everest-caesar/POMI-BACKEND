import { Types } from 'mongoose';
import Event from '../models/Event.js';
import User from '../models/User.js';
/**
 * Create new event
 * POST /api/v1/events
 */
export const createEvent = async (req, res) => {
    try {
        const { title, description, location, date, startTime, endTime, category, maxAttendees } = req.body;
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        // Validate input
        if (!title || !date || !startTime || !endTime) {
            res
                .status(400)
                .json({ error: 'Title, date, start time, and end time are required' });
            return;
        }
        if (!category) {
            res.status(400).json({ error: 'Category is required' });
            return;
        }
        // Get organizer name from user
        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const isAdmin = Boolean(user.isAdmin);
        const event = new Event({
            title,
            description,
            location,
            date,
            startTime,
            endTime,
            category,
            organizer: user.username,
            organizerId: userId,
            maxAttendees,
            moderationStatus: isAdmin ? 'approved' : 'pending',
            reviewedBy: isAdmin ? new Types.ObjectId(user._id) : undefined,
            reviewedAt: isAdmin ? new Date() : undefined,
            rejectionReason: undefined,
        });
        await event.save();
        res.status(201).json({
            message: isAdmin
                ? 'Event published successfully.'
                : 'Event submitted for review. An admin will approve it shortly.',
            event,
        });
    }
    catch (error) {
        console.error('Create event error:', error);
        res.status(500).json({ error: 'Failed to create event' });
    }
};
/**
 * List all events
 * GET /api/v1/events
 */
export const listEvents = async (req, res) => {
    try {
        const { page = 1, limit = 20, category, moderationStatus } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const filter = {};
        if (category) {
            filter.category = category;
        }
        if (moderationStatus) {
            filter.moderationStatus = moderationStatus;
        }
        else {
            filter.$or = [
                { moderationStatus: 'approved' },
                { moderationStatus: { $exists: false } },
            ];
        }
        const total = await Event.countDocuments(filter);
        const events = await Event.find(filter)
            .populate('organizerId', 'username email')
            .sort({ date: 1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum);
        res.status(200).json({
            data: events,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
            },
        });
    }
    catch (error) {
        console.error('List events error:', error);
        res.status(500).json({ error: 'Failed to list events' });
    }
};
/**
 * Get event details
 * GET /api/v1/events/:id
 */
export const getEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const event = await Event.findById(id)
            .populate('organizerId', 'username email');
        if (!event) {
            res.status(404).json({ error: 'Event not found' });
            return;
        }
        const requesterId = req.userId ? req.userId.toString() : null;
        const isAdmin = Boolean(req.isAdmin);
        const isOwner = requesterId && event.organizerId
            ? event.organizerId.toString() === requesterId
            : false;
        if (event.moderationStatus &&
            event.moderationStatus !== 'approved' &&
            !isOwner &&
            !isAdmin) {
            res.status(404).json({ error: 'Event not found' });
            return;
        }
        res.status(200).json({ data: event });
    }
    catch (error) {
        console.error('Get event error:', error);
        res.status(500).json({ error: 'Failed to get event' });
    }
};
/**
 * Update event
 * PUT /api/v1/events/:id
 */
export const updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const event = await Event.findById(id);
        if (!event) {
            res.status(404).json({ error: 'Event not found' });
            return;
        }
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const isAdmin = Boolean(req.isAdmin);
        const currentUser = isAdmin ? await User.findById(userId) : null;
        const isOwner = event.organizerId.toString() === userId.toString();
        if (!isOwner && !isAdmin) {
            res.status(403).json({ error: 'You can only update your own events' });
            return;
        }
        const allowedFields = ['title', 'description', 'location', 'date', 'startTime', 'endTime', 'category', 'maxAttendees'];
        allowedFields.forEach((field) => {
            if (field in req.body) {
                event[field] = req.body[field];
            }
        });
        if (isAdmin && 'moderationStatus' in req.body) {
            const nextStatus = req.body.moderationStatus;
            if (!['pending', 'approved', 'rejected'].includes(nextStatus)) {
                res.status(400).json({ error: 'Invalid moderation status' });
                return;
            }
            event.moderationStatus = nextStatus;
            event.reviewedBy = currentUser
                ? new Types.ObjectId(currentUser._id)
                : event.reviewedBy ?? null;
            event.reviewedAt = new Date();
            event.rejectionReason =
                nextStatus === 'rejected' ? req.body.rejectionReason || null : null;
        }
        else if (!isAdmin) {
            event.moderationStatus = 'pending';
            event.reviewedBy = null;
            event.reviewedAt = null;
            event.rejectionReason = null;
        }
        await event.save();
        res.status(200).json({ message: 'Event updated successfully', event });
    }
    catch (error) {
        console.error('Update event error:', error);
        res.status(500).json({ error: 'Failed to update event' });
    }
};
/**
 * Delete event
 * DELETE /api/v1/events/:id
 */
export const deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const event = await Event.findById(id);
        if (!event) {
            res.status(404).json({ error: 'Event not found' });
            return;
        }
        // Verify user owns the event
        const isAdmin = Boolean(req.isAdmin);
        if (event.organizerId.toString() !== userId && !isAdmin) {
            res.status(403).json({ error: 'You can only delete your own events' });
            return;
        }
        await Event.findByIdAndDelete(id);
        res.status(200).json({ message: 'Event deleted successfully' });
    }
    catch (error) {
        console.error('Delete event error:', error);
        res.status(500).json({ error: 'Failed to delete event' });
    }
};
/**
 * RSVP to event
 * POST /api/v1/events/:id/rsvp
 */
export const rsvpEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const event = await Event.findById(id);
        if (!event) {
            res.status(404).json({ error: 'Event not found' });
            return;
        }
        // Check if user already RSVPed
        const alreadyRSVPed = event.attendees.includes(userId);
        if (alreadyRSVPed) {
            res.status(400).json({ error: 'You have already RSVP\'d to this event' });
            return;
        }
        // Add user to attendees
        event.attendees.push(userId);
        await event.save();
        res.status(201).json({ message: 'RSVP recorded', event });
    }
    catch (error) {
        console.error('RSVP error:', error);
        res.status(500).json({ error: 'Failed to RSVP' });
    }
};
/**
 * Cancel RSVP
 * DELETE /api/v1/events/:id/rsvp
 */
export const cancelRsvp = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const event = await Event.findById(id);
        if (!event) {
            res.status(404).json({ error: 'Event not found' });
            return;
        }
        // Remove user from attendees
        event.attendees = event.attendees.filter(attendeeId => attendeeId.toString() !== userId);
        await event.save();
        res.status(200).json({ message: 'RSVP cancelled', event });
    }
    catch (error) {
        console.error('Cancel RSVP error:', error);
        res.status(500).json({ error: 'Failed to cancel RSVP' });
    }
};
//# sourceMappingURL=events.controller.js.map