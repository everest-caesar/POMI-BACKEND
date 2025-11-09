import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
export declare const getAdminOverview: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getAdminEvents: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getAdminBusinesses: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateBusinessStatus: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getAdminListings: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateEventStatus: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateListingStatus: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=admin.controller.d.ts.map