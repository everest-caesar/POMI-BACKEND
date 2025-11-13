import mongoose from 'mongoose';
import Message from '../models/Message.js';
import User from '../models/User.js';
const isValidObjectId = (value) => {
    if (!value)
        return false;
    return mongoose.Types.ObjectId.isValid(value);
};
/**
 * Send a message
 * POST /api/v1/messages
 */
export const sendMessage = async (req, res) => {
    try {
        const { recipientId, content, listingId } = req.body;
        const senderId = req.userId;
        if (!senderId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        if (!recipientId || !content) {
            res.status(400).json({ error: 'Recipient ID and message content are required' });
            return;
        }
        if (!isValidObjectId(recipientId)) {
            res.status(400).json({ error: 'Invalid recipient ID' });
            return;
        }
        if (listingId && !isValidObjectId(listingId)) {
            res.status(400).json({ error: 'Invalid listing ID' });
            return;
        }
        if (content.trim().length === 0) {
            res.status(400).json({ error: 'Message cannot be empty' });
            return;
        }
        // Get sender and recipient info
        const [sender, recipient] = await Promise.all([
            User.findById(senderId),
            User.findById(recipientId),
        ]);
        if (!sender) {
            res.status(404).json({ error: 'Sender not found' });
            return;
        }
        if (!recipient) {
            res.status(404).json({ error: 'Recipient not found' });
            return;
        }
        if (senderId === recipientId) {
            res.status(400).json({ error: 'Cannot send message to yourself' });
            return;
        }
        // Create message
        const message = new Message({
            senderId,
            senderName: sender.username,
            recipientId,
            recipientName: recipient.username,
            listingId: listingId || undefined,
            content: content.trim(),
            isRead: false,
        });
        await message.save();
        res.status(201).json({
            message: 'Message sent successfully',
            data: message,
        });
    }
    catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
};
/**
 * Get messages between two users
 * GET /api/v1/messages/:recipientId
 */
export const getConversation = async (req, res) => {
    try {
        const { recipientId } = req.params;
        const { limit = 50, skip = 0 } = req.query;
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        if (!isValidObjectId(recipientId)) {
            res.status(400).json({ error: 'Invalid recipient ID' });
            return;
        }
        const limitNum = Math.min(parseInt(limit, 10) || 50, 100);
        const skipNum = parseInt(skip) || 0;
        // Get messages between these two users
        const messages = await Message.find({
            $or: [
                { senderId: userId, recipientId },
                { senderId: recipientId, recipientId: userId },
            ],
        })
            .sort({ createdAt: -1 })
            .skip(skipNum)
            .limit(limitNum)
            .lean();
        const total = await Message.countDocuments({
            $or: [
                { senderId: userId, recipientId },
                { senderId: recipientId, recipientId: userId },
            ],
        });
        // Mark messages as read
        await Message.updateMany({
            recipientId: userId,
            senderId: recipientId,
            isRead: false,
        }, {
            $set: { isRead: true, readAt: new Date() },
        });
        res.status(200).json({
            data: messages.reverse(), // Return in chronological order (oldest first)
            pagination: {
                total,
                skip: skipNum,
                limit: limitNum,
                hasMore: skipNum + limitNum < total,
            },
        });
    }
    catch (error) {
        console.error('Get conversation error:', error);
        res.status(500).json({ error: 'Failed to fetch conversation' });
    }
};
/**
 * Get list of conversations (latest message with each user)
 * GET /api/v1/messages
 */
export const getConversations = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        if (!isValidObjectId(userId)) {
            res.status(400).json({ error: 'Invalid user ID' });
            return;
        }
        const userObjectId = new mongoose.Types.ObjectId(userId);
        const mapConversation = (conv, includeListing = false) => ({
            userId: typeof conv._id === 'object' && conv._id?.toString
                ? conv._id.toString()
                : conv._id,
            userName: conv.otherUserName,
            lastMessage: conv.lastMessage,
            lastMessageTime: conv.lastMessageTime,
            unreadCount: conv.unreadCount ?? 0,
            hasListing: includeListing ? Boolean(conv.hasListing) : false,
            lastListingId: includeListing && conv.lastListingId && conv.lastListingId.toString
                ? conv.lastListingId.toString()
                : null,
        });
        const primaryPipeline = ([
            {
                $match: {
                    $or: [{ senderId: userObjectId }, { recipientId: userObjectId }],
                },
            },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ['$senderId', userObjectId] },
                            '$recipientId',
                            '$senderId',
                        ],
                    },
                    otherUserName: {
                        $cond: [
                            { $eq: ['$senderId', userObjectId] },
                            '$recipientName',
                            '$senderName',
                        ],
                    },
                    lastMessage: { $first: '$content' },
                    lastMessageTime: { $first: '$createdAt' },
                    lastListingId: { $first: '$listingId' },
                    hasListing: {
                        $max: {
                            $cond: [{ $ifNull: ['$listingId', false] }, 1, 0],
                        },
                    },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ['$recipientId', userObjectId] },
                                        { $eq: ['$isRead', false] },
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },
                },
            },
            { $sort: { lastMessageTime: -1 } },
        ]);
        const fallbackPipeline = ([
            {
                $match: {
                    $or: [{ senderId: userId }, { recipientId: userId }],
                },
            },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ['$senderId', userId] },
                            '$recipientId',
                            '$senderId',
                        ],
                    },
                    otherUserName: {
                        $cond: [
                            { $eq: ['$senderId', userId] },
                            '$recipientName',
                            '$senderName',
                        ],
                    },
                    lastMessage: { $first: '$content' },
                    lastMessageTime: { $first: '$createdAt' },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ['$recipientId', userId] },
                                        { $eq: ['$isRead', false] },
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },
                },
            },
            { $sort: { lastMessageTime: -1 } },
        ]);
        try {
            const conversations = (await Message.aggregate(primaryPipeline));
            res.status(200).json({
                data: conversations.map((conv) => mapConversation(conv, true)),
            });
            return;
        }
        catch (primaryError) {
            console.error('Get conversations pipeline error:', primaryError);
        }
        try {
            const fallbackConversations = (await Message.aggregate(fallbackPipeline));
            res.status(200).json({
                data: fallbackConversations.map((conv) => mapConversation(conv, false)),
            });
        }
        catch (fallbackError) {
            console.error('Get conversations fallback error:', fallbackError);
            res.status(500).json({ error: 'Failed to fetch conversations' });
        }
    }
    catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
};
/**
 * Get unread message count
 * GET /api/v1/messages/unread/count
 */
export const getUnreadCount = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        if (!isValidObjectId(userId)) {
            res.status(400).json({ error: 'Invalid user ID' });
            return;
        }
        const count = await Message.countDocuments({
            recipientId: userId,
            isRead: false,
        });
        res.status(200).json({ unreadCount: count });
    }
    catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ error: 'Failed to get unread count' });
    }
};
/**
 * Mark message as read
 * PATCH /api/v1/messages/:messageId/read
 */
export const markAsRead = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        if (!isValidObjectId(messageId)) {
            res.status(400).json({ error: 'Invalid message ID' });
            return;
        }
        const message = await Message.findById(messageId);
        if (!message) {
            res.status(404).json({ error: 'Message not found' });
            return;
        }
        if (message.recipientId.toString() !== userId) {
            res.status(403).json({ error: 'You can only mark your own messages as read' });
            return;
        }
        message.isRead = true;
        message.readAt = new Date();
        await message.save();
        res.status(200).json({ message: 'Message marked as read', data: message });
    }
    catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ error: 'Failed to mark message as read' });
    }
};
//# sourceMappingURL=messageController.js.map