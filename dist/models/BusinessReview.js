import mongoose, { Schema } from 'mongoose';
const businessReviewSchema = new Schema({
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User' },
    authorName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, minlength: 5 },
    verified: { type: Boolean, default: false },
}, { timestamps: true });
const BusinessReview = mongoose.models.BusinessReview ||
    mongoose.model('BusinessReview', businessReviewSchema);
export default BusinessReview;
//# sourceMappingURL=BusinessReview.js.map