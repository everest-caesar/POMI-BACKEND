import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  createBusiness,
  listBusinesses,
  getBusiness,
  updateBusiness,
  deleteBusiness,
  getBusinessReviews,
} from '../controllers/business.controller';

const router = Router();

// Public routes
router.get('/', listBusinesses);
router.get('/:id', getBusiness);
router.get('/:id/reviews', getBusinessReviews);

// Private routes
router.post('/', authenticateToken, createBusiness);
router.put('/:id', authenticateToken, updateBusiness);
router.delete('/:id', authenticateToken, deleteBusiness);

export default router;
