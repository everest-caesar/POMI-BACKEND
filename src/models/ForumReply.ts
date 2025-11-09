import mongoose, { Document, Schema } from 'mongoose';

export interface IForumReply extends Document {
  postId: mongoose.Types.ObjectId;
  content: string;
  authorId: mongoose.Types.ObjectId;
  authorName: string;
  votes: number;
  status: 'published' | 'deleted';
  createdAt: Date;
  updatedAt: Date;
}

const forumReplySchema = new Schema<IForumReply>(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ForumPost',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Reply content is required'],
      minlength: [3, 'Content must be at least 3 characters'],
      maxlength: [3000, 'Content cannot exceed 3000 characters'],
      trim: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    authorName: {
      type: String,
      required: true,
    },
    votes: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['published', 'deleted'],
      default: 'published',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const ForumReply = mongoose.model<IForumReply>('ForumReply', forumReplySchema);

export default ForumReply;
