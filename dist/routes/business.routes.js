import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { uploadMultipleImages } from '../middleware/uploadMiddleware.js';
import { createBusiness, listBusinesses, getBusiness, updateBusiness, deleteBusiness, getBusinessReviews, addBusinessReview, uploadBusinessImages, } from '../controllers/business.controller.js';
const router = Router();
// Public routes
router.get('/', listBusinesses);
router.get('/:id', getBusiness);
router.get('/:id/reviews', getBusinessReviews);
router.post('/:id/reviews', authenticateToken, addBusinessReview);
// Private routes
router.post('/', authenticateToken, createBusiness);
router.put('/:id', authenticateToken, updateBusiness);
router.delete('/:id', authenticateToken, deleteBusiness);
router.post('/:id/images', authenticateToken, uploadMultipleImages, uploadBusinessImages);
export default router;
//# sourceMappingURL=business.routes.js.map