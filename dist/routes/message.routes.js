import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { sendMessage, getConversation, getConversations, getUnreadCount, markAsRead, getAdminInbox, sendAdminReply, } from '../controllers/messageController.js';
const router = Router();
// All routes require authentication
router.use(authenticate);
// Admin inbox routes (must be before /:recipientId to avoid conflict)
router.get('/admin/inbox', getAdminInbox);
router.post('/admin/reply', sendAdminReply);
// Send a message
router.post('/', sendMessage);
// Get list of all conversations
router.get('/', getConversations);
// Get unread message count
router.get('/unread/count', getUnreadCount);
// Get messages with a specific user
router.get('/:recipientId', getConversation);
// Mark message as read
router.patch('/:messageId/read', markAsRead);
export default router;
//# sourceMappingURL=message.routes.js.map