import ForumPost from '../models/ForumPost.js';
import ForumReply from '../models/ForumReply.js';
import User from '../models/User.js';
/**
 * Create forum post
 * POST /api/v1/forums/posts
 */
export const createPost = async (req, res) => {
    try {
        const { title, content, category, tags } = req.body;
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        if (!title || !content) {
            res.status(400).json({ error: 'Title and content are required' });
            return;
        }
        if (!category) {
            res.status(400).json({ error: 'Category is required' });
            return;
        }
        // Get author name from user
        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const post = new ForumPost({
            title,
            content,
            category,
            tags: tags || [],
            authorId: userId,
            authorName: user.username,
            status: 'published',
        });
        await post.save();
        res.status(201).json({ message: 'Post created successfully', post });
    }
    catch (error) {
        console.error('Create post error:', error);
        res.status(500).json({ error: 'Failed to create post' });
    }
};
/**
 * List forum posts
 * GET /api/v1/forums/posts
 */
export const listPosts = async (req, res) => {
    try {
        const { page = 1, limit = 20, category, search } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const filter = { status: 'published' };
        if (category) {
            filter.category = category;
        }
        if (search) {
            filter.$text = { $search: search };
        }
        const total = await ForumPost.countDocuments(filter);
        const posts = await ForumPost.find(filter)
            .populate('authorId', 'username email')
            .sort({ createdAt: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum);
        res.status(200).json({
            data: posts,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
            },
        });
    }
    catch (error) {
        console.error('List posts error:', error);
        res.status(500).json({ error: 'Failed to list posts' });
    }
};
/**
 * Get post details
 * GET /api/v1/forums/posts/:id
 */
export const getPost = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await ForumPost.findById(id)
            .populate('authorId', 'username email');
        if (!post) {
            res.status(404).json({ error: 'Post not found' });
            return;
        }
        // Increment view count
        post.viewsCount = (post.viewsCount || 0) + 1;
        await post.save();
        res.status(200).json({ data: post });
    }
    catch (error) {
        console.error('Get post error:', error);
        res.status(500).json({ error: 'Failed to get post' });
    }
};
/**
 * Update post
 * PUT /api/v1/forums/posts/:id
 */
export const updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const post = await ForumPost.findById(id);
        if (!post) {
            res.status(404).json({ error: 'Post not found' });
            return;
        }
        // Check if user is the author
        if (post.authorId.toString() !== userId) {
            res.status(403).json({ error: 'You can only update your own posts' });
            return;
        }
        const allowedFields = ['title', 'content', 'category', 'tags', 'status'];
        const updates = {};
        allowedFields.forEach(field => {
            if (field in req.body) {
                updates[field] = req.body[field];
            }
        });
        const updatedPost = await ForumPost.findByIdAndUpdate(id, updates, { new: true });
        res.status(200).json({ message: 'Post updated successfully', post: updatedPost });
    }
    catch (error) {
        console.error('Update post error:', error);
        res.status(500).json({ error: 'Failed to update post' });
    }
};
/**
 * Delete post
 * DELETE /api/v1/forums/posts/:id
 */
export const deletePost = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const post = await ForumPost.findById(id);
        if (!post) {
            res.status(404).json({ error: 'Post not found' });
            return;
        }
        // Check if user is the author
        if (post.authorId.toString() !== userId) {
            res.status(403).json({ error: 'You can only delete your own posts' });
            return;
        }
        await ForumPost.findByIdAndDelete(id);
        res.status(200).json({ message: 'Post deleted successfully' });
    }
    catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({ error: 'Failed to delete post' });
    }
};
/**
 * Add reply to post
 * POST /api/v1/forums/posts/:id/replies
 */
export const addReply = async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        if (!content) {
            res.status(400).json({ error: 'Content is required' });
            return;
        }
        // Check if post exists
        const post = await ForumPost.findById(id);
        if (!post) {
            res.status(404).json({ error: 'Post not found' });
            return;
        }
        // Get author name from user
        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const reply = new ForumReply({
            postId: id,
            content,
            authorId: userId,
            authorName: user.username,
            status: 'published',
        });
        await reply.save();
        // Increment replies count on post
        post.repliesCount = (post.repliesCount || 0) + 1;
        await post.save();
        res.status(201).json({ message: 'Reply added successfully', reply });
    }
    catch (error) {
        console.error('Add reply error:', error);
        res.status(500).json({ error: 'Failed to add reply' });
    }
};
/**
 * Get post replies
 * GET /api/v1/forums/posts/:id/replies
 */
export const getReplies = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const filter = { postId: id, status: 'published' };
        const total = await ForumReply.countDocuments(filter);
        const replies = await ForumReply.find(filter)
            .populate('authorId', 'username email')
            .sort({ createdAt: 1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum);
        res.status(200).json({
            data: replies,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
            },
        });
    }
    catch (error) {
        console.error('Get replies error:', error);
        res.status(500).json({ error: 'Failed to get replies' });
    }
};
//# sourceMappingURL=forum.controller.js.map