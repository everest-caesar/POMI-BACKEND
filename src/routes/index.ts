import { Router } from 'express';
import authRoutes from './auth.routes';
import eventsRoutes from './events.routes';
import marketplaceRoutes from './marketplace.routes';
import businessRoutes from './business.routes';
import forumRoutes from './forum.routes';
import mentorshipRoutes from './mentorship.routes';
import communityRoutes from './community.routes';

const router = Router();

// API v1 routes
router.use('/auth', authRoutes);
router.use('/events', eventsRoutes);
router.use('/marketplace', marketplaceRoutes);
router.use('/businesses', businessRoutes);
router.use('/forums', forumRoutes);
router.use('/mentorship', mentorshipRoutes);
router.use('/community', communityRoutes);

// Status endpoint
router.get('/status', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

export default router;
