import { Router } from 'express';
import { register, login, getCurrentUser } from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @body    { email, password, username, age, area, workOrSchool, adminInviteCode? }
 * @returns { token, user }
 */
router.post('/register', register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @body    { email, password }
 * @returns { token, user }
 */
router.post('/login', login);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current logged in user
 * @auth    Required
 * @returns { user }
 */
router.get('/me', authenticate, getCurrentUser);

export default router;
