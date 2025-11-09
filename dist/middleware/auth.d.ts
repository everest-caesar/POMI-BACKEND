import { Request, Response, NextFunction } from 'express';
/**
 * Interface for authenticated request
 */
export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        username: string;
        isAdmin: boolean;
    };
}
/**
 * JWT verification middleware
 * Extracts and validates JWT token from Authorization header
 */
export declare const authenticateToken: (req: AuthRequest, res: Response, next: NextFunction) => void;
/**
 * Admin-only middleware
 * Checks if user is admin
 */
export declare const requireAdmin: (req: AuthRequest, res: Response, next: NextFunction) => void;
/**
 * Optional authentication middleware
 * Doesn't require token but validates if provided
 */
export declare const optionalAuth: (req: AuthRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map