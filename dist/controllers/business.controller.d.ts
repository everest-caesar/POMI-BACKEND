import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
/**
 * Create business
 * POST /api/v1/businesses
 */
export declare const createBusiness: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * List businesses
 * GET /api/v1/businesses
 */
export declare const listBusinesses: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Get business details
 * GET /api/v1/businesses/:id
 */
export declare const getBusiness: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Update business
 * PUT /api/v1/businesses/:id
 */
export declare const updateBusiness: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Delete business
 * DELETE /api/v1/businesses/:id
 */
export declare const deleteBusiness: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Get business reviews
 * GET /api/v1/businesses/:id/reviews
 */
export declare const getBusinessReviews: (req: AuthRequest, res: Response) => Promise<void>;
export declare const addBusinessReview: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Upload business images
 * POST /api/v1/businesses/:id/images
 */
export declare const uploadBusinessImages: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=business.controller.d.ts.map