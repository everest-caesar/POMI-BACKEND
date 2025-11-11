import Business from '../models/Business.js';
import User from '../models/User.js';
import { uploadBusinessImages as uploadBusinessImagesToStorage } from '../services/storageService.js';
/**
 * Create business
 * POST /api/v1/businesses
 */
export const createBusiness = async (req, res) => {
    try {
        const { businessName, description, category, phone, email, address } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        if (!businessName || !category) {
            res.status(400).json({ error: 'Business name and category are required' });
            return;
        }
        // Get owner name from user
        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const business = new Business({
            businessName,
            description,
            category,
            phone,
            email,
            address,
            ownerId: userId,
            ownerName: user.username,
            status: 'draft',
            verified: false,
        });
        await business.save();
        res.status(201).json({ message: 'Business created successfully', business });
    }
    catch (error) {
        console.error('Create business error:', error);
        res.status(500).json({ error: 'Failed to create business' });
    }
};
/**
 * List businesses
 * GET /api/v1/businesses
 */
export const listBusinesses = async (req, res) => {
    try {
        const { page = 1, limit = 20, category, search, verified } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const filter = {};
        if (category) {
            filter.category = category;
        }
        if (verified) {
            filter.verified = verified === 'true';
        }
        if (search) {
            filter.$text = { $search: search };
        }
        const total = await Business.countDocuments(filter);
        const businesses = await Business.find(filter)
            .populate('ownerId', 'username email')
            .sort({ createdAt: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum);
        res.status(200).json({
            data: businesses,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
            },
        });
    }
    catch (error) {
        console.error('List businesses error:', error);
        res.status(500).json({ error: 'Failed to list businesses' });
    }
};
/**
 * Get business details
 * GET /api/v1/businesses/:id
 */
export const getBusiness = async (req, res) => {
    try {
        const { id } = req.params;
        const business = await Business.findById(id)
            .populate('ownerId', 'username email');
        if (!business) {
            res.status(404).json({ error: 'Business not found' });
            return;
        }
        res.status(200).json({ data: business });
    }
    catch (error) {
        console.error('Get business error:', error);
        res.status(500).json({ error: 'Failed to get business' });
    }
};
/**
 * Update business
 * PUT /api/v1/businesses/:id
 */
export const updateBusiness = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const business = await Business.findById(id);
        if (!business) {
            res.status(404).json({ error: 'Business not found' });
            return;
        }
        // Check if user is the owner
        if (business.ownerId.toString() !== userId) {
            res.status(403).json({ error: 'You can only update your own businesses' });
            return;
        }
        const allowedFields = ['businessName', 'description', 'category', 'phone', 'email', 'address', 'status'];
        const updates = {};
        allowedFields.forEach(field => {
            if (field in req.body) {
                updates[field] = req.body[field];
            }
        });
        const updatedBusiness = await Business.findByIdAndUpdate(id, updates, { new: true });
        res.status(200).json({ message: 'Business updated successfully', business: updatedBusiness });
    }
    catch (error) {
        console.error('Update business error:', error);
        res.status(500).json({ error: 'Failed to update business' });
    }
};
/**
 * Delete business
 * DELETE /api/v1/businesses/:id
 */
export const deleteBusiness = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const business = await Business.findById(id);
        if (!business) {
            res.status(404).json({ error: 'Business not found' });
            return;
        }
        // Check if user is the owner
        if (business.ownerId.toString() !== userId) {
            res.status(403).json({ error: 'You can only delete your own businesses' });
            return;
        }
        await Business.findByIdAndDelete(id);
        res.status(200).json({ message: 'Business deleted successfully' });
    }
    catch (error) {
        console.error('Delete business error:', error);
        res.status(500).json({ error: 'Failed to delete business' });
    }
};
/**
 * Get business reviews
 * GET /api/v1/businesses/:id/reviews
 */
export const getBusinessReviews = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        // For now, return empty reviews as Review model doesn't exist
        const reviews = [];
        res.status(200).json({
            data: reviews,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: reviews.length,
            },
        });
    }
    catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({ error: 'Failed to get reviews' });
    }
};
/**
 * Upload business images
 * POST /api/v1/businesses/:id/images
 */
export const uploadBusinessImages = async (req, res) => {
    try {
        const { id } = req.params;
        const { setAsFeatured } = req.query;
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const business = await Business.findById(id);
        if (!business) {
            res.status(404).json({ error: 'Business not found' });
            return;
        }
        // Check if user is the owner or admin
        const user = await User.findById(userId);
        if (business.ownerId.toString() !== userId && !user?.isAdmin) {
            res.status(403).json({ error: 'You can only upload images to your own businesses' });
            return;
        }
        // Check if files were uploaded
        const files = req.files;
        if (!files || files.length === 0) {
            res.status(400).json({ error: 'No files uploaded' });
            return;
        }
        // Upload images to business bucket
        const uploadedImages = await uploadBusinessImagesToStorage(files);
        if (!uploadedImages || uploadedImages.length === 0) {
            res.status(500).json({ error: 'Failed to upload images' });
            return;
        }
        // Add images to business
        business.images = [...(business.images || []), ...uploadedImages];
        // Set as featured image if specified
        if (setAsFeatured === 'true' && uploadedImages.length > 0) {
            business.featuredImage = uploadedImages[0];
        }
        else if (!business.featuredImage && uploadedImages.length > 0) {
            business.featuredImage = uploadedImages[0];
        }
        await business.save();
        res.status(200).json({
            message: 'Images uploaded successfully',
            business,
        });
    }
    catch (error) {
        console.error('Upload business images error:', error);
        res.status(500).json({ error: 'Failed to upload images' });
    }
};
//# sourceMappingURL=business.controller.js.map