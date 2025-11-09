import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
/**
 * Register new user
 * POST /api/v1/auth/register
 */
export declare const register: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Login user
 * POST /api/v1/auth/login
 */
export declare const login: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Refresh access token
 * POST /api/v1/auth/refresh
 */
export declare const refreshAccessToken: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Get current user profile
 * GET /api/v1/auth/me
 */
export declare const getCurrentUser: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Logout user
 * POST /api/v1/auth/logout
 */
export declare const logout: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=auth.controller.d.ts.map