import Event from '../models/Event.js';
import User from '../models/User.js';
// Create event
export const createEvent = async (req, res) => {
    try {
        const { title, description, location, date, startTime, endTime, category, maxAttendees, image, tags } = req.body;
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        // Validation
        if (!title || !description || !location || !date || !startTime || !endTime) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        // Fetch user to get organizer name
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Create event
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
            attendees: [userId], // Organizer is first attendee
        });
        await newEvent.save();
        res.status(201).json({
            message: 'Event created successfully',
            event: newEvent,
        });
    }
    catch (error) {
        console.error('Create event error:', error);
        res.status(500).json({ error: 'Failed to create event' });
    }
};
// Get all events with filters
export const getEvents = async (req, res) => {
    try {
        const { category, search, limit = 10, skip = 0 } = req.query;
        const filter = { date: { $gte: new Date() } }; // Only future events
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
    }
    catch (error) {
        console.error('Get events error:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
};
// Get single event
export const getEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const event = await Event.findById(id)
            .populate('organizerId', 'username email')
            .populate('attendees', 'username email');
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        res.status(200).json({ event });
    }
    catch (error) {
        console.error('Get event error:', error);
        res.status(500).json({ error: 'Failed to fetch event' });
    }
};
// Update event
export const updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, location, date, startTime, endTime, category, maxAttendees, image, tags } = req.body;
        const userId = req.userId;
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
        if (title)
            event.title = title;
        if (description)
            event.description = description;
        if (location)
            event.location = location;
        if (date)
            event.date = new Date(date);
        if (startTime)
            event.startTime = startTime;
        if (endTime)
            event.endTime = endTime;
        if (category)
            event.category = category;
        if (maxAttendees)
            event.maxAttendees = maxAttendees;
        if (image)
            event.image = image;
        if (tags)
            event.tags = tags;
        await event.save();
        res.status(200).json({
            message: 'Event updated successfully',
            event,
        });
    }
    catch (error) {
        console.error('Update event error:', error);
        res.status(500).json({ error: 'Failed to update event' });
    }
};
// Delete event
export const deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
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
    }
    catch (error) {
        console.error('Delete event error:', error);
        res.status(500).json({ error: 'Failed to delete event' });
    }
};
// RSVP to event
export const rsvpEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const event = await Event.findById(id);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        // Check if user already attending
        if (event.attendees.includes(userId)) {
            return res.status(400).json({ error: 'Already attending this event' });
        }
        // Check max attendees
        if (event.maxAttendees && event.attendees.length >= event.maxAttendees) {
            return res.status(400).json({ error: 'Event is full' });
        }
        event.attendees.push(userId);
        await event.save();
        res.status(200).json({
            message: 'RSVP successful',
            event,
        });
    }
    catch (error) {
        console.error('RSVP event error:', error);
        res.status(500).json({ error: 'Failed to RSVP to event' });
    }
};
// Cancel RSVP
export const cancelRsvp = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const event = await Event.findById(id);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        const index = event.attendees.findIndex((attendee) => attendee.toString() === userId);
        if (index === -1) {
            return res.status(400).json({ error: 'Not attending this event' });
        }
        event.attendees.splice(index, 1);
        await event.save();
        res.status(200).json({
            message: 'RSVP cancelled',
            event,
        });
    }
    catch (error) {
        console.error('Cancel RSVP error:', error);
        res.status(500).json({ error: 'Failed to cancel RSVP' });
    }
};
// Get user's events
export const getUserEvents = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const events = await Event.find({
            organizerId: userId,
        }).sort({ date: 1 });
        res.status(200).json({ events });
    }
    catch (error) {
        console.error('Get user events error:', error);
        res.status(500).json({ error: 'Failed to fetch user events' });
    }
};
//# sourceMappingURL=eventController.js.map