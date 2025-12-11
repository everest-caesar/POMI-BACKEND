import mongoose, { Types } from 'mongoose';
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
declare const BusinessReview: mongoose.Model<any, {}, {}, {}, any, any>;
export default BusinessReview;
//# sourceMappingURL=BusinessReview.d.ts.map