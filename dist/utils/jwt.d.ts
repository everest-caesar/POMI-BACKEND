export interface JwtPayload {
    sub: string;
    email: string;
    username: string;
    isAdmin?: boolean;
    type: 'access' | 'refresh';
}
/**
 * Generate simple token (for testing)
 */
export declare const generateToken: (userId: string) => string;
/**
 * Generate access token
 */
export declare const generateAccessToken: (payload: Omit<JwtPayload, "type">) => string;
/**
 * Generate refresh token
 */
export declare const generateRefreshToken: (userId: string) => string;
/**
 * Verify token
 */
export declare const verifyToken: (token: string) => JwtPayload | null;
/**
 * Generate token pair (access + refresh)
 */
export declare const generateTokenPair: (userId: string, email: string, username: string, isAdmin?: boolean) => {
    accessToken: string;
    refreshToken: string;
};
//# sourceMappingURL=jwt.d.ts.map