interface S3Config {
    endpoint?: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
    region?: string;
    forcePathStyle?: boolean;
}
declare class S3Service {
    private s3Client;
    private bucket;
    private isMinIO;
    constructor(config: S3Config);
    /**
     * Upload a file to S3/MinIO
     * @param fileBuffer - The file buffer to upload
     * @param fileName - Original file name
     * @param mimeType - File MIME type
     * @param folder - Optional folder path (e.g., 'marketplace', 'events')
     * @returns Object with key and URL
     */
    uploadFile(fileBuffer: Buffer, fileName: string, mimeType: string, folder?: string): Promise<{
        key: string;
        url: string;
    }>;
    /**
     * Delete a file from S3/MinIO
     * @param key - The object key to delete
     */
    deleteFile(key: string): Promise<void>;
    /**
     * Generate a signed URL for temporary access (useful for private files)
     * @param key - The object key
     * @param expiresIn - Expiration time in seconds
     */
    getSignedUrl(key: string, expiresIn?: number): Promise<string>;
    /**
     * Validate file before upload
     * @param fileBuffer - File buffer
     * @param fileName - File name
     * @param maxSize - Max file size in MB
     * @param allowedMimes - Allowed MIME types
     */
    validateFile(fileBuffer: Buffer, fileName: string, maxSize?: number, // 10 MB default
    allowedMimes?: string[]): {
        isValid: boolean;
        error?: string;
    };
}
export default S3Service;
//# sourceMappingURL=s3Service.d.ts.map