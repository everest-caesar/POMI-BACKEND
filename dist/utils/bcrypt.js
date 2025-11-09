import bcryptjs from 'bcryptjs';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10');
/**
 * Hash password
 */
export const hashPassword = async (password) => {
    const salt = await bcryptjs.genSalt(BCRYPT_ROUNDS);
    return bcryptjs.hash(password, salt);
};
/**
 * Compare password with hash
 */
export const comparePassword = async (password, hash) => {
    return bcryptjs.compare(password, hash);
};
/**
 * Validate password strength
 */
export const validatePasswordStrength = (password) => {
    const errors = [];
    if (password.length < 8) {
        errors.push('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*]/.test(password)) {
        errors.push('Password must contain at least one special character (!@#$%^&*)');
    }
    return {
        isValid: errors.length === 0,
        errors,
    };
};
//# sourceMappingURL=bcrypt.js.map