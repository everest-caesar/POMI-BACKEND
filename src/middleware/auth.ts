import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

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

const assignUserContext = (req: Request, decoded: any) => {
  if (typeof decoded !== 'object' || decoded === null) {
    return;
  }

  const inferredId = decoded.sub || decoded.userId || decoded.id;
  (req as any).userId = inferredId;
  (req as AuthRequest).user = {
    id: inferredId,
    email: decoded.email,
    username: decoded.username,
    isAdmin: decoded.isAdmin || false,
  };
};

/**
 * JWT verification middleware
 * Extracts and validates JWT token from Authorization header
 */
export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  const secret = process.env.JWT_SECRET || 'fallback-secret';

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      res.status(403).json({ error: 'Invalid or expired token' });
      return;
    }

    assignUserContext(req, decoded);
    next();
  });
};

/**
 * Admin-only middleware
 * Checks if user is admin
 */
export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user?.isAdmin) {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  next();
};

/**
 * Optional authentication middleware
 * Doesn't require token but validates if provided
 */
export const optionalAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const secret = process.env.JWT_SECRET || 'fallback-secret';

    jwt.verify(token, secret, (err, decoded) => {
      if (!err) {
        assignUserContext(req, decoded);
      }
    });
  }

  next();
};
