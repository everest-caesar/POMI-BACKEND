import mongoose, { Schema } from 'mongoose';
const forumReplySchema = new Schema({
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
}, {
    timestamps: true,
});
const ForumReply = mongoose.model('ForumReply', forumReplySchema);
export default ForumReply;
//# sourceMappingURL=ForumReply.js.map