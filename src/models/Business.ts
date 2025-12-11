import mongoose, { Document, Schema } from 'mongoose';

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
  reviewCount?: number;
  views?: number;
  images?: string[];
  featuredImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const businessSchema = new Schema<IBusiness>(
  {
    businessName: {
      type: String,
      required: [true, 'Business name is required'],
      minlength: [3, 'Business name must be at least 3 characters'],
      maxlength: [100, 'Business name cannot exceed 100 characters'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'retail',
        'restaurant',
        'services',
        'healthcare',
        'education',
        'technology',
        'finance',
        'entertainment',
        'other',
      ],
      index: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      trim: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    ownerName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'inactive'],
      default: 'draft',
      index: true,
    },
    verified: {
      type: Boolean,
      default: false,
      index: true,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    reviewCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    images: {
      type: [String],
      default: [],
    },
    featuredImage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for text search
businessSchema.index({ businessName: 'text', description: 'text' });

const Business = mongoose.model<IBusiness>('Business', businessSchema);

export default Business;
