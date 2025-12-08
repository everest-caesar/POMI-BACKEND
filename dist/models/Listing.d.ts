import mongoose, { Document } from 'mongoose';
export interface IListing extends Document {
    _id: mongoose.Types.ObjectId;
    title: string;
    description: string;
    category: string;
    price: number;
    location?: string;
    sellerId: mongoose.Types.ObjectId;
    sellerName: string;
    images: string[];
    status: 'active' | 'sold' | 'inactive';
    condition?: 'new' | 'like-new' | 'good' | 'fair';
    favorites: mongoose.Types.ObjectId[];
    views: number;
    moderationStatus: 'pending' | 'approved' | 'rejected';
    reviewedBy?: mongoose.Types.ObjectId | null;
    reviewedAt?: Date | null;
    rejectionReason?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
declare const Listing: mongoose.Model<IListing, {}, {}, {}, mongoose.Document<unknown, {}, IListing, {}, {}> & IListing & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default Listing;
//# sourceMappingURL=Listing.d.ts.map