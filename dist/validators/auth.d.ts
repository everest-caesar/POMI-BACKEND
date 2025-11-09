/**
 * Validate email format
 */
export declare const validateEmail: (email: string) => boolean;
/**
 * Validate username
 */
export declare const validateUsername: (username: string) => {
    isValid: boolean;
    errors: string[];
};
/**
 * Validate registration input
 */
export declare const validateRegistration: (data: {
    email?: string;
    username?: string;
    password?: string;
}) => {
    isValid: boolean;
    errors: string[];
};
/**
 * Validate login input
 */
export declare const validateLogin: (data: {
    email?: string;
    password?: string;
}) => {
    isValid: boolean;
    errors: string[];
};
//# sourceMappingURL=auth.d.ts.map