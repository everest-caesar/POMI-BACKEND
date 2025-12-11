import mongoose, { Schema } from 'mongoose'

export interface IVerificationToken {
  email: string
  type: 'signup' | 'login' | 'password_reset'
  codeHash: string
  attempts: number
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}

const verificationTokenSchema = new Schema<IVerificationToken>(
  {
    email: { type: String, required: true, index: true, lowercase: true, trim: true },
    type: {
      type: String,
      enum: ['signup', 'login', 'password_reset'],
      default: 'signup',
    },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true },
)

const VerificationToken =
  mongoose.models.VerificationToken ||
  mongoose.model<IVerificationToken>('VerificationToken', verificationTokenSchema)

export default VerificationToken
