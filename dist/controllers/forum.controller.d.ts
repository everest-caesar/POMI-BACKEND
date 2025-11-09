import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
/**
 * Create forum post
 * POST /api/v1/forums/posts
 */
export declare const createPost: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * List forum posts
 * GET /api/v1/forums/posts
 */
export declare const listPosts: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Get post details
 * GET /api/v1/forums/posts/:id
 */
export declare const getPost: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Update post
 * PUT /api/v1/forums/posts/:id
 */
export declare const updatePost: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Delete post
 * DELETE /api/v1/forums/posts/:id
 */
export declare const deletePost: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Add reply to post
 * POST /api/v1/forums/posts/:id/replies
 */
export declare const addReply: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Get post replies
 * GET /api/v1/forums/posts/:id/replies
 */
export declare const getReplies: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=forum.controller.d.ts.map