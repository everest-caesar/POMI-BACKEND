export type VerificationCodeType = 'signup' | 'login' | 'password_reset';
export declare function hashPasswordPBKDF2(password: string): string;
export declare function isPBKDF2Hash(value: string): boolean;
export declare function verifyPBKDF2(password: string, stored: string): boolean;
export declare function sanitizeInput(value: string): string;
export declare function isValidEmail(email: string): boolean;
export declare function validatePasswordStrength(password: string): {
    valid: boolean;
    errors: string[];
};
export declare function generateVerificationCode(): string;
export declare function hashVerificationCode(code: string): string;
export declare function isRateLimited(identifier: string, limit?: number, windowMs?: number): boolean;
export declare function issueCsrfToken(): string;
export declare function validateCsrfToken(token?: string | null): boolean;
//# sourceMappingURL=security.d.ts.map