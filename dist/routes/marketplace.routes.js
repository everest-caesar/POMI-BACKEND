import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { uploadMultipleImages } from '../middleware/uploadMiddleware.js';
import { createListing, listListings, getListing, updateListing, deleteListing, favoriteListing, uploadListingImages, } from '../controllers/marketplace.controller.js';
const router = Router();
// Public routes
router.get('/listings', listListings);
router.get('/listings/:id', getListing);
// Private routes
router.post('/listings', authenticate, createListing);
router.put('/listings/:id', authenticate, updateListing);
router.delete('/listings/:id', authenticate, deleteListing);
router.post('/listings/:id/favorite', authenticate, favoriteListing);
// Image upload route
router.post('/upload', authenticate, uploadMultipleImages, uploadListingImages);
export default router;
//# sourceMappingURL=marketplace.routes.js.map