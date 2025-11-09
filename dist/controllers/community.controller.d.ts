import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
/**
 * Create community group
 * POST /api/v1/community/groups
 */
export declare const createGroup: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * List community groups
 * GET /api/v1/community/groups
 */
export declare const listGroups: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Get group details
 * GET /api/v1/community/groups/:id
 */
export declare const getGroup: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Update group
 * PUT /api/v1/community/groups/:id
 */
export declare const updateGroup: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Delete group
 * DELETE /api/v1/community/groups/:id
 */
export declare const deleteGroup: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Join group
 * POST /api/v1/community/groups/:id/members
 */
export declare const joinGroup: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Leave group
 * DELETE /api/v1/community/groups/:id/members/:userId
 */
export declare const leaveGroup: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=community.controller.d.ts.map