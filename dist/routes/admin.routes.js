import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/authMiddleware.js';
import { getAdminOverview, getAdminEvents, getAdminBusinesses, updateBusinessStatus, getAdminListings, updateEventStatus, updateListingStatus, getAdminUsers, sendAdminMessage, getAdminMessages, broadcastAdminMessage, } from '../controllers/admin.controller.js';
const router = Router();
router.use(authenticate, requireAdmin);
router.get('/overview', getAdminOverview);
router.get('/events', getAdminEvents);
router.patch('/events/:id/status', updateEventStatus);
router.get('/businesses', getAdminBusinesses);
router.patch('/businesses/:id/status', updateBusinessStatus);
router.get('/marketplace', getAdminListings);
router.patch('/marketplace/:id/status', updateListingStatus);
router.get('/users', getAdminUsers);
// Admin messaging routes
router.post('/messages', sendAdminMessage);
router.get('/messages', getAdminMessages);
router.post('/messages/broadcast', broadcastAdminMessage);
export default router;
//# sourceMappingURL=admin.routes.js.map