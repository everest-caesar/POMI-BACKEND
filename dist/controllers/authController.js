import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { ensureAdminAccount } from '../services/adminAccount.js';
import VerificationToken from '../models/VerificationToken.js';
import { generateVerificationCode, hashVerificationCode, isRateLimited, issueCsrfToken, validatePasswordStrength, MAX_LOGIN_ATTEMPTS, LOCKOUT_DURATION_MS, LOCKOUT_DURATION_MINUTES, } from '../utils/security.js';
import emailService from '../services/emailService.js';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_NAME = process.env.ADMIN_NAME || 'Pomi Admin';
const ADMIN_AREA = process.env.ADMIN_AREA || '';
const ADMIN_WORK = process.env.ADMIN_WORK || '';
// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
};
// Register new user
export const register = async (req, res) => {
    try {
        const { email, password, username } = req.body;
        const rawAge = req.body.age;
        const rawArea = req.body.area;
        const rawWorkOrSchool = req.body.workOrSchool;
        const normalizedEmail = email.toLowerCase();
        if (ADMIN_EMAIL && normalizedEmail === ADMIN_EMAIL) {
            return res.status(403).json({ error: 'This email is reserved for the Pomi admin account.' });
        }
        // Validation
        if (!email || !password || !username) {
            return res.status(400).json({ error: 'Email, password, and username are required' });
        }
        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }
        // Strong password validation
        const passwordValidation = validatePasswordStrength(password);
        if (!passwordValidation.valid) {
            return res.status(400).json({
                error: passwordValidation.errors[0],
                passwordErrors: passwordValidation.errors
            });
        }
        // Check if user already exists
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(409).json({ error: 'Email already registered' });
        }
        // Require extended profile details
        if (rawAge === undefined || rawAge === null || rawAge === '') {
            return res.status(400).json({ error: 'Age is required' });
        }
        let parsedAge;
        const numericAge = typeof rawAge === 'string' ? parseInt(rawAge, 10) : Number(rawAge);
        if (Number.isNaN(numericAge)) {
            return res.status(400).json({ error: 'Age must be a number' });
        }
        if (numericAge < 13 || numericAge > 120) {
            return res.status(400).json({ error: 'Age must be between 13 and 120' });
        }
        parsedAge = numericAge;
        // Optional: area and workOrSchool fields
        let trimmedArea;
        let parsedWorkOrSchool;
        if (rawArea && typeof rawArea === 'string' && rawArea.trim() !== '') {
            trimmedArea = rawArea.trim();
        }
        if (rawWorkOrSchool && typeof rawWorkOrSchool === 'string' && rawWorkOrSchool.trim() !== '') {
            parsedWorkOrSchool = rawWorkOrSchool.trim();
        }
        // Create new user
        const newUser = new User({
            email: normalizedEmail,
            password,
            username,
            age: parsedAge,
            ...(trimmedArea && { area: trimmedArea }),
            ...(parsedWorkOrSchool && { workOrSchool: parsedWorkOrSchool }),
            isAdmin: false,
        });
        await newUser.save();
        // Generate token
        const token = generateToken(newUser._id.toString());
        // Return user data without password
        const userWithoutPassword = {
            _id: newUser._id,
            email: newUser.email,
            username: newUser.username,
            createdAt: newUser.createdAt,
            age: parsedAge,
            area: trimmedArea,
            workOrSchool: parsedWorkOrSchool,
            isAdmin: false,
        };
        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: userWithoutPassword,
        });
    }
    catch (error) {
        console.error('Register error:', error);
        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((err) => err.message);
            return res.status(400).json({ error: messages.join(', ') });
        }
        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(409).json({ error: 'Email already registered' });
        }
        res.status(500).json({ error: 'Registration failed' });
    }
};
// Login user
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Get client IP for rate limiting
        const clientIp = req.ip || req.headers['x-forwarded-for'] || 'unknown';
        // Rate limiting by IP
        if (isRateLimited(`login:${clientIp}`)) {
            return res.status(429).json({
                error: 'Too many login attempts. Please try again later.'
            });
        }
        // Validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        const normalizedEmail = email.toLowerCase();
        if (ADMIN_EMAIL && normalizedEmail === ADMIN_EMAIL) {
            return res.status(403).json({
                error: 'Admin access is restricted. Use the dedicated admin console to sign in.',
            });
        }
        // Find user (need to include password field for comparison)
        const user = await User.findOne({ email: normalizedEmail }).select('+password +failedLoginAttempts +lockUntil');
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        // Check account lockout
        if (user.lockUntil && user.lockUntil > new Date()) {
            const remainingMinutes = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
            return res.status(429).json({
                error: `Account temporarily locked. Try again in ${remainingMinutes} minute(s).`,
            });
        }
        // Compare passwords
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            // Record failed login attempt
            const failedAttempts = (user.failedLoginAttempts || 0) + 1;
            if (failedAttempts >= MAX_LOGIN_ATTEMPTS) {
                // Lock the account
                user.failedLoginAttempts = failedAttempts;
                user.lockUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
                await user.save();
                return res.status(429).json({
                    error: `Too many failed attempts. Account locked for ${LOCKOUT_DURATION_MINUTES} minutes.`,
                });
            }
            else {
                user.failedLoginAttempts = failedAttempts;
                await user.save();
                const attemptsRemaining = MAX_LOGIN_ATTEMPTS - failedAttempts;
                return res.status(401).json({
                    error: `Invalid email or password. ${attemptsRemaining} attempt(s) remaining.`
                });
            }
        }
        if (user.isAdmin) {
            return res.status(403).json({
                error: 'Admin accounts must use the secure admin console to sign in.',
            });
        }
        // Password verified - now send 2FA verification code
        // Clear failed attempts on successful password
        user.failedLoginAttempts = 0;
        user.lockUntil = null;
        await user.save();
        // Generate and send verification code for 2FA
        const code = generateVerificationCode();
        const codeHash = hashVerificationCode(code);
        // Remove any existing login tokens for this email
        await VerificationToken.deleteMany({ email: normalizedEmail, type: 'login' });
        // Create new verification token (expires in 10 minutes)
        await VerificationToken.create({
            email: normalizedEmail,
            type: 'login',
            codeHash,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        });
        // Send verification code via SendGrid
        const emailSent = await emailService.sendVerificationCodeEmail(normalizedEmail, code, 'login');
        if (!emailSent) {
            console.warn('Failed to send verification code email, but continuing with login flow');
        }
        // Return response indicating 2FA is required
        res.status(200).json({
            message: 'Verification code sent to your email',
            requiresVerification: true,
            email: normalizedEmail,
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};
// Verify login code (2FA step 2)
export const verifyLoginCode = async (req, res) => {
    try {
        const { email, code } = req.body;
        if (!email || !code) {
            return res.status(400).json({ error: 'Email and verification code are required' });
        }
        const normalizedEmail = email.toLowerCase().trim();
        // Find the verification token
        const token = await VerificationToken.findOne({
            email: normalizedEmail,
            type: 'login',
            expiresAt: { $gt: new Date() },
        });
        if (!token) {
            return res.status(400).json({ error: 'Invalid or expired verification code. Please login again.' });
        }
        // Check max attempts
        if (token.attempts >= 5) {
            await VerificationToken.deleteOne({ _id: token._id });
            return res.status(400).json({ error: 'Too many failed attempts. Please login again.' });
        }
        // Verify the code
        const codeHash = hashVerificationCode(code);
        if (codeHash !== token.codeHash) {
            token.attempts += 1;
            await token.save();
            const attemptsRemaining = 5 - token.attempts;
            return res.status(400).json({
                error: `Invalid verification code. ${attemptsRemaining} attempt(s) remaining.`
            });
        }
        // Code verified - delete token
        await VerificationToken.deleteOne({ _id: token._id });
        // Find user and generate JWT
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Update lastLogin
        user.lastLogin = new Date();
        await user.save();
        // Generate token
        const jwtToken = generateToken(user._id.toString());
        // Return user data without password
        const userWithoutPassword = {
            _id: user._id,
            email: user.email,
            username: user.username,
            createdAt: user.createdAt,
            ...(user.age !== undefined && user.age !== null ? { age: user.age } : {}),
            ...(user.area ? { area: user.area } : {}),
            ...(user.workOrSchool ? { workOrSchool: user.workOrSchool } : {}),
            isAdmin: user.isAdmin,
        };
        res.status(200).json({
            message: 'Login successful',
            token: jwtToken,
            user: userWithoutPassword,
        });
    }
    catch (error) {
        console.error('Verify login code error:', error);
        res.status(500).json({ error: 'Verification failed' });
    }
};
export const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
            return res.status(503).json({ error: 'Admin authentication is not configured.' });
        }
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        const normalizedEmail = email.toLowerCase();
        if (normalizedEmail !== ADMIN_EMAIL) {
            return res.status(403).json({
                error: 'This route is reserved for the designated Pomi admin credential.',
            });
        }
        if (password !== ADMIN_PASSWORD) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const adminUser = await ensureAdminAccount({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            name: ADMIN_NAME,
            area: ADMIN_AREA,
            workOrSchool: ADMIN_WORK,
        });
        const token = generateToken(adminUser._id.toString());
        return res.status(200).json({
            message: 'Admin login successful',
            token,
            user: {
                _id: adminUser._id,
                email: adminUser.email,
                username: adminUser.username,
                createdAt: adminUser.createdAt,
                ...(adminUser.age !== undefined && adminUser.age !== null ? { age: adminUser.age } : {}),
                ...(adminUser.area ? { area: adminUser.area } : {}),
                ...(adminUser.workOrSchool ? { workOrSchool: adminUser.workOrSchool } : {}),
                isAdmin: true,
            },
        });
    }
    catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ error: 'Admin login failed' });
    }
};
// Get current user
export const getCurrentUser = async (req, res) => {
    try {
        const userId = req.userId; // Set by auth middleware
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json({
            user: {
                _id: user._id,
                email: user.email,
                username: user.username,
                createdAt: user.createdAt,
                ...(user.age !== undefined && user.age !== null ? { age: user.age } : {}),
                ...(user.area ? { area: user.area } : {}),
                ...(user.workOrSchool ? { workOrSchool: user.workOrSchool } : {}),
                isAdmin: user.isAdmin,
            },
        });
    }
    catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
};
// Get CSRF token
export const getCsrfToken = async (req, res) => {
    try {
        const token = issueCsrfToken();
        res.status(200).json({ csrfToken: token });
    }
    catch (error) {
        console.error('CSRF token error:', error);
        res.status(500).json({ error: 'Failed to generate CSRF token' });
    }
};
// Send verification code
export const sendVerificationCode = async (req, res) => {
    try {
        const { email, type = 'signup' } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        const normalizedEmail = email.toLowerCase().trim();
        // Rate limiting
        if (isRateLimited(`verification:${normalizedEmail}`)) {
            return res.status(429).json({ error: 'Too many requests. Please wait before trying again.' });
        }
        // Generate and hash code
        const code = generateVerificationCode();
        const codeHash = hashVerificationCode(code);
        // Remove any existing tokens for this email and type
        await VerificationToken.deleteMany({ email: normalizedEmail, type });
        // Create new token (expires in 10 minutes)
        await VerificationToken.create({
            email: normalizedEmail,
            type,
            codeHash,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        });
        // Send email
        await emailService.sendVerificationCodeEmail(normalizedEmail, code, type);
        res.status(200).json({ message: 'Verification code sent' });
    }
    catch (error) {
        console.error('Send verification code error:', error);
        res.status(500).json({ error: 'Failed to send verification code' });
    }
};
// Verify code
export const verifyCode = async (req, res) => {
    try {
        const { email, code, type = 'signup' } = req.body;
        if (!email || !code) {
            return res.status(400).json({ error: 'Email and code are required' });
        }
        const normalizedEmail = email.toLowerCase().trim();
        // Find token
        const token = await VerificationToken.findOne({
            email: normalizedEmail,
            type,
            expiresAt: { $gt: new Date() },
        });
        if (!token) {
            return res.status(400).json({ error: 'Invalid or expired verification code' });
        }
        // Check attempts
        if (token.attempts >= 5) {
            await VerificationToken.deleteOne({ _id: token._id });
            return res.status(400).json({ error: 'Too many failed attempts. Please request a new code.' });
        }
        // Verify code
        const codeHash = hashVerificationCode(code);
        if (codeHash !== token.codeHash) {
            token.attempts += 1;
            await token.save();
            return res.status(400).json({ error: 'Invalid verification code' });
        }
        // Delete token after successful verification
        await VerificationToken.deleteOne({ _id: token._id });
        res.status(200).json({ message: 'Code verified successfully', verified: true });
    }
    catch (error) {
        console.error('Verify code error:', error);
        res.status(500).json({ error: 'Failed to verify code' });
    }
};
//# sourceMappingURL=authController.js.map