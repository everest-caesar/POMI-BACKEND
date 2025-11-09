/**
 * Validate email format
 */
export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
/**
 * Validate username
 */
export const validateUsername = (username) => {
    const errors = [];
    if (username.length < 3) {
        errors.push('Username must be at least 3 characters');
    }
    if (username.length > 30) {
        errors.push('Username must not exceed 30 characters');
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        errors.push('Username can only contain letters, numbers, underscores, and hyphens');
    }
    return {
        isValid: errors.length === 0,
        errors,
    };
};
/**
 * Validate registration input
 */
export const validateRegistration = (data) => {
    const errors = [];
    if (!data.email || !validateEmail(data.email)) {
        errors.push('Valid email is required');
    }
    if (!data.username) {
        errors.push('Username is required');
    }
    else {
        const usernameValidation = validateUsername(data.username);
        if (!usernameValidation.isValid) {
            errors.push(...usernameValidation.errors);
        }
    }
    if (!data.password) {
        errors.push('Password is required');
    }
    return {
        isValid: errors.length === 0,
        errors,
    };
};
/**
 * Validate login input
 */
export const validateLogin = (data) => {
    const errors = [];
    if (!data.email) {
        errors.push('Email is required');
    }
    if (!data.password) {
        errors.push('Password is required');
    }
    return {
        isValid: errors.length === 0,
        errors,
    };
};
//# sourceMappingURL=auth.js.map