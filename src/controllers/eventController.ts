import { Request, Response } from 'express';
import Event from '../models/Event.js';
import User from '../models/User.js';
import emailService from '../services/emailService.js';

// Create event
export const createEvent = async (req: Request, res: Response) => {
  try {
    const { title, description, location, date, startTime, endTime, category, maxAttendees, image, tags, price, ticketLink } = req.body;
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validation
    if (!title || !description || !location || !date || !startTime || !endTime || !ticketLink) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Fetch user to get organizer name
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Determine if user is admin
    const isAdmin = Boolean(user.isAdmin);

    // Create event
    const eventPrice = price ? parseFloat(price) : 0;
    const newEvent = new Event({
      title,
      description,
      location,
      date: new Date(date),
      startTime,
      endTime,
      category: category || 'other',
      organizer: user.username, // Use username from user document
      organizerId: userId,
      maxAttendees,
      image,
      tags: tags || [],
      price: eventPrice,
      isFree: eventPrice === 0,
      ticketLink,
      attendees: [userId], // Organizer is first attendee
      moderationStatus: isAdmin ? 'approved' : 'pending', // Auto-approve for admins, pending for users
      reviewedBy: isAdmin ? userId : undefined,
      reviewedAt: isAdmin ? new Date() : undefined,
    });

    await newEvent.save();

    // Send admin notification email for non-admin event creation (fire and forget)
    if (!isAdmin) {
      emailService.sendEventCreationNotification(
        title,
        new Date(date).toLocaleDateString('en-CA'),
        user.username,
        user.email
      ).catch((err) => {
        console.error('Failed to send event notification email:', err);
        // Don't fail event creation if email fails
      });
    }

    res.status(201).json({
      message: isAdmin
        ? 'Event published successfully.'
        : 'Event submitted for review. An admin will approve it shortly.',
      event: newEvent,
    });
  } catch (error: any) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
};

// Get all events with filters
export const getEvents = async (req: Request, res: Response) => {
  try {
    const { category, search, limit = 10, skip = 0 } = req.query;
    const userId = (req as any).userId;
    const user = userId ? await User.findById(userId) : null;
    const isAdmin = Boolean(user?.isAdmin);

    const filter: any = { date: { $gte: new Date() } }; // Only future events

    // Only show approved events to regular users, all events to admins
    if (!isAdmin) {
      filter.moderationStatus = 'approved';
    }

    if (category) {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    const events = await Event.find(filter)
      .limit(Number(limit))
      .skip(Number(skip))
      .sort({ date: 1 })
      .populate('organizerId', 'username email')
      .populate('attendees', 'username');

    const total = await Event.countDocuments(filter);

    res.status(200).json({
      events,
      pagination: {
        total,
        skip: Number(skip),
        limit: Number(limit),
        hasMore: Number(skip) + Number(limit) < total,
      },
    });
  } catch (error: any) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};

// Get single event
export const getEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id)
      .populate('organizerId', 'username email')
      .populate('attendees', 'username email');

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.status(200).json({ event });
  } catch (error: any) {
    console.error('Get event error:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
};

// Update event
export const updateEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, location, date, startTime, endTime, category, maxAttendees, image, tags } = req.body;
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if user is organizer
    if (event.organizerId.toString() !== userId) {
      return res.status(403).json({ error: 'Only event organizer can update' });
    }

    // Update fields
    if (title) event.title = title;
    if (description) event.description = description;
    if (location) event.location = location;
    if (date) event.date = new Date(date);
    if (startTime) event.startTime = startTime;
    if (endTime) event.endTime = endTime;
    if (category) event.category = category;
    if (maxAttendees) event.maxAttendees = maxAttendees;
    if (image) event.image = image;
    if (tags) event.tags = tags;

    await event.save();

    res.status(200).json({
      message: 'Event updated successfully',
      event,
    });
  } catch (error: any) {
    console.error('Update event error:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
};

// Delete event
export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if user is organizer
    if (event.organizerId.toString() !== userId) {
      return res.status(403).json({ error: 'Only event organizer can delete' });
    }

    await Event.deleteOne({ _id: id });

    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error: any) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
};

// RSVP to event
export const rsvpEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if user already attending
    if (event.attendees.includes(userId)) {
      return res.status(400).json({ error: 'You have already registered for this event' });
    }

    // Check max attendees
    if (event.maxAttendees && event.attendees.length >= event.maxAttendees) {
      return res.status(400).json({ error: 'Event is full' });
    }

    event.attendees.push(userId);
    await event.save();

    res.status(200).json({
      message: 'You have successfully registered for this event! 🎉',
      success: true,
      event,
    });
  } catch (error: any) {
    console.error('RSVP event error:', error);
    res.status(500).json({ error: 'Failed to RSVP to event' });
  }
};

// Cancel RSVP
export const cancelRsvp = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const index = event.attendees.findIndex((attendee) => attendee.toString() === userId);

    if (index === -1) {
      return res.status(400).json({ error: 'You are not registered for this event' });
    }

    event.attendees.splice(index, 1);
    await event.save();

    res.status(200).json({
      message: 'You have successfully cancelled your registration for this event.',
      success: true,
      event,
    });
  } catch (error: any) {
    console.error('Cancel RSVP error:', error);
    res.status(500).json({ error: 'Failed to cancel registration' });
  }
};

// Get user's events
export const getUserEvents = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const events = await Event.find({
      organizerId: userId,
    }).sort({ date: 1 });

    res.status(200).json({ events });
  } catch (error: any) {
    console.error('Get user events error:', error);
    res.status(500).json({ error: 'Failed to fetch user events' });
  }
};

// Get pending events for admin review
export const getPendingEvents = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is admin
    const user = await User.findById(userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { limit = 20, skip = 0 } = req.query;

    const events = await Event.find({ moderationStatus: 'pending' })
      .limit(Number(limit))
      .skip(Number(skip))
      .sort({ createdAt: -1 })
      .populate('organizerId', 'username email');

    const total = await Event.countDocuments({ moderationStatus: 'pending' });

    res.status(200).json({
      events,
      pagination: {
        total,
        skip: Number(skip),
        limit: Number(limit),
        hasMore: Number(skip) + Number(limit) < total,
      },
    });
  } catch (error: any) {
    console.error('Get pending events error:', error);
    res.status(500).json({ error: 'Failed to fetch pending events' });
  }
};

// Approve event (admin only)
export const approveEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is admin
    const user = await User.findById(userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    event.moderationStatus = 'approved';
    event.reviewedBy = userId;
    event.reviewedAt = new Date();
    event.rejectionReason = null;

    await event.save();

    res.status(200).json({
      message: 'Event approved successfully',
      event,
    });
  } catch (error: any) {
    console.error('Approve event error:', error);
    res.status(500).json({ error: 'Failed to approve event' });
  }
};

// Reject event (admin only)
export const rejectEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is admin
    const user = await User.findById(userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    event.moderationStatus = 'rejected';
    event.reviewedBy = userId;
    event.reviewedAt = new Date();
    event.rejectionReason = rejectionReason || 'Event rejected by admin';

    await event.save();

    res.status(200).json({
      message: 'Event rejected successfully',
      event,
    });
  } catch (error: any) {
    console.error('Reject event error:', error);
    res.status(500).json({ error: 'Failed to reject event' });
  }
};
