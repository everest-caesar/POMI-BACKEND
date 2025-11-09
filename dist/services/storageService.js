import AWS from 'aws-sdk';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
const { S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET, S3_PUBLIC_URL, AWS_REGION, } = process.env;
const isCustomEndpoint = Boolean(S3_ENDPOINT);
const s3Config = {
    accessKeyId: S3_ACCESS_KEY || 'pomi_user',
    secretAccessKey: S3_SECRET_KEY || 'pomi_password',
    signatureVersion: 'v4',
    region: AWS_REGION || 'us-east-1',
};
if (isCustomEndpoint && S3_ENDPOINT) {
    s3Config.endpoint = new AWS.Endpoint(S3_ENDPOINT);
    s3Config.s3ForcePathStyle = true;
    s3Config.sslEnabled = S3_ENDPOINT.startsWith('https');
}
const s3Client = new AWS.S3(s3Config);
const BUCKET_NAME = S3_BUCKET || 'marketplace';
const isBucketMissingError = (error) => {
    if (!error)
        return false;
    const missingCodes = ['NoSuchBucket', 'NotFound', 'BucketNotFound'];
    if (missingCodes.includes(error.code)) {
        return true;
    }
    if (typeof error.statusCode === 'number' && error.statusCode === 404) {
        return true;
    }
    const message = (error.message || '').toLowerCase();
    return message.includes('not exist') || message.includes('not found');
};
const trimLeadingSlash = (value) => value.replace(/^\/+/, '');
const trimTrailingSlash = (value) => value.replace(/\/+$/, '');
const buildPublicUrl = (key) => {
    if (S3_PUBLIC_URL) {
        const baseUrl = trimTrailingSlash(S3_PUBLIC_URL);
        if (baseUrl.includes('{key}')) {
            return baseUrl.replace('{bucket}', BUCKET_NAME).replace('{key}', key);
        }
        if (baseUrl.includes('{bucket}')) {
            const replaced = baseUrl.replace('{bucket}', BUCKET_NAME);
            return `${trimTrailingSlash(replaced)}/${key}`;
        }
        const withBucket = baseUrl.endsWith(`/${BUCKET_NAME}`) || baseUrl.includes(`${BUCKET_NAME}.`)
            ? baseUrl
            : `${baseUrl}/${BUCKET_NAME}`;
        return `${trimTrailingSlash(withBucket)}/${key}`;
    }
    if (isCustomEndpoint && S3_ENDPOINT) {
        return `${trimTrailingSlash(S3_ENDPOINT)}/${BUCKET_NAME}/${key}`;
    }
    const region = AWS_REGION || 'us-east-1';
    return `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`;
};
const extractObjectKey = (imageUrl) => {
    try {
        const parsedUrl = new URL(imageUrl);
        const pathname = trimLeadingSlash(parsedUrl.pathname);
        if (!pathname) {
            throw new Error('Invalid image URL');
        }
        if (pathname.startsWith(`${BUCKET_NAME}/`)) {
            return pathname.substring(`${BUCKET_NAME}/`.length);
        }
        return pathname;
    }
    catch {
        const fallback = imageUrl.split(`${BUCKET_NAME}/`);
        if (fallback.length === 2) {
            return trimLeadingSlash(fallback[1]);
        }
        throw new Error('Invalid image URL');
    }
};
/**
 * Initialize bucket (run once on startup)
 */
export const initializeBucket = async () => {
    try {
        await s3Client.headBucket({ Bucket: BUCKET_NAME }).promise();
        console.log(`✅ Bucket "${BUCKET_NAME}" exists`);
    }
    catch (error) {
        if (isBucketMissingError(error)) {
            try {
                await s3Client.createBucket({ Bucket: BUCKET_NAME }).promise();
                console.log(`✅ Created bucket "${BUCKET_NAME}"`);
                // Make bucket public for listing images
                const publicPolicy = {
                    Version: '2012-10-17',
                    Statement: [
                        {
                            Effect: 'Allow',
                            Principal: '*',
                            Action: ['s3:GetObject'],
                            Resource: `arn:aws:s3:::${BUCKET_NAME}/*`,
                        },
                    ],
                };
                await s3Client
                    .putBucketPolicy({
                    Bucket: BUCKET_NAME,
                    Policy: JSON.stringify(publicPolicy),
                })
                    .promise();
                console.log(`✅ Set public policy for "${BUCKET_NAME}"`);
            }
            catch (createError) {
                if (createError.code === 'BucketAlreadyOwnedByYou' || createError.code === 'BucketAlreadyExists') {
                    console.log(`ℹ️  Bucket "${BUCKET_NAME}" already exists and is owned by the configured user.`);
                }
                else {
                    console.error('❌ Failed to create bucket:', createError);
                    throw createError;
                }
            }
        }
        else {
            console.error('❌ Bucket access error:', error);
            throw error;
        }
    }
};
/**
 * Upload image to MinIO/S3
 * @param file - File buffer and metadata
 * @param folder - Folder path (e.g., 'marketplace/listings')
 * @returns Public URL of uploaded image
 */
const MAX_UPLOAD_RETRY = 1;
export const uploadImage = async (file, folder = 'marketplace', attempt = 0) => {
    try {
        const normalizedFolder = trimLeadingSlash(folder);
        // Generate unique filename
        const extension = (path.extname(file.originalname) || '.bin').toLowerCase();
        const baseKey = normalizedFolder ? `${normalizedFolder}/` : '';
        const objectKey = `${baseKey}${uuidv4()}${extension}`;
        // Upload to MinIO/S3
        await s3Client
            .putObject({
            Bucket: BUCKET_NAME,
            Key: objectKey,
            Body: file.buffer,
            ContentType: file.mimetype,
        })
            .promise();
        // Generate public URL
        const publicUrl = buildPublicUrl(objectKey);
        console.log(`✅ Image uploaded: ${publicUrl}`);
        return publicUrl;
    }
    catch (error) {
        if (isBucketMissingError(error) && attempt < MAX_UPLOAD_RETRY) {
            console.warn(`⚠️  Bucket "${BUCKET_NAME}" missing during upload. Attempting to initialize and retry...`);
            await initializeBucket();
            return uploadImage(file, folder, attempt + 1);
        }
        console.error('❌ Image upload error:', error);
        throw new Error(error?.message || 'Failed to upload image');
    }
};
/**
 * Upload multiple images
 */
export const uploadImages = async (files, folder = 'marketplace') => {
    try {
        const uploadPromises = files.map((file) => uploadImage(file, folder));
        const urls = await Promise.all(uploadPromises);
        return urls;
    }
    catch (error) {
        console.error('❌ Batch upload error:', error);
        throw error;
    }
};
/**
 * Delete image from MinIO/S3
 */
export const deleteImage = async (imageUrl) => {
    try {
        const key = extractObjectKey(imageUrl);
        await s3Client
            .deleteObject({
            Bucket: BUCKET_NAME,
            Key: key,
        })
            .promise();
        console.log(`✅ Image deleted: ${key}`);
    }
    catch (error) {
        console.error('❌ Image deletion error:', error);
        throw new Error('Failed to delete image');
    }
};
/**
 * Delete multiple images
 */
export const deleteImages = async (imageUrls) => {
    try {
        const deletePromises = imageUrls.map((url) => deleteImage(url));
        await Promise.all(deletePromises);
    }
    catch (error) {
        console.error('❌ Batch deletion error:', error);
        throw error;
    }
};
export default {
    initializeBucket,
    uploadImage,
    uploadImages,
    deleteImage,
    deleteImages,
};
//# sourceMappingURL=storageService.js.map