import mongoose, { Document } from 'mongoose';
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
    status: 'published' | 'archived' | 'deleted';
    createdAt: Date;
    updatedAt: Date;
}
declare const ForumPost: mongoose.Model<IForumPost, {}, {}, {}, mongoose.Document<unknown, {}, IForumPost, {}, {}> & IForumPost & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default ForumPost;
//# sourceMappingURL=ForumPost.d.ts.map