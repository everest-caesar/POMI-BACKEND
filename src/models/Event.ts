import mongoose, { Schema, Document } from 'mongoose';

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
  price?: number; // 0 for free, amount in cents for paid events
  isFree: boolean;
  stripeProductId?: string; // Stripe product ID for paid events
  ticketLink?: string; // Link to external ticket sales (Eventbrite, etc.)
  moderationStatus: 'pending' | 'approved' | 'rejected';
  reviewedBy?: mongoose.Types.ObjectId | null;
  reviewedAt?: Date | null;
  rejectionReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    location: {
      type: String,
      required: [true, 'Event location is required'],
    },
    date: {
      type: Date,
      required: [true, 'Event date is required'],
      validate: {
        validator: (date: Date) => date > new Date(),
        message: 'Event date must be in the future',
      },
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      match: [/^\d{2}:\d{2}$/, 'Start time must be in HH:MM format'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      match: [/^\d{2}:\d{2}$/, 'End time must be in HH:MM format'],
    },
    category: {
      type: String,
      enum: ['cultural', 'business', 'social', 'educational', 'sports', 'other'],
      default: 'other',
    },
    organizer: {
      type: String,
      required: [true, 'Organizer name is required'],
    },
    organizerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    attendees: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    maxAttendees: {
      type: Number,
      min: [1, 'Max attendees must be at least 1'],
    },
    image: String,
    tags: [String],
    price: {
      type: Number,
      default: 0,
      min: [0, 'Price cannot be negative'],
    },
    isFree: {
      type: Boolean,
      default: true,
    },
    stripeProductId: String,
    ticketLink: {
      type: String,
      validate: {
        validator: (url: string) => {
          if (!url) return true; // Optional field
          try {
            new URL(url);
            return true;
          } catch {
            return false;
          }
        },
        message: 'Invalid URL format for ticket link',
      },
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

// Index for searching events by date and category
eventSchema.index({ date: 1, category: 1 });
eventSchema.index({ organizerId: 1 });
eventSchema.index({ tags: 1 });

const Event = mongoose.model<IEvent>('Event', eventSchema);

export default Event;
