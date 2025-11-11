import mongoose, { Schema } from 'mongoose';
const eventSchema = new Schema({
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
            validator: (date) => date > new Date(),
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
            validator: (url) => {
                if (!url)
                    return true; // Optional field
                try {
                    new URL(url);
                    return true;
                }
                catch {
                    return false;
                }
            },
            message: 'Invalid URL format for ticket link',
        },
    },
    socialMediaLink: {
        type: String,
        validate: {
            validator: (url) => {
                if (!url)
                    return true; // Optional field
                try {
                    new URL(url);
                    return true;
                }
                catch {
                    return false;
                }
            },
            message: 'Invalid URL format for social media link',
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
}, {
    timestamps: true,
});
// Indexes for optimized performance
eventSchema.index({ date: 1, category: 1 }); // For filtering by date and category
eventSchema.index({ organizerId: 1 }); // For finding events by organizer
eventSchema.index({ tags: 1 }); // For searching by tags
eventSchema.index({ moderationStatus: 1, date: 1 }); // For approved events sorted by date
eventSchema.index({ title: 'text', description: 'text', location: 'text' }); // For text search
const Event = mongoose.model('Event', eventSchema);
export default Event;
//# sourceMappingURL=Event.js.map