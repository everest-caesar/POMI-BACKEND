import { generateTokenPair, verifyToken } from '../utils/jwt.js';
import { validatePasswordStrength } from '../utils/bcrypt.js';
import { validateRegistration, validateLogin, } from '../validators/auth.js';
import User from '../models/User.js';
const OTTAWA_AREAS = [
    'Downtown Ottawa',
    'Barrhaven',
    'Kanata',
    'Nepean',
    'Gloucester',
    'Orleans',
    'Vanier',
    'Westboro',
    'Rockcliffe Park',
    'Sandy Hill',
    'The Glebe',
    'Bytown',
    'South Ottawa',
    'North Ottawa',
    'Outside Ottawa',
];
const ADMIN_INVITE_CODE = process.env.ADMIN_INVITE_CODE;
/**
 * Register new user
 * POST /api/v1/auth/register
 */
export const register = async (req, res) => {
    try {
        const { email, username, password } = req.body;
        const rawAge = req.body.age;
        const rawArea = req.body.area;
        const rawWorkOrSchool = req.body.workOrSchool;
        const adminInviteCode = req.body.adminInviteCode;
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
        if (rawAge === undefined || rawAge === null || rawAge === '') {
            res.status(400).json({ error: 'Age is required' });
            return;
        }
        const parsedAge = typeof rawAge === 'string' ? parseInt(rawAge, 10) : Number(rawAge);
        if (Number.isNaN(parsedAge)) {
            res.status(400).json({ error: 'Age must be a number' });
            return;
        }
        if (parsedAge < 13 || parsedAge > 120) {
            res.status(400).json({ error: 'Age must be between 13 and 120' });
            return;
        }
        if (typeof rawArea !== 'string' || rawArea.trim() === '') {
            res.status(400).json({ error: 'Area is required' });
            return;
        }
        const trimmedArea = rawArea.trim();
        if (!OTTAWA_AREAS.includes(trimmedArea)) {
            res.status(400).json({ error: 'Please select a valid area' });
            return;
        }
        if (typeof rawWorkOrSchool !== 'string' || rawWorkOrSchool.trim() === '') {
            res.status(400).json({ error: 'School or workplace is required' });
            return;
        }
        const trimmedWorkOrSchool = rawWorkOrSchool.trim();
        let isAdmin = false;
        if (adminInviteCode) {
            if (!ADMIN_INVITE_CODE) {
                res.status(403).json({ error: 'Admin registration is disabled' });
                return;
            }
            if (adminInviteCode !== ADMIN_INVITE_CODE) {
                res.status(400).json({ error: 'Invalid admin invite code' });
                return;
            }
            isAdmin = true;
        }
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            res.status(409).json({ error: 'Email already registered' });
            return;
        }
        // Create new user
        const newUser = new User({
            email,
            username,
            password, // Password will be hashed by the model's pre-save hook
            age: parsedAge,
            area: trimmedArea,
            workOrSchool: trimmedWorkOrSchool,
            isAdmin,
        });
        console.log('📝 Before save:', {
            age: newUser.age,
            area: newUser.area,
            workOrSchool: newUser.workOrSchool,
            isAdmin: newUser.isAdmin,
            isAdminType: typeof newUser.isAdmin,
        });
        await newUser.save();
        console.log('✅ After save:', {
            age: newUser.age,
            area: newUser.area,
            workOrSchool: newUser.workOrSchool,
            isAdmin: newUser.isAdmin,
            isAdminType: typeof newUser.isAdmin,
        });
        // Generate tokens
        const { accessToken, refreshToken } = generateTokenPair(newUser._id.toString(), newUser.email, newUser.username, isAdmin);
        // Build response object with all fields
        const userResponse = {
            _id: newUser._id,
            email: newUser.email,
            username: newUser.username,
            createdAt: newUser.createdAt,
            isAdmin: newUser.isAdmin,
        };
        // Add optional fields if they exist
        if (newUser.age !== undefined && newUser.age !== null) {
            userResponse.age = newUser.age;
        }
        if (newUser.area !== undefined && newUser.area !== null) {
            userResponse.area = newUser.area;
        }
        if (newUser.workOrSchool !== undefined && newUser.workOrSchool !== null) {
            userResponse.workOrSchool = newUser.workOrSchool;
        }
        console.log('📤 Registration response:', { isAdmin: userResponse.isAdmin });
        res.status(201).json({
            message: 'User registered successfully',
            user: userResponse,
            token: accessToken,
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
};
/**
 * Login user
 * POST /api/v1/auth/login
 */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Validate input
        const validation = validateLogin({ email, password });
        if (!validation.isValid) {
            res.status(400).json({ errors: validation.errors });
            return;
        }
        // Find user in database (select password for comparison)
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }
        // Verify password using the model's comparePassword method
        const passwordMatch = await user.comparePassword(password);
        if (!passwordMatch) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }
        // Debug logging
        console.log('🔐 Login - User object:', {
            id: user._id,
            email: user.email,
            isAdmin: user.isAdmin,
            isAdminType: typeof user.isAdmin,
            toJSON: user.toJSON?.(),
        });
        // Generate tokens
        const { accessToken } = generateTokenPair(user._id.toString(), user.email, user.username, user.isAdmin);
        res.status(200).json({
            message: 'Login successful',
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                isAdmin: user.isAdmin,
                age: user.age,
                area: user.area,
                workOrSchool: user.workOrSchool,
            },
            token: accessToken,
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};
/**
 * Refresh access token
 * POST /api/v1/auth/refresh
 */
export const refreshAccessToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            res.status(400).json({ error: 'Refresh token required' });
            return;
        }
        // Verify token signature
        const decoded = verifyToken(refreshToken);
        if (!decoded) {
            res.status(401).json({ error: 'Invalid refresh token' });
            return;
        }
        // Find user in database
        const user = await User.findById(decoded.sub);
        if (!user) {
            res.status(401).json({ error: 'User not found' });
            return;
        }
        // Generate new access token
        const { accessToken } = generateTokenPair(user._id.toString(), user.email, user.username, false);
        res.status(200).json({
            token: accessToken,
        });
    }
    catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({ error: 'Token refresh failed' });
    }
};
/**
 * Get current user profile
 * GET /api/v1/auth/me
 */
export const getCurrentUser = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        // Find user in database
        const user = await User.findById(req.user.id);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.status(200).json({
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                age: user.age,
                area: user.area,
                workOrSchool: user.workOrSchool,
                isAdmin: user.isAdmin,
                createdAt: user.createdAt,
            },
        });
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to retrieve user' });
    }
};
/**
 * Logout user
 * POST /api/v1/auth/logout
 */
export const logout = async (req, res) => {
    try {
        // With JWT, logout is handled client-side by removing the token
        // Server just confirms the logout
        res.status(200).json({ message: 'Logout successful' });
    }
    catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
    }
};
//# sourceMappingURL=auth.controller.js.map