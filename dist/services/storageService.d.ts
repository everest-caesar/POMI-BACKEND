/**
 * Initialize bucket (run once on startup)
 */
export declare const initializeBucket: () => Promise<void>;
/**
 * Initialize business bucket (run once on startup)
 */
export declare const initializeBusinessBucket: () => Promise<void>;
export declare const uploadImage: (file: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
}, folder?: string, attempt?: number) => Promise<string>;
/**
 * Upload image to business folder within same bucket
 * Uses folder prefix instead of separate bucket for production AWS compatibility
 * @param file - File buffer and metadata
 * @param attempt - Retry attempt number
 * @returns Public URL of uploaded image
 */
export declare const uploadBusinessImage: (file: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
}, attempt?: number) => Promise<string>;
/**
 * Upload multiple images
 */
export declare const uploadImages: (files: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
}[], folder?: string) => Promise<string[]>;
/**
 * Upload multiple images to business folder within same bucket
 * Each file gets businesses/ prefix, compatible with production AWS
 */
export declare const uploadBusinessImages: (files: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
}[]) => Promise<string[]>;
/**
 * Delete image from MinIO/S3
 */
export declare const deleteImage: (imageUrl: string) => Promise<void>;
/**
 * Delete multiple images
 */
export declare const deleteImages: (imageUrls: string[]) => Promise<void>;
declare const _default: {
    initializeBucket: () => Promise<void>;
    initializeBusinessBucket: () => Promise<void>;
    uploadImage: (file: {
        buffer: Buffer;
        originalname: string;
        mimetype: string;
    }, folder?: string, attempt?: number) => Promise<string>;
    uploadImages: (files: {
        buffer: Buffer;
        originalname: string;
        mimetype: string;
    }[], folder?: string) => Promise<string[]>;
    uploadBusinessImage: (file: {
        buffer: Buffer;
        originalname: string;
        mimetype: string;
    }, attempt?: number) => Promise<string>;
    uploadBusinessImages: (files: {
        buffer: Buffer;
        originalname: string;
        mimetype: string;
    }[]) => Promise<string[]>;
    deleteImage: (imageUrl: string) => Promise<void>;
    deleteImages: (imageUrls: string[]) => Promise<void>;
};
export default _default;
//# sourceMappingURL=storageService.d.ts.map