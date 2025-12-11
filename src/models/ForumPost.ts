import mongoose, { Document, Schema } from 'mongoose';

export interface IForumPost extends Document {
  title: string;
  content: string;
  category: string;
  tags: string[];
  authorId: mongoose.Types.ObjectId;
  authorName: string;
  repliesCount: number;
  viewsCount: number;
  votes: number;
  reports: number;
  status: 'published' | 'archived' | 'deleted';
  createdAt: Date;
  updatedAt: Date;
}

const forumPostSchema = new Schema<IForumPost>(
  {
    title: {
      type: String,
      required: [true, 'Post title is required'],
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
      trim: true,
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Post content is required'],
      minlength: [10, 'Content must be at least 10 characters'],
      maxlength: [5000, 'Content cannot exceed 5000 characters'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'general',
        'culture',
        'business',
        'technology',
        'education',
        'health',
        'events',
        'other',
      ],
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
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
    repliesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    viewsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    votes: {
      type: Number,
      default: 0,
    },
    reports: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['published', 'archived', 'deleted'],
      default: 'published',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for text search
forumPostSchema.index({ title: 'text', content: 'text' });

const ForumPost = mongoose.model<IForumPost>('ForumPost', forumPostSchema);

export default ForumPost;
