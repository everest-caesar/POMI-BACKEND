import mongoose, { Schema } from 'mongoose';
const verificationTokenSchema = new Schema({
    email: { type: String, required: true, index: true, lowercase: true, trim: true },
    type: {
        type: String,
        enum: ['signup', 'login', 'password_reset'],
        default: 'signup',
    },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { timestamps: true });
const VerificationToken = mongoose.models.VerificationToken ||
    mongoose.model('VerificationToken', verificationTokenSchema);
export default VerificationToken;
//# sourceMappingURL=VerificationToken.js.map