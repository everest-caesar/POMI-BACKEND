import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
/**
 * Send a message
 * POST /api/v1/messages
 */
export declare const sendMessage: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Get messages between two users
 * GET /api/v1/messages/:recipientId
 */
export declare const getConversation: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Get list of conversations (latest message with each user)
 * GET /api/v1/messages
 */
export declare const getConversations: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Get unread message count
 * GET /api/v1/messages/unread/count
 */
export declare const getUnreadCount: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Mark message as read
 * PATCH /api/v1/messages/:messageId/read
 */
export declare const markAsRead: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Get admin messages for current user
 * GET /api/v1/messages/admin/inbox
 */
export declare const getAdminInbox: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Send message to admin (user reply to admin team)
 * POST /api/v1/messages/admin/reply
 */
export declare const sendAdminReply: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=messageController.d.ts.map