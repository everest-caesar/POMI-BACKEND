import mongoose from 'mongoose';
export interface IVerificationToken {
    email: string;
    type: 'signup' | 'login' | 'password_reset';
    codeHash: string;
    attempts: number;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
declare const VerificationToken: mongoose.Model<any, {}, {}, {}, any, any>;
export default VerificationToken;
//# sourceMappingURL=VerificationToken.d.ts.map