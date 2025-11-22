import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { ensureAdminAccount } from '../services/adminAccount.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_NAME = process.env.ADMIN_NAME || 'Pomi Admin';
const ADMIN_AREA = process.env.ADMIN_AREA || 'Downtown Ottawa';
const ADMIN_WORK = process.env.ADMIN_WORK || 'Community Leadership Team';

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

// Generate JWT token
const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRE } as any);
};

// Register new user
export const register = async (req: Request, res: Response) => {
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

    // Password length validation
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
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
    let parsedAge: number | undefined;
    const numericAge =
      typeof rawAge === 'string' ? parseInt(rawAge, 10) : Number(rawAge);
    if (Number.isNaN(numericAge)) {
      return res.status(400).json({ error: 'Age must be a number' });
    }
    if (numericAge < 13 || numericAge > 120) {
      return res.status(400).json({ error: 'Age must be between 13 and 120' });
    }
    parsedAge = numericAge;

    if (typeof rawArea !== 'string' || rawArea.trim() === '') {
      return res.status(400).json({ error: 'Area is required' });
    }
    const trimmedArea = rawArea.trim();
    if (!OTTAWA_AREAS.includes(trimmedArea)) {
      return res.status(400).json({ error: 'Please select a valid area' });
    }

    if (typeof rawWorkOrSchool !== 'string' || rawWorkOrSchool.trim() === '') {
      return res.status(400).json({ error: 'School or workplace is required' });
    }
    const parsedWorkOrSchool = rawWorkOrSchool.trim();

    // Create new user
    const newUser = new User({
      email: normalizedEmail,
      password,
      username,
      age: parsedAge,
      area: trimmedArea,
      workOrSchool: parsedWorkOrSchool,
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
  } catch (error: any) {
    console.error('Register error:', error);

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
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
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

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
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Compare passwords
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken(user._id.toString());

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
      token,
      user: userWithoutPassword,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const adminLogin = async (req: Request, res: Response) => {
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
  } catch (error: any) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Admin login failed' });
  }
};

// Get current user
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId; // Set by auth middleware

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
  } catch (error: any) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};
