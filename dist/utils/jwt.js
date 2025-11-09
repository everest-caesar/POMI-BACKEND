import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '3600'; // 1 hour
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '604800'; // 7 days
/**
 * Generate simple token (for testing)
 */
export const generateToken = (userId) => {
    return jwt.sign({ userId }, JWT_SECRET, {
        expiresIn: '7d',
    });
};
/**
 * Generate access token
 */
export const generateAccessToken = (payload) => {
    return jwt.sign({ ...payload, type: 'access' }, JWT_SECRET, {
        expiresIn: parseInt(JWT_EXPIRY),
    });
};
/**
 * Generate refresh token
 */
export const generateRefreshToken = (userId) => {
    return jwt.sign({ sub: userId, type: 'refresh' }, JWT_SECRET, {
        expiresIn: parseInt(JWT_REFRESH_EXPIRY),
    });
};
/**
 * Verify token
 */
export const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    }
    catch (error) {
        return null;
    }
};
/**
 * Generate token pair (access + refresh)
 */
export const generateTokenPair = (userId, email, username, isAdmin = false) => {
    const accessToken = generateAccessToken({
        sub: userId,
        email,
        username,
        isAdmin,
    });
    const refreshToken = generateRefreshToken(userId);
    return { accessToken, refreshToken };
};
//# sourceMappingURL=jwt.js.map