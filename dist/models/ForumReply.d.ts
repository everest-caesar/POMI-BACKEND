import mongoose, { Document } from 'mongoose';
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
declare const ForumReply: mongoose.Model<IForumReply, {}, {}, {}, mongoose.Document<unknown, {}, IForumReply, {}, {}> & IForumReply & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default ForumReply;
//# sourceMappingURL=ForumReply.d.ts.map