import { Router } from 'express';
import { register, login, verifyLoginCode, getCurrentUser, adminLogin, sendVerificationCode, verifyCode, getCsrfToken, } from '../controllers/authController.js';
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
 * @desc    Login user (Step 1: password verification, sends 2FA code)
 * @body    { email, password }
 * @returns { requiresVerification: true, email } on success
 */
router.post('/login', login);
/**
 * @route   POST /api/v1/auth/verify-login
 * @desc    Verify 2FA code to complete login (Step 2)
 * @body    { email, code }
 * @returns { token, user }
 */
router.post('/verify-login', verifyLoginCode);
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