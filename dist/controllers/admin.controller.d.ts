import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
export declare const getAdminOverview: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getAdminEvents: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getAdminBusinesses: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateBusinessStatus: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getAdminListings: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateEventStatus: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateListingStatus: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getAdminUsers: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Send admin message to user
 * POST /api/v1/admin/messages
 */
export declare const sendAdminMessage: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Get admin messages (for admin panel view)
 * GET /api/v1/admin/messages
 */
export declare const getAdminMessages: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Broadcast message to all users
 * POST /api/v1/admin/messages/broadcast
 */
export declare const broadcastAdminMessage: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Get user messages/replies to admin (inbox for admin)
 * GET /api/v1/admin/messages/inbox
 */
export declare const getAdminInbox: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Get conversation between admin and a specific user
 * GET /api/v1/admin/messages/conversation/:userId
 */
export declare const getAdminConversation: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=admin.controller.d.ts.map