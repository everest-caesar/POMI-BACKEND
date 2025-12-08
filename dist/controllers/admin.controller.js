import { Types } from 'mongoose';
import User from '../models/User.js';
import Event from '../models/Event.js';
import Business from '../models/Business.js';
import Listing from '../models/Listing.js';
import Message from '../models/Message.js';
export const getAdminOverview = async (req, res) => {
    try {
        const [totalUsers, totalEvents, totalBusinesses, pendingBusinesses, pendingEvents, pendingListings, attendeeStats,] = await Promise.all([
            User.countDocuments(),
            Event.countDocuments({ $or: [{ moderationStatus: 'approved' }, { moderationStatus: { $exists: false } }] }),
            Business.countDocuments(),
            Business.countDocuments({ status: 'draft' }),
            Event.countDocuments({ moderationStatus: 'pending' }),
            Listing.countDocuments({ moderationStatus: 'pending' }),
            Event.aggregate([
                {
                    $project: {
                        attendeeCount: { $size: { $ifNull: ['$attendees', []] } },
                    },
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$attendeeCount' },
                    },
                },
            ]),
        ]);
        const totalRegistrations = attendeeStats.length > 0 ? attendeeStats[0].total : 0;
        res.status(200).json({
            metrics: {
                totalUsers,
                totalEvents,
                totalBusinesses,
                totalRegistrations,
                pendingBusinesses,
                pendingEvents,
                pendingListings,
            },
        });
    }
    catch (error) {
        console.error('Admin overview error:', error);
        res.status(500).json({ error: 'Failed to load admin overview' });
    }
};
export const getAdminEvents = async (req, res) => {
    try {
        const events = await Event.find()
            .populate('organizerId', 'username email area workOrSchool')
            .populate('reviewedBy', 'username email')
            .populate('attendees', 'username email area workOrSchool')
            .sort({ moderationStatus: 1, date: -1 });
        const formattedEvents = events.map((event) => ({
            id: event._id.toString(),
            title: event.title,
            description: event.description,
            date: event.date,
            startTime: event.startTime,
            endTime: event.endTime,
            category: event.category,
            location: event.location,
            maxAttendees: event.maxAttendees ?? null,
            tags: event.tags || [],
            price: typeof event.price === 'number' ? event.price : null,
            isFree: event.isFree,
            organizer: event.organizer,
            organizerProfile: event.organizerId
                ? {
                    id: event.organizerId._id?.toString(),
                    username: event.organizerId.username,
                    email: event.organizerId.email,
                    area: event.organizerId.area,
                    workOrSchool: event.organizerId.workOrSchool,
                }
                : null,
            ticketLink: event.ticketLink ?? null,
            socialMediaLink: event.socialMediaLink ?? null,
            image: event.image ?? null,
            attendeeCount: event.attendees?.length || 0,
            attendees: (event.attendees || []).map((attendee) => ({
                id: attendee._id?.toString(),
                username: attendee.username,
                email: attendee.email,
                area: attendee.area,
                workOrSchool: attendee.workOrSchool,
            })),
            moderationStatus: event.moderationStatus ?? 'approved',
            rejectionReason: event.rejectionReason ?? null,
            reviewedAt: event.reviewedAt,
            reviewedBy: event.reviewedBy
                ? {
                    id: event.reviewedBy._id?.toString(),
                    username: event.reviewedBy.username,
                    email: event.reviewedBy.email,
                }
                : null,
        }));
        res.status(200).json({ events: formattedEvents });
    }
    catch (error) {
        console.error('Admin events error:', error);
        res.status(500).json({ error: 'Failed to load events for admin' });
    }
};
export const getAdminBusinesses = async (req, res) => {
    try {
        const businesses = await Business.find()
            .populate('ownerId', 'username email area workOrSchool')
            .sort({ createdAt: -1 });
        const formattedBusinesses = businesses.map((business) => ({
            id: business._id.toString(),
            businessName: business.businessName,
            category: business.category,
            status: business.status,
            verified: business.verified,
            rating: business.rating,
            views: business.views,
            createdAt: business.createdAt,
            owner: business.ownerId
                ? {
                    id: business.ownerId._id?.toString(),
                    username: business.ownerId.username,
                    email: business.ownerId.email,
                    area: business.ownerId.area,
                    workOrSchool: business.ownerId.workOrSchool,
                }
                : null,
        }));
        res.status(200).json({ businesses: formattedBusinesses });
    }
    catch (error) {
        console.error('Admin businesses error:', error);
        res.status(500).json({ error: 'Failed to load businesses for admin' });
    }
};
export const updateBusinessStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, verified } = req.body;
        const allowedStatuses = ['draft', 'active', 'inactive'];
        if (!status && typeof verified !== 'boolean') {
            res
                .status(400)
                .json({ error: 'Provide a new status or verified flag to update' });
            return;
        }
        if (status && !allowedStatuses.includes(status)) {
            res.status(400).json({ error: 'Invalid business status' });
            return;
        }
        const updates = {};
        if (status) {
            updates.status = status;
        }
        if (typeof verified === 'boolean') {
            updates.verified = verified;
        }
        const business = await Business.findByIdAndUpdate(id, updates, {
            new: true,
        }).populate('ownerId', 'username email area workOrSchool');
        if (!business) {
            res.status(404).json({ error: 'Business not found' });
            return;
        }
        res.status(200).json({
            message: 'Business updated successfully',
            business: {
                id: business._id.toString(),
                businessName: business.businessName,
                category: business.category,
                status: business.status,
                verified: business.verified,
                owner: business.ownerId
                    ? {
                        id: business.ownerId._id?.toString(),
                        username: business.ownerId.username,
                        email: business.ownerId.email,
                    }
                    : null,
            },
        });
    }
    catch (error) {
        console.error('Admin update business error:', error);
        res.status(500).json({ error: 'Failed to update business status' });
    }
};
export const getAdminListings = async (req, res) => {
    try {
        const listings = await Listing.find()
            .populate('sellerId', 'username email area workOrSchool')
            .populate('reviewedBy', 'username email')
            .sort({ moderationStatus: 1, createdAt: -1 });
        const formattedListings = listings.map((listing) => ({
            id: listing._id.toString(),
            title: listing.title,
            price: listing.price,
            category: listing.category,
            location: listing.location,
            status: listing.status,
            moderationStatus: listing.moderationStatus ?? 'approved',
            rejectionReason: listing.rejectionReason ?? null,
            createdAt: listing.createdAt,
            seller: listing.sellerId
                ? {
                    id: listing.sellerId._id?.toString(),
                    username: listing.sellerId.username,
                    email: listing.sellerId.email,
                    area: listing.sellerId.area,
                    workOrSchool: listing.sellerId.workOrSchool,
                }
                : null,
            reviewedBy: listing.reviewedBy
                ? {
                    id: listing.reviewedBy._id?.toString(),
                    username: listing.reviewedBy.username,
                    email: listing.reviewedBy.email,
                }
                : null,
            reviewedAt: listing.reviewedAt,
        }));
        res.status(200).json({ listings: formattedListings });
    }
    catch (error) {
        console.error('Admin marketplace error:', error);
        res.status(500).json({ error: 'Failed to load marketplace listings for admin' });
    }
};
export const updateEventStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, rejectionReason } = req.body;
        if (!['pending', 'approved', 'rejected'].includes(status)) {
            res.status(400).json({ error: 'Invalid moderation status' });
            return;
        }
        const event = await Event.findByIdAndUpdate(id, {
            moderationStatus: status,
            reviewedBy: req.user?._id
                ? new Types.ObjectId(req.user._id)
                : undefined,
            reviewedAt: new Date(),
            rejectionReason: status === 'rejected' ? rejectionReason || null : null,
        }, { new: true, runValidators: false }).populate('organizerId', 'username email');
        if (!event) {
            res.status(404).json({ error: 'Event not found' });
            return;
        }
        res.status(200).json({
            message: `Event ${status}`,
            event: {
                id: event._id.toString(),
                title: event.title,
                moderationStatus: event.moderationStatus,
                rejectionReason: event.rejectionReason,
                reviewedAt: event.reviewedAt,
            },
        });
    }
    catch (error) {
        console.error('Admin event moderation error:', error);
        res.status(500).json({ error: 'Failed to update event status' });
    }
};
export const updateListingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, rejectionReason } = req.body;
        if (!['pending', 'approved', 'rejected'].includes(status)) {
            res.status(400).json({ error: 'Invalid moderation status' });
            return;
        }
        const updateData = {
            moderationStatus: status,
            reviewedBy: req.user?._id
                ? new Types.ObjectId(req.user._id)
                : undefined,
            reviewedAt: new Date(),
            rejectionReason: status === 'rejected' ? rejectionReason || null : null,
        };
        if (status === 'approved') {
            updateData.status = 'active';
        }
        if (status === 'rejected') {
            updateData.status = 'inactive';
        }
        const listing = await Listing.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: false,
        }).populate('sellerId', 'username email');
        if (!listing) {
            res.status(404).json({ error: 'Listing not found' });
            return;
        }
        res.status(200).json({
            message: `Listing ${status}`,
            listing: {
                id: listing._id.toString(),
                title: listing.title,
                moderationStatus: listing.moderationStatus,
                rejectionReason: listing.rejectionReason,
                status: listing.status,
                reviewedAt: listing.reviewedAt,
            },
        });
    }
    catch (error) {
        console.error('Admin marketplace moderation error:', error);
        res.status(500).json({ error: 'Failed to update listing status' });
    }
};
export const getAdminUsers = async (req, res) => {
    try {
        const { limit = 50, skip = 0, search } = req.query;
        const limitNum = Math.min(parseInt(limit) || 50, 100);
        const skipNum = parseInt(skip) || 0;
        const filter = {};
        // Search by username or email
        if (search) {
            filter.$or = [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }
        const [users, total] = await Promise.all([
            User.find(filter)
                .select('_id username email area workOrSchool age isAdmin createdAt')
                .sort({ createdAt: -1 })
                .limit(limitNum)
                .skip(skipNum),
            User.countDocuments(filter),
        ]);
        const formattedUsers = users.map((user) => ({
            id: user._id.toString(),
            username: user.username,
            email: user.email,
            area: user.area,
            workOrSchool: user.workOrSchool,
            age: user.age,
            isAdmin: user.isAdmin,
            joinedAt: user.createdAt,
        }));
        res.status(200).json({
            users: formattedUsers,
            pagination: {
                total,
                limit: limitNum,
                skip: skipNum,
            },
        });
    }
    catch (error) {
        console.error('Admin users error:', error);
        res.status(500).json({ error: 'Failed to load community members' });
    }
};
/**
 * Send admin message to user
 * POST /api/v1/admin/messages
 */
export const sendAdminMessage = async (req, res) => {
    try {
        const adminId = req.userId;
        // Verify user is admin
        const admin = await User.findById(adminId);
        if (!admin || !admin.isAdmin) {
            res.status(403).json({ error: 'Unauthorized: Admin access required' });
            return;
        }
        const { recipientId, content } = req.body;
        if (!recipientId || !content) {
            res.status(400).json({ error: 'Recipient ID and message content are required' });
            return;
        }
        // Get recipient
        const recipient = await User.findById(recipientId);
        if (!recipient) {
            res.status(404).json({ error: 'Recipient not found' });
            return;
        }
        // Create admin message
        const message = await Message.create({
            senderId: adminId,
            senderName: 'Admin Team', // Always show as "Admin Team"
            recipientId,
            recipientName: recipient.username,
            content: content.trim(),
            isRead: false,
            isAdminMessage: true,
        });
        res.status(201).json({
            message: 'Admin message sent successfully',
            data: message,
        });
    }
    catch (error) {
        console.error('Send admin message error:', error);
        res.status(500).json({ error: 'Failed to send admin message' });
    }
};
/**
 * Get admin messages (for admin panel view)
 * GET /api/v1/admin/messages
 */
export const getAdminMessages = async (req, res) => {
    try {
        const adminId = req.userId;
        // Verify user is admin
        const admin = await User.findById(adminId);
        if (!admin || !admin.isAdmin) {
            res.status(403).json({ error: 'Unauthorized: Admin access required' });
            return;
        }
        // Get all admin messages
        const messages = await Message.find({ isAdminMessage: true })
            .sort({ createdAt: -1 })
            .limit(100)
            .lean();
        res.status(200).json({
            data: messages,
        });
    }
    catch (error) {
        console.error('Get admin messages error:', error);
        res.status(500).json({ error: 'Failed to fetch admin messages' });
    }
};
/**
 * Broadcast message to all users
 * POST /api/v1/admin/messages/broadcast
 */
export const broadcastAdminMessage = async (req, res) => {
    try {
        const adminId = req.userId;
        // Verify user is admin
        const admin = await User.findById(adminId);
        if (!admin || !admin.isAdmin) {
            res.status(403).json({ error: 'Unauthorized: Admin access required' });
            return;
        }
        const { content } = req.body;
        if (!content) {
            res.status(400).json({ error: 'Message content is required' });
            return;
        }
        // Get all non-admin users
        const users = await User.find({ isAdmin: false }).select('_id username');
        // Create admin message for each user
        const messages = await Promise.all(users.map((user) => Message.create({
            senderId: adminId,
            senderName: 'Admin Team',
            recipientId: user._id,
            recipientName: user.username,
            content: content.trim(),
            isRead: false,
            isAdminMessage: true,
        })));
        res.status(201).json({
            message: `Admin message broadcasted to ${messages.length} users`,
            count: messages.length,
        });
    }
    catch (error) {
        console.error('Broadcast admin message error:', error);
        res.status(500).json({ error: 'Failed to broadcast admin message' });
    }
};
/**
 * Get user messages/replies to admin (inbox for admin)
 * GET /api/v1/admin/messages/inbox
 */
export const getAdminInbox = async (req, res) => {
    try {
        const adminId = req.userId;
        // Verify user is admin
        const admin = await User.findById(adminId);
        if (!admin || !admin.isAdmin) {
            res.status(403).json({ error: 'Unauthorized: Admin access required' });
            return;
        }
        // Get all messages where admin is the recipient (messages FROM users TO admin)
        const messages = await Message.find({
            recipientId: adminId,
            isAdminMessage: false, // Regular messages from users, not admin-sent messages
        })
            .populate('senderId', 'username email')
            .sort({ createdAt: -1 })
            .limit(100)
            .lean();
        res.status(200).json({
            data: messages,
            count: messages.length,
        });
    }
    catch (error) {
        console.error('Get admin inbox error:', error);
        res.status(500).json({ error: 'Failed to fetch admin inbox' });
    }
};
/**
 * Get conversation between admin and a specific user
 * GET /api/v1/admin/messages/conversation/:userId
 */
export const getAdminConversation = async (req, res) => {
    try {
        const adminId = req.userId;
        const { userId } = req.params;
        // Verify user is admin
        const admin = await User.findById(adminId);
        if (!admin || !admin.isAdmin) {
            res.status(403).json({ error: 'Unauthorized: Admin access required' });
            return;
        }
        // Verify the other user exists
        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        // Get all messages between admin and this user (bidirectional)
        const messages = await Message.find({
            $or: [
                { senderId: adminId, recipientId: userId },
                { senderId: userId, recipientId: adminId },
            ],
        })
            .sort({ createdAt: 1 }) // Chronological order
            .lean();
        // Mark messages from user as read
        await Message.updateMany({
            senderId: userId,
            recipientId: adminId,
            isRead: false,
        }, {
            $set: { isRead: true },
        });
        res.status(200).json({
            data: messages,
            count: messages.length,
        });
    }
    catch (error) {
        console.error('Get admin conversation error:', error);
        res.status(500).json({ error: 'Failed to fetch conversation' });
    }
};
//# sourceMappingURL=admin.controller.js.map