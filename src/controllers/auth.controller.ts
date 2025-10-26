import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { generateTokenPair, verifyToken } from '../utils/jwt';
import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/bcrypt';
import {
  validateEmail,
  validateRegistration,
  validateLogin,
} from '../validators/auth';

// TODO: Replace with actual database calls
const mockUsers: Record<string, any> = {};
const mockTokens: Record<string, any> = {};

/**
 * Register new user
 * POST /api/v1/auth/register
 */
export const register = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { email, username, password, firstName, lastName } = req.body;

    // Validate input
    const validation = validateRegistration({ email, username, password });
    if (!validation.isValid) {
      res.status(400).json({ errors: validation.errors });
      return;
    }

    // Validate password strength
    const passwordStrength = validatePasswordStrength(password);
    if (!passwordStrength.isValid) {
      res.status(400).json({ errors: passwordStrength.errors });
      return;
    }

    // Check if user exists (mock)
    if (mockUsers[email]) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user (mock)
    const userId = `user_${Date.now()}`;
    mockUsers[email] = {
      id: userId,
      email,
      username,
      passwordHash,
      firstName: firstName || '',
      lastName: lastName || '',
      emailVerified: false,
      createdAt: new Date(),
    };

    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair(
      userId,
      email,
      username,
      false
    );

    // Store refresh token (mock)
    mockTokens[refreshToken] = {
      userId,
      type: 'refresh',
      createdAt: new Date(),
    };

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: userId,
        email,
        username,
        firstName: firstName || '',
        lastName: lastName || '',
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

/**
 * Login user
 * POST /api/v1/auth/login
 */
export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate input
    const validation = validateLogin({ email, password });
    if (!validation.isValid) {
      res.status(400).json({ errors: validation.errors });
      return;
    }

    // Find user (mock)
    const user = mockUsers[email];
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Verify password
    const passwordMatch = await comparePassword(password, user.passwordHash);
    if (!passwordMatch) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair(
      user.id,
      email,
      user.username,
      user.isAdmin || false
    );

    // Store refresh token (mock)
    mockTokens[refreshToken] = {
      userId: user.id,
      type: 'refresh',
      createdAt: new Date(),
    };

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

/**
 * Refresh access token
 * POST /api/v1/auth/refresh
 */
export const refreshAccessToken = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token required' });
      return;
    }

    // Verify refresh token (mock)
    const tokenData = mockTokens[refreshToken];
    if (!tokenData) {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    // Verify token signature
    const decoded = verifyToken(refreshToken);
    if (!decoded || decoded.type !== 'refresh') {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    // Find user (mock)
    const user = Object.values(mockUsers).find((u) => u.id === decoded.sub);
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    // Generate new access token
    const { accessToken } = generateTokenPair(
      user.id,
      user.email,
      user.username,
      user.isAdmin || false
    );

    res.status(200).json({
      accessToken,
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
};

/**
 * Get current user profile
 * GET /api/v1/auth/me
 */
export const getCurrentUser = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Find user (mock)
    const user = Object.values(mockUsers).find((u) => u.id === req.user!.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to retrieve user' });
  }
};

/**
 * Logout user
 * POST /api/v1/auth/logout
 */
export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken && mockTokens[refreshToken]) {
      delete mockTokens[refreshToken];
    }

    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};
