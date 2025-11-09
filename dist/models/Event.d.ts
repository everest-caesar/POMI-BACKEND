import mongoose, { Document } from 'mongoose';
export interface IEvent extends Document {
    _id: string;
    title: string;
    description: string;
    location: string;
    date: Date;
    startTime: string;
    endTime: string;
    category: 'cultural' | 'business' | 'social' | 'educational' | 'sports' | 'other';
    organizer: string;
    organizerId: mongoose.Types.ObjectId;
    attendees: mongoose.Types.ObjectId[];
    maxAttendees?: number;
    image?: string;
    tags: string[];
    moderationStatus: 'pending' | 'approved' | 'rejected';
    reviewedBy?: mongoose.Types.ObjectId | null;
    reviewedAt?: Date | null;
    rejectionReason?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
declare const Event: mongoose.Model<IEvent, {}, {}, {}, mongoose.Document<unknown, {}, IEvent, {}, {}> & IEvent & Required<{
    _id: string;
}> & {
    __v: number;
}, any>;
export default Event;
//# sourceMappingURL=Event.d.ts.map