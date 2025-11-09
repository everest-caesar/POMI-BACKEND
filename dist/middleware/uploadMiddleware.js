import multer from 'multer';
// Configure memory storage (files stored in RAM, not on disk)
const storage = multer.memoryStorage();
// File filter - only allow images
const fileFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    // Check MIME type
    if (!allowedMimes.includes(file.mimetype)) {
        return cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
    }
    // Check file extension
    const ext = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    if (!allowedExtensions.includes(ext)) {
        return cb(new Error('Invalid file extension. Only .jpg, .jpeg, .png, and .webp are allowed.'));
    }
    cb(null, true);
};
// Configure multer
export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
        files: 10, // Max 10 files per request
    },
});
// Middleware to validate single file
export const uploadSingleImage = upload.single('image');
// Middleware to validate multiple files
export const uploadMultipleImages = upload.array('images', 10);
export default {
    uploadSingleImage,
    uploadMultipleImages,
};
//# sourceMappingURL=uploadMiddleware.js.map