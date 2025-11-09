import mongoose, { Document } from 'mongoose';
export interface IBusiness extends Document {
    businessName: string;
    description: string;
    category: string;
    phone?: string;
    email?: string;
    address?: string;
    ownerId: mongoose.Types.ObjectId;
    ownerName: string;
    status: 'draft' | 'active' | 'inactive';
    verified: boolean;
    rating?: number;
    views?: number;
    createdAt: Date;
    updatedAt: Date;
}
declare const Business: mongoose.Model<IBusiness, {}, {}, {}, mongoose.Document<unknown, {}, IBusiness, {}, {}> & IBusiness & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default Business;
//# sourceMappingURL=Business.d.ts.map