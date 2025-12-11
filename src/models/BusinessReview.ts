import mongoose, { Schema, Types } from 'mongoose';

export interface IBusinessReview {
  _id: Types.ObjectId;
  businessId: Types.ObjectId;
  authorId?: Types.ObjectId;
  authorName: string;
  rating: number;
  comment: string;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const businessReviewSchema = new Schema<IBusinessReview>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User' },
    authorName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, minlength: 5 },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const BusinessReview =
  mongoose.models.BusinessReview ||
  mongoose.model<IBusinessReview>('BusinessReview', businessReviewSchema);

export default BusinessReview;
