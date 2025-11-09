/**
 * Initialize bucket (run once on startup)
 */
export declare const initializeBucket: () => Promise<void>;
export declare const uploadImage: (file: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
}, folder?: string, attempt?: number) => Promise<string>;
/**
 * Upload multiple images
 */
export declare const uploadImages: (files: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
}[], folder?: string) => Promise<string[]>;
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
    deleteImage: (imageUrl: string) => Promise<void>;
    deleteImages: (imageUrls: string[]) => Promise<void>;
};
export default _default;
//# sourceMappingURL=storageService.d.ts.map