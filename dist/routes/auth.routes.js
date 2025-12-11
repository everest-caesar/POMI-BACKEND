import { Router } from 'express';
import { register, login, getCurrentUser, adminLogin, sendVerificationCode, verifyCode, getCsrfToken, } from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';
const router = Router();
router.get('/csrf', getCsrfToken);
router.post('/send-code', sendVerificationCode);
router.post('/verify-code', verifyCode);
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
router.post('/admin/login', adminLogin);
/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current logged in user
 * @auth    Required
 * @returns { user }
 */
router.get('/me', authenticate, getCurrentUser);
export default router;
//# sourceMappingURL=auth.routes.js.map