import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import Message from '../models/Message.js';
import User from '../models/User.js';

/**
 * Send a message
 * POST /api/v1/messages
 */
export const sendMessage = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { recipientId, content, listingId } = req.body;
    const senderId = (req as any).userId;

    if (!senderId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!recipientId || !content) {
      res.status(400).json({ error: 'Recipient ID and message content are required' });
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
  } catch (error: any) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

/**
 * Get messages between two users
 * GET /api/v1/messages/:recipientId
 */
export const getConversation = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { recipientId } = req.params;
    const { limit = 50, skip = 0 } = req.query;
    const userId = (req as any).userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const limitNum = Math.min(parseInt(limit as string) || 50, 100);
    const skipNum = parseInt(skip as string) || 0;

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
    await Message.updateMany(
      {
        recipientId: userId,
        senderId: recipientId,
        isRead: false,
      },
      {
        $set: { isRead: true, readAt: new Date() },
      }
    );

    res.status(200).json({
      data: messages.reverse(), // Return in chronological order (oldest first)
      pagination: {
        total,
        skip: skipNum,
        limit: limitNum,
        hasMore: skipNum + limitNum < total,
      },
    });
  } catch (error: any) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
};

/**
 * Get list of conversations (latest message with each user)
 * GET /api/v1/messages
 */
export const getConversations = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Get all unique users this person has messaged
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ senderId: userId }, { recipientId: userId }],
        },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$senderId', userId] },
              '$recipientId',
              '$senderId',
            ],
          } as any,
          otherUserName: {
            $cond: [
              { $eq: ['$senderId', userId] },
              '$recipientName',
              '$senderName',
            ],
          } as any,
          lastMessage: { $last: '$content' },
          lastMessageTime: { $last: '$createdAt' },
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
            } as any,
          },
        },
      },
      {
        $sort: { lastMessageTime: -1 },
      },
    ]) as any;

    res.status(200).json({
      data: conversations.map((conv) => ({
        userId: conv._id,
        userName: conv.otherUserName,
        lastMessage: conv.lastMessage,
        lastMessageTime: conv.lastMessageTime,
        unreadCount: conv.unreadCount,
      })),
    });
  } catch (error: any) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
};

/**
 * Get unread message count
 * GET /api/v1/messages/unread/count
 */
export const getUnreadCount = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const count = await Message.countDocuments({
      recipientId: userId,
      isRead: false,
    });

    res.status(200).json({ unreadCount: count });
  } catch (error: any) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
};

/**
 * Mark message as read
 * PATCH /api/v1/messages/:messageId/read
 */
export const markAsRead = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { messageId } = req.params;
    const userId = (req as any).userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
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
  } catch (error: any) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
};
