import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
/**
 * Create mentorship match
 * POST /api/v1/mentorship/matches
 */
export declare const createMatch: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * List mentorship matches
 * GET /api/v1/mentorship/matches
 */
export declare const listMatches: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Get match details
 * GET /api/v1/mentorship/matches/:id
 */
export declare const getMatch: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Update match
 * PUT /api/v1/mentorship/matches/:id
 */
export declare const updateMatch: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Delete match
 * DELETE /api/v1/mentorship/matches/:id
 */
export declare const deleteMatch: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=mentorship.controller.d.ts.map