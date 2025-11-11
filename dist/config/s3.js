import S3Service from '../services/s3Service.js';
// Initialize S3 service based on environment variables
const s3Service = new S3Service({
    endpoint: process.env.S3_ENDPOINT, // MinIO endpoint (e.g., http://localhost:9000)
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.S3_SECRET_KEY || 'minioadmin',
    bucket: process.env.S3_BUCKET || 'pomi',
    region: process.env.AWS_REGION || 'us-east-1',
    forcePathStyle: true, // Required for MinIO
});
export default s3Service;
//# sourceMappingURL=s3.js.map