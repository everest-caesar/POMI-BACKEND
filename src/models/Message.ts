import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  _id: string;
  senderId: mongoose.Types.ObjectId;
  senderName: string;
  recipientId: mongoose.Types.ObjectId;
  recipientName: string;
  listingId?: mongoose.Types.ObjectId; // Reference to marketplace listing if messaging about a listing
  content: string;
  isRead: boolean;
  readAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    senderName: {
      type: String,
      required: [true, 'Sender name is required'],
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recipientName: {
      type: String,
      required: [true, 'Recipient name is required'],
    },
    listingId: {
      type: Schema.Types.ObjectId,
      ref: 'Listing',
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      minlength: [1, 'Message cannot be empty'],
      maxlength: [5000, 'Message cannot exceed 5000 characters'],
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for optimized queries
messageSchema.index({ senderId: 1, recipientId: 1 }); // For conversation threads
messageSchema.index({ recipientId: 1, isRead: 1 }); // For unread message counts
messageSchema.index({ createdAt: -1 }); // For sorting by newest first
messageSchema.index({ listingId: 1 }); // For messages about specific listings

const Message = mongoose.model<IMessage>('Message', messageSchema);

export default Message;
