import { Router } from 'express';
import authRoutes from './auth.routes.js';
import eventsRoutes from './events.routes.js';
import marketplaceRoutes from './marketplace.routes.js';
import businessRoutes from './business.routes.js';
import forumRoutes from './forum.routes.js';
import mentorshipRoutes from './mentorship.routes.js';
import communityRoutes from './community.routes.js';
import adminRoutes from './admin.routes.js';
import messageRoutes from './message.routes.js';
const router = Router();
// API v1 routes
router.use('/auth', authRoutes);
router.use('/events', eventsRoutes);
router.use('/marketplace', marketplaceRoutes);
router.use('/businesses', businessRoutes);
router.use('/forums', forumRoutes);
router.use('/mentorship', mentorshipRoutes);
router.use('/community', communityRoutes);
router.use('/admin', adminRoutes);
router.use('/messages', messageRoutes);
// Status endpoint
router.get('/status', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});
export default router;
//# sourceMappingURL=index.js.map