import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
/**
 * Create marketplace listing
 * POST /api/v1/marketplace/listings
 */
export declare const createListing: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * List marketplace items
 * GET /api/v1/marketplace/listings
 */
export declare const listListings: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Get listing details
 * GET /api/v1/marketplace/listings/:id
 */
export declare const getListing: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Update listing
 * PUT /api/v1/marketplace/listings/:id
 */
export declare const updateListing: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Delete listing
 * DELETE /api/v1/marketplace/listings/:id
 */
export declare const deleteListing: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Favorite listing
 * POST /api/v1/marketplace/listings/:id/favorite
 */
export declare const favoriteListing: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Upload listing images
 * POST /api/v1/marketplace/upload
 */
export declare const uploadListingImages: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=marketplace.controller.d.ts.map