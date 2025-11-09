import { Types } from 'mongoose';
import Listing from '../models/Listing.js';
import User from '../models/User.js';
import { uploadImages } from '../services/storageService.js';
/**
 * Create marketplace listing
 * POST /api/v1/marketplace/listings
 */
export const createListing = async (req, res) => {
    try {
        const { title, description, category, price, location, condition, images } = req.body;
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        if (!title || !price || !category) {
            res.status(400).json({ error: 'Title, price, and category are required' });
            return;
        }
        // Get seller name from user
        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const isAdmin = Boolean(user.isAdmin);
        const listing = new Listing({
            title,
            description,
            category,
            price,
            location,
            sellerId: userId,
            sellerName: user.username,
            condition,
            images: images || [],
            status: isAdmin ? 'active' : 'inactive',
            moderationStatus: isAdmin ? 'approved' : 'pending',
            reviewedBy: isAdmin ? new Types.ObjectId(user._id) : undefined,
            reviewedAt: isAdmin ? new Date() : undefined,
            rejectionReason: undefined,
        });
        await listing.save();
        res.status(201).json({
            message: isAdmin
                ? 'Listing published successfully.'
                : 'Listing submitted for review. An admin will approve it shortly.',
            listing,
        });
    }
    catch (error) {
        console.error('Create listing error:', error);
        res.status(500).json({ error: 'Failed to create listing' });
    }
};
/**
 * List marketplace items
 * GET /api/v1/marketplace/listings
 */
export const listListings = async (req, res) => {
    try {
        const { page = 1, limit = 20, category, search, status = 'active', moderationStatus } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const filter = { status: status || 'active' };
        if (category) {
            filter.category = category;
        }
        if (search) {
            filter.$text = { $search: search };
        }
        if (moderationStatus) {
            filter.moderationStatus = moderationStatus;
        }
        else {
            filter.$or = [
                { moderationStatus: 'approved' },
                { moderationStatus: { $exists: false } },
            ];
        }
        const total = await Listing.countDocuments(filter);
        const listings = await Listing.find(filter)
            .populate('sellerId', 'username email')
            .sort({ createdAt: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum);
        res.status(200).json({
            data: listings,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
            },
        });
    }
    catch (error) {
        console.error('List listings error:', error);
        res.status(500).json({ error: 'Failed to list listings' });
    }
};
/**
 * Get listing details
 * GET /api/v1/marketplace/listings/:id
 */
export const getListing = async (req, res) => {
    try {
        const { id } = req.params;
        const listing = await Listing.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true }).populate('sellerId', 'username email');
        if (!listing) {
            res.status(404).json({ error: 'Listing not found' });
            return;
        }
        const requesterId = req.userId ? req.userId.toString() : null;
        const isAdmin = Boolean(req.isAdmin);
        const isOwner = requesterId && listing.sellerId
            ? listing.sellerId._id?.toString() === requesterId
            : false;
        if (listing.moderationStatus &&
            listing.moderationStatus !== 'approved' &&
            !isOwner &&
            !isAdmin) {
            res.status(404).json({ error: 'Listing not found' });
            return;
        }
        res.status(200).json({ data: listing });
    }
    catch (error) {
        console.error('Get listing error:', error);
        res.status(500).json({ error: 'Failed to get listing' });
    }
};
/**
 * Update listing
 * PUT /api/v1/marketplace/listings/:id
 */
export const updateListing = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const [listing, currentUser] = await Promise.all([
            Listing.findById(id),
            User.findById(userId),
        ]);
        if (!listing) {
            res.status(404).json({ error: 'Listing not found' });
            return;
        }
        const isAdmin = Boolean(currentUser?.isAdmin);
        const isOwner = listing.sellerId.toString() === userId.toString();
        if (!isOwner && !isAdmin) {
            res.status(403).json({ error: 'You can only update your own listings' });
            return;
        }
        const allowedFields = ['title', 'description', 'price', 'location', 'category', 'condition', 'status', 'images'];
        allowedFields.forEach((field) => {
            if (field in req.body) {
                listing[field] = req.body[field];
            }
        });
        if (isAdmin && 'moderationStatus' in req.body) {
            const nextStatus = req.body.moderationStatus;
            if (!['pending', 'approved', 'rejected'].includes(nextStatus)) {
                res.status(400).json({ error: 'Invalid moderation status' });
                return;
            }
            listing.moderationStatus = nextStatus;
            listing.reviewedBy = currentUser
                ? new Types.ObjectId(currentUser._id)
                : listing.reviewedBy ?? null;
            listing.reviewedAt = new Date();
            listing.rejectionReason =
                nextStatus === 'rejected' ? req.body.rejectionReason || null : null;
            if (nextStatus === 'approved' && listing.status === 'inactive') {
                listing.status = 'active';
            }
            if (nextStatus === 'rejected') {
                listing.status = 'inactive';
            }
        }
        else if (!isAdmin) {
            listing.moderationStatus = 'pending';
            listing.status = 'inactive';
            listing.reviewedBy = null;
            listing.reviewedAt = null;
            listing.rejectionReason = null;
        }
        await listing.save();
        res.status(200).json({ message: 'Listing updated successfully', listing });
    }
    catch (error) {
        console.error('Update listing error:', error);
        res.status(500).json({ error: 'Failed to update listing' });
    }
};
/**
 * Delete listing
 * DELETE /api/v1/marketplace/listings/:id
 */
export const deleteListing = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const [listing, currentUser] = await Promise.all([
            Listing.findById(id),
            User.findById(userId),
        ]);
        if (!listing) {
            res.status(404).json({ error: 'Listing not found' });
            return;
        }
        const isAdmin = Boolean(currentUser?.isAdmin);
        if (listing.sellerId.toString() !== userId && !isAdmin) {
            res.status(403).json({ error: 'You can only delete your own listings' });
            return;
        }
        await Listing.findByIdAndDelete(id);
        res.status(200).json({ message: 'Listing deleted successfully' });
    }
    catch (error) {
        console.error('Delete listing error:', error);
        res.status(500).json({ error: 'Failed to delete listing' });
    }
};
/**
 * Favorite listing
 * POST /api/v1/marketplace/listings/:id/favorite
 */
export const favoriteListing = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const listing = await Listing.findById(id);
        if (!listing) {
            res.status(404).json({ error: 'Listing not found' });
            return;
        }
        if (listing.moderationStatus && listing.moderationStatus !== 'approved') {
            res.status(400).json({ error: 'Listing is awaiting admin approval' });
            return;
        }
        const isFavorited = listing.favorites.some(fav => fav.toString() === userId);
        if (isFavorited) {
            // Remove from favorites
            listing.favorites = listing.favorites.filter(fav => fav.toString() !== userId);
            await listing.save();
            res.status(200).json({ message: 'Listing removed from favorites', favorited: false });
        }
        else {
            // Add to favorites
            listing.favorites.push(userId);
            await listing.save();
            res.status(201).json({ message: 'Listing added to favorites', favorited: true });
        }
    }
    catch (error) {
        console.error('Favorite listing error:', error);
        res.status(500).json({ error: 'Failed to favorite listing' });
    }
};
/**
 * Upload listing images
 * POST /api/v1/marketplace/upload
 */
export const uploadListingImages = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const files = req.files;
        if (!files || files.length === 0) {
            res.status(400).json({ error: 'No images provided' });
            return;
        }
        // Upload images to MinIO/S3
        const imageUrls = await uploadImages(files, 'marketplace/listings');
        res.status(200).json({
            message: 'Images uploaded successfully',
            images: imageUrls,
        });
    }
    catch (error) {
        console.error('Image upload error:', error);
        res.status(500).json({ error: error.message || 'Failed to upload images' });
    }
};
//# sourceMappingURL=marketplace.controller.js.map