import { Router } from 'express';
import authRoutes from './auth.routes';

const router = Router();

// API v1 routes
router.use('/auth', authRoutes);

// Status endpoint
router.get('/status', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

export default router;
