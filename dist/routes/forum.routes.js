import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { createPost, listPosts, getPost, updatePost, deletePost, addReply, getReplies, } from '../controllers/forum.controller.js';
const router = Router();
// Forum posts
router.get('/posts', listPosts);
router.get('/posts/:id', getPost);
router.get('/posts/:id/replies', getReplies);
router.post('/posts', authenticateToken, createPost);
router.put('/posts/:id', authenticateToken, updatePost);
router.delete('/posts/:id', authenticateToken, deletePost);
router.post('/posts/:id/replies', authenticateToken, addReply);
export default router;
//# sourceMappingURL=forum.routes.js.map