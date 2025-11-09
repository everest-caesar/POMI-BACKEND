import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import path from 'path'

interface S3Config {
  endpoint?: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  region?: string
  forcePathStyle?: boolean
}

class S3Service {
  private s3Client: S3Client
  private bucket: string
  private isMinIO: boolean

  constructor(config: S3Config) {
    this.bucket = config.bucket
    this.isMinIO = !!config.endpoint

    // Initialize S3 client with MinIO or AWS S3 based on config
    const clientConfig: any = {
      region: config.region || 'us-east-1',
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    }

    if (config.endpoint) {
      // MinIO configuration
      clientConfig.endpoint = config.endpoint
      clientConfig.forcePathStyle = config.forcePathStyle !== false
    }

    this.s3Client = new S3Client(clientConfig)
  }

  /**
   * Upload a file to S3/MinIO
   * @param fileBuffer - The file buffer to upload
   * @param fileName - Original file name
   * @param mimeType - File MIME type
   * @param folder - Optional folder path (e.g., 'marketplace', 'events')
   * @returns Object with key and URL
   */
  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    folder: string = 'uploads'
  ): Promise<{ key: string; url: string }> {
    try {
      // Generate unique file name
      const timestamp = Date.now()
      const randomSuffix = Math.random().toString(36).substring(7)
      const ext = path.extname(fileName)
      const baseName = path.basename(fileName, ext)
      const uniqueFileName = `${baseName}-${timestamp}-${randomSuffix}${ext}`
      const key = `${folder}/${uniqueFileName}`

      // Upload to S3/MinIO
      const putCommand = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
        ACL: 'public-read', // Make files publicly readable
      })

      await this.s3Client.send(putCommand)

      // Generate URL (for MinIO we need the full endpoint URL)
      const url = this.isMinIO
        ? `${process.env.MINIO_ENDPOINT}/${this.bucket}/${key}`
        : `https://${this.bucket}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`

      return { key, url }
    } catch (error) {
      console.error('File upload error:', error)
      throw new Error('Failed to upload file to storage')
    }
  }

  /**
   * Delete a file from S3/MinIO
   * @param key - The object key to delete
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })

      await this.s3Client.send(deleteCommand)
    } catch (error) {
      console.error('File deletion error:', error)
      throw new Error('Failed to delete file from storage')
    }
  }

  /**
   * Generate a signed URL for temporary access (useful for private files)
   * @param key - The object key
   * @param expiresIn - Expiration time in seconds
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const getCommand = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })

      const url = await getSignedUrl(this.s3Client, getCommand, { expiresIn })
      return url
    } catch (error) {
      console.error('Signed URL generation error:', error)
      throw new Error('Failed to generate signed URL')
    }
  }

  /**
   * Validate file before upload
   * @param fileBuffer - File buffer
   * @param fileName - File name
   * @param maxSize - Max file size in MB
   * @param allowedMimes - Allowed MIME types
   */
  validateFile(
    fileBuffer: Buffer,
    fileName: string,
    maxSize: number = 10, // 10 MB default
    allowedMimes: string[] = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  ): { isValid: boolean; error?: string } {
    // Check file size
    const fileSizeMB = fileBuffer.length / (1024 * 1024)
    if (fileSizeMB > maxSize) {
      return {
        isValid: false,
        error: `File size exceeds ${maxSize}MB limit`,
      }
    }

    // Check file extension
    const ext = path.extname(fileName).toLowerCase()
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
    if (!validExtensions.includes(ext)) {
      return {
        isValid: false,
        error: 'Invalid file type. Only images (JPG, PNG, WebP, GIF) are allowed.',
      }
    }

    return { isValid: true }
  }
}

export default S3Service
