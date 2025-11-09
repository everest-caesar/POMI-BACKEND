import request from 'supertest';
import app from '../app.js';
import User from '../models/User.js';
import ForumPost from '../models/ForumPost.js';
import ForumReply from '../models/ForumReply.js';
import { generateToken } from '../utils/jwt.js';
describe('Forum API', () => {
    let userId;
    let userId2;
    let postId;
    let replyId;
    let token;
    let token2;
    beforeAll(async () => {
        // Create test users
        const user = await User.create({
            username: 'forumuser',
            email: 'forumuser@test.com',
            password: 'hashedpassword123',
        });
        userId = user._id.toString();
        token = generateToken(userId);
        const user2 = await User.create({
            username: 'forumuser2',
            email: 'forumuser2@test.com',
            password: 'hashedpassword123',
        });
        userId2 = user2._id.toString();
        token2 = generateToken(userId2);
    });
    afterAll(async () => {
        await User.deleteMany({});
        await ForumPost.deleteMany({});
        await ForumReply.deleteMany({});
    });
    // Authentication Tests
    describe('Authentication', () => {
        it('should reject unauthorized requests', async () => {
            const response = await request(app)
                .post('/api/v1/forums/posts')
                .send({
                title: 'Test Post',
                content: 'Test content here',
                category: 'general',
            });
            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Unauthorized');
        });
        it('should accept requests with valid token', async () => {
            const response = await request(app)
                .post('/api/v1/forums/posts')
                .set('Authorization', `Bearer ${token}`)
                .send({
                title: 'Test Post',
                content: 'Test content here',
                category: 'general',
            });
            expect(response.status).toBe(201);
            expect(response.body.post).toBeDefined();
        });
    });
    // Create Post Tests
    describe('Create Forum Post', () => {
        it('should create a forum post with valid data', async () => {
            const response = await request(app)
                .post('/api/v1/forums/posts')
                .set('Authorization', `Bearer ${token}`)
                .send({
                title: 'My First Forum Post',
                content: 'This is a great discussion topic!',
                category: 'general',
                tags: ['discussion', 'community'],
            });
            expect(response.status).toBe(201);
            expect(response.body.post.title).toBe('My First Forum Post');
            expect(response.body.post.authorId).toBeDefined();
            expect(response.body.post.authorName).toBe('forumuser');
            postId = response.body.post._id.toString();
        });
        it('should reject post without title', async () => {
            const response = await request(app)
                .post('/api/v1/forums/posts')
                .set('Authorization', `Bearer ${token}`)
                .send({
                content: 'This is a great discussion topic!',
                category: 'general',
            });
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Title and content are required');
        });
        it('should reject post without content', async () => {
            const response = await request(app)
                .post('/api/v1/forums/posts')
                .set('Authorization', `Bearer ${token}`)
                .send({
                title: 'My First Forum Post',
                category: 'general',
            });
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Title and content are required');
        });
        it('should reject post without category', async () => {
            const response = await request(app)
                .post('/api/v1/forums/posts')
                .set('Authorization', `Bearer ${token}`)
                .send({
                title: 'My First Forum Post',
                content: 'This is a great discussion topic!',
            });
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Category is required');
        });
        it('should set default repliesCount to 0', async () => {
            const response = await request(app)
                .post('/api/v1/forums/posts')
                .set('Authorization', `Bearer ${token}`)
                .send({
                title: 'Test Post with Defaults',
                content: 'Test content here',
                category: 'culture',
            });
            expect(response.status).toBe(201);
            expect(response.body.post.repliesCount).toBe(0);
            expect(response.body.post.viewsCount).toBe(0);
        });
        it('should set status to published by default', async () => {
            const response = await request(app)
                .post('/api/v1/forums/posts')
                .set('Authorization', `Bearer ${token}`)
                .send({
                title: 'Published Post',
                content: 'Test content here',
                category: 'business',
            });
            expect(response.status).toBe(201);
            expect(response.body.post.status).toBe('published');
        });
        it('should trim whitespace from title', async () => {
            const response = await request(app)
                .post('/api/v1/forums/posts')
                .set('Authorization', `Bearer ${token}`)
                .send({
                title: '  Post with Spaces  ',
                content: 'Test content here',
                category: 'general',
            });
            expect(response.status).toBe(201);
            expect(response.body.post.title).toBe('Post with Spaces');
        });
    });
    // List Posts Tests
    describe('List Forum Posts', () => {
        beforeAll(async () => {
            // Create multiple posts
            for (let i = 0; i < 5; i++) {
                await ForumPost.create({
                    title: `Forum Post ${i}`,
                    content: `Content for post ${i}`,
                    category: i % 2 === 0 ? 'general' : 'culture',
                    authorId: userId,
                    authorName: 'forumuser',
                    status: 'published',
                });
            }
        });
        it('should list all published posts', async () => {
            const response = await request(app)
                .get('/api/v1/forums/posts')
                .set('Authorization', `Bearer ${token}`);
            expect(response.status).toBe(200);
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.data.length).toBeGreaterThan(0);
        });
        it('should support pagination', async () => {
            const response = await request(app)
                .get('/api/v1/forums/posts?page=1&limit=2')
                .set('Authorization', `Bearer ${token}`);
            expect(response.status).toBe(200);
            expect(response.body.pagination.page).toBe(1);
            expect(response.body.pagination.limit).toBe(2);
            expect(response.body.pagination.total).toBeDefined();
        });
        it('should filter by category', async () => {
            const response = await request(app)
                .get('/api/v1/forums/posts?category=general')
                .set('Authorization', `Bearer ${token}`);
            expect(response.status).toBe(200);
            response.body.data.forEach((post) => {
                expect(post.category).toBe('general');
            });
        });
        it('should sort by creation date descending', async () => {
            const response = await request(app)
                .get('/api/v1/forums/posts')
                .set('Authorization', `Bearer ${token}`);
            expect(response.status).toBe(200);
            if (response.body.data.length > 1) {
                const firstDate = new Date(response.body.data[0].createdAt).getTime();
                const secondDate = new Date(response.body.data[1].createdAt).getTime();
                expect(firstDate).toBeGreaterThanOrEqual(secondDate);
            }
        });
    });
    // Get Post Tests
    describe('Get Forum Post', () => {
        it('should get post details', async () => {
            const response = await request(app)
                .get(`/api/v1/forums/posts/${postId}`)
                .set('Authorization', `Bearer ${token}`);
            expect(response.status).toBe(200);
            expect(response.body.data._id.toString()).toBe(postId.toString());
        });
        it('should increment view count', async () => {
            const post = await ForumPost.findById(postId);
            const initialViews = post?.viewsCount || 0;
            await request(app)
                .get(`/api/v1/forums/posts/${postId}`)
                .set('Authorization', `Bearer ${token}`);
            const updated = await ForumPost.findById(postId);
            expect(updated?.viewsCount).toBe(initialViews + 1);
        });
        it('should return 404 for non-existent post', async () => {
            const response = await request(app)
                .get('/api/v1/forums/posts/000000000000000000000000')
                .set('Authorization', `Bearer ${token}`);
            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Post not found');
        });
    });
    // Update Post Tests
    describe('Update Forum Post', () => {
        it('should update own post', async () => {
            const response = await request(app)
                .put(`/api/v1/forums/posts/${postId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                title: 'Updated Post Title',
                content: 'Updated content',
            });
            expect(response.status).toBe(200);
            expect(response.body.post.title).toBe('Updated Post Title');
        });
        it('should not update other user posts', async () => {
            const response = await request(app)
                .put(`/api/v1/forums/posts/${postId}`)
                .set('Authorization', `Bearer ${token2}`)
                .send({
                title: 'Hacked Title',
            });
            expect(response.status).toBe(403);
            expect(response.body.error).toContain('You can only update your own posts');
        });
        it('should not allow updating without authorization', async () => {
            const response = await request(app)
                .put(`/api/v1/forums/posts/${postId}`)
                .send({
                title: 'Hacked Title',
            });
            expect(response.status).toBe(401);
        });
        it('should only allow specific fields to be updated', async () => {
            const response = await request(app)
                .put(`/api/v1/forums/posts/${postId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                category: 'culture',
                tags: ['updated'],
                authorId: userId2, // This should be ignored
            });
            expect(response.status).toBe(200);
            const post = await ForumPost.findById(postId);
            expect(post?.authorId.toString()).toBe(userId);
        });
    });
    // Delete Post Tests
    describe('Delete Forum Post', () => {
        let postToDelete;
        beforeEach(async () => {
            postToDelete = await ForumPost.create({
                title: 'Post to Delete',
                content: 'This will be deleted',
                category: 'general',
                authorId: userId,
                authorName: 'forumuser',
            });
        });
        it('should delete own post', async () => {
            const response = await request(app)
                .delete(`/api/v1/forums/posts/${postToDelete._id}`)
                .set('Authorization', `Bearer ${token}`);
            expect(response.status).toBe(200);
            const deleted = await ForumPost.findById(postToDelete._id);
            expect(deleted).toBeNull();
        });
        it('should not delete other user posts', async () => {
            const post = await ForumPost.create({
                title: 'Other User Post',
                content: 'This belongs to another user',
                category: 'general',
                authorId: userId2,
                authorName: 'forumuser2',
            });
            const response = await request(app)
                .delete(`/api/v1/forums/posts/${post._id}`)
                .set('Authorization', `Bearer ${token}`);
            expect(response.status).toBe(403);
        });
        it('should return 404 for non-existent post', async () => {
            const response = await request(app)
                .delete('/api/v1/forums/posts/000000000000000000000000')
                .set('Authorization', `Bearer ${token}`);
            expect(response.status).toBe(404);
        });
    });
    // Add Reply Tests
    describe('Add Forum Reply', () => {
        it('should add reply to post', async () => {
            const response = await request(app)
                .post(`/api/v1/forums/posts/${postId}/replies`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                content: 'Great discussion!',
            });
            expect(response.status).toBe(201);
            expect(response.body.reply.content).toBe('Great discussion!');
            expect(response.body.reply.authorName).toBe('forumuser');
            replyId = response.body.reply._id.toString();
        });
        it('should reject reply without content', async () => {
            const response = await request(app)
                .post(`/api/v1/forums/posts/${postId}/replies`)
                .set('Authorization', `Bearer ${token}`)
                .send({});
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Content is required');
        });
        it('should increment post replies count', async () => {
            const post = await ForumPost.findById(postId);
            const initialReplies = post?.repliesCount || 0;
            await request(app)
                .post(`/api/v1/forums/posts/${postId}/replies`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                content: 'Another reply',
            });
            const updated = await ForumPost.findById(postId);
            expect(updated?.repliesCount).toBe(initialReplies + 1);
        });
        it('should return 404 for non-existent post', async () => {
            const response = await request(app)
                .post('/api/v1/forums/posts/000000000000000000000000/replies')
                .set('Authorization', `Bearer ${token}`)
                .send({
                content: 'Reply content',
            });
            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Post not found');
        });
        it('should reject unauthorized replies', async () => {
            const response = await request(app)
                .post(`/api/v1/forums/posts/${postId}/replies`)
                .send({
                content: 'Unauthorized reply',
            });
            expect(response.status).toBe(401);
        });
    });
    // Get Replies Tests
    describe('Get Post Replies', () => {
        beforeAll(async () => {
            // Create multiple replies
            for (let i = 0; i < 5; i++) {
                await ForumReply.create({
                    postId,
                    content: `Reply content ${i}`,
                    authorId: userId,
                    authorName: 'forumuser',
                    status: 'published',
                });
            }
        });
        it('should list post replies', async () => {
            const response = await request(app)
                .get(`/api/v1/forums/posts/${postId}/replies`)
                .set('Authorization', `Bearer ${token}`);
            expect(response.status).toBe(200);
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.data.length).toBeGreaterThan(0);
        });
        it('should support pagination for replies', async () => {
            const response = await request(app)
                .get(`/api/v1/forums/posts/${postId}/replies?page=1&limit=2`)
                .set('Authorization', `Bearer ${token}`);
            expect(response.status).toBe(200);
            expect(response.body.pagination.page).toBe(1);
            expect(response.body.pagination.limit).toBe(2);
        });
        it('should sort replies by creation date ascending', async () => {
            const response = await request(app)
                .get(`/api/v1/forums/posts/${postId}/replies`)
                .set('Authorization', `Bearer ${token}`);
            expect(response.status).toBe(200);
            if (response.body.data.length > 1) {
                const firstDate = new Date(response.body.data[0].createdAt).getTime();
                const secondDate = new Date(response.body.data[1].createdAt).getTime();
                expect(firstDate).toBeLessThanOrEqual(secondDate);
            }
        });
        it('should return empty array for post with no replies', async () => {
            const newPost = await ForumPost.create({
                title: 'New Post No Replies',
                content: 'No replies yet',
                category: 'general',
                authorId: userId,
                authorName: 'forumuser',
            });
            const response = await request(app)
                .get(`/api/v1/forums/posts/${newPost._id}/replies`)
                .set('Authorization', `Bearer ${token}`);
            expect(response.status).toBe(200);
            expect(response.body.data).toEqual([]);
            expect(response.body.pagination.total).toBe(0);
        });
    });
    // Data Integrity Tests
    describe('Data Integrity', () => {
        it('should have timestamps on created post', async () => {
            const response = await request(app)
                .post('/api/v1/forums/posts')
                .set('Authorization', `Bearer ${token}`)
                .send({
                title: 'Timestamp Test',
                content: 'Testing timestamps',
                category: 'general',
            });
            expect(response.status).toBe(201);
            expect(response.body.post.createdAt).toBeDefined();
            expect(response.body.post.updatedAt).toBeDefined();
        });
        it('should have timestamps on created reply', async () => {
            const response = await request(app)
                .post(`/api/v1/forums/posts/${postId}/replies`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                content: 'Reply with timestamps',
            });
            expect(response.status).toBe(201);
            expect(response.body.reply.createdAt).toBeDefined();
            expect(response.body.reply.updatedAt).toBeDefined();
        });
        it('should store author information correctly', async () => {
            const response = await request(app)
                .post('/api/v1/forums/posts')
                .set('Authorization', `Bearer ${token}`)
                .send({
                title: 'Author Test',
                content: 'Testing author info',
                category: 'general',
            });
            expect(response.status).toBe(201);
            expect(response.body.post.authorId).toBe(userId);
            expect(response.body.post.authorName).toBe('forumuser');
        });
        it('should handle tags correctly', async () => {
            const response = await request(app)
                .post('/api/v1/forums/posts')
                .set('Authorization', `Bearer ${token}`)
                .send({
                title: 'Tags Test',
                content: 'Testing tags',
                category: 'general',
                tags: ['tag1', 'tag2', 'tag3'],
            });
            expect(response.status).toBe(201);
            expect(response.body.post.tags).toEqual(['tag1', 'tag2', 'tag3']);
        });
        it('should provide correct pagination info', async () => {
            const response = await request(app)
                .get('/api/v1/forums/posts?page=1&limit=5')
                .set('Authorization', `Bearer ${token}`);
            expect(response.status).toBe(200);
            expect(response.body.pagination).toHaveProperty('page');
            expect(response.body.pagination).toHaveProperty('limit');
            expect(response.body.pagination).toHaveProperty('total');
            expect(typeof response.body.pagination.page).toBe('number');
            expect(typeof response.body.pagination.limit).toBe('number');
            expect(typeof response.body.pagination.total).toBe('number');
        });
    });
});
//# sourceMappingURL=forum.test.js.map