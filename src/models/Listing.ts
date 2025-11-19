import mongoose, { Schema, Document } from 'mongoose';

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

const listingSchema = new Schema<IListing>(
  {
    title: {
      type: String,
      required: [true, 'Listing title is required'],
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Listing description is required'],
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['electronics', 'furniture', 'clothing', 'books', 'sports', 'toys', 'home', 'services', 'other'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    location: {
      type: String,
      required: false,
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sellerName: {
      type: String,
      required: [true, 'Seller name is required'],
    },
    images: [String],
    status: {
      type: String,
      enum: ['active', 'sold', 'inactive'],
      default: 'active',
    },
    condition: {
      type: String,
      enum: ['new', 'like-new', 'good', 'fair'],
    },
    favorites: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    moderationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
      maxlength: [500, 'Rejection reason cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Index for searching listings
listingSchema.index({ category: 1, status: 1 });
listingSchema.index({ sellerId: 1 });
listingSchema.index({ title: 'text', description: 'text' });
listingSchema.index({ createdAt: -1 });

const Listing = mongoose.model<IListing>('Listing', listingSchema);

export default Listing;
