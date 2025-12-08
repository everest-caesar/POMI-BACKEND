import mongoose, { Document } from 'mongoose';
export interface IMessage extends Document {
    _id: mongoose.Types.ObjectId;
    senderId: mongoose.Types.ObjectId;
    senderName: string;
    recipientId: mongoose.Types.ObjectId;
    recipientName: string;
    listingId?: mongoose.Types.ObjectId;
    clientMessageId?: string | null;
    content: string;
    isRead: boolean;
    readAt?: Date | null;
    isAdminMessage: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const Message: mongoose.Model<IMessage, {}, {}, {}, mongoose.Document<unknown, {}, IMessage, {}, {}> & IMessage & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default Message;
//# sourceMappingURL=Message.d.ts.map