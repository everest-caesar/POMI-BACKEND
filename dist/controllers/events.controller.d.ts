import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
/**
 * Create new event
 * POST /api/v1/events
 */
export declare const createEvent: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * List all events
 * GET /api/v1/events
 */
export declare const listEvents: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Get event details
 * GET /api/v1/events/:id
 */
export declare const getEvent: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Update event
 * PUT /api/v1/events/:id
 */
export declare const updateEvent: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Delete event
 * DELETE /api/v1/events/:id
 */
export declare const deleteEvent: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * RSVP to event
 * POST /api/v1/events/:id/rsvp
 */
export declare const rsvpEvent: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Cancel RSVP
 * DELETE /api/v1/events/:id/rsvp
 */
export declare const cancelRsvp: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=events.controller.d.ts.map