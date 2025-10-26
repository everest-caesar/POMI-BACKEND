import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  createListing,
  listListings,
  getListing,
  updateListing,
  deleteListing,
  favoriteListing,
} from '../controllers/marketplace.controller';

const router = Router();

// Public routes
router.get('/listings', listListings);
router.get('/listings/:id', getListing);

// Private routes
router.post('/listings', authenticateToken, createListing);
router.put('/listings/:id', authenticateToken, updateListing);
router.delete('/listings/:id', authenticateToken, deleteListing);
router.post('/listings/:id/favorite', authenticateToken, favoriteListing);

export default router;
