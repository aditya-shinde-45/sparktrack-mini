import AWS from 'aws-sdk';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

dotenv.config();

// Allowlisted AWS regions – prevents SSRF via arbitrary region injection
const ALLOWED_REGIONS = new Set([
  'ap-south-1', 'ap-south-2', 'ap-southeast-1', 'ap-southeast-2',
  'ap-northeast-1', 'ap-northeast-2', 'ap-northeast-3',
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1',
  'ca-central-1', 'sa-east-1', 'af-south-1', 'me-south-1'
]);

const SAFE_BUCKET_RE = /^[a-z0-9][a-z0-9\-.]{1,61}[a-z0-9]$/;

/**
 * S3 Upload Service for document management
 */
class S3Service {
  constructor() {
    const region = process.env.S3_REGION || 'ap-south-1';

    if (!ALLOWED_REGIONS.has(region)) {
      throw new Error(`Invalid or disallowed S3_REGION: ${region}`);
    }

    const bucketName = process.env.S3_BUCKET_NAME || 'mit-adt-student-documents';
    if (!SAFE_BUCKET_RE.test(bucketName)) {
      throw new Error(`Invalid S3_BUCKET_NAME: ${bucketName}`);
    }

    // Configure AWS S3
    this.s3 = new AWS.S3({
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS,
      region
    });

    this.bucketName = bucketName;
  }

  /**
   * Upload file to S3
   * @param {Buffer} fileBuffer - File buffer
   * @param {String} originalName - Original file name
   * @param {String} mimeType - File MIME type
   * @param {String} folder - Folder path in S3 (optional)
   * @returns {Promise<Object>} Upload result with URL
   */
  async uploadFile(fileBuffer, originalName, mimeType, folder = 'documents') {
    try {
      // Sanitise folder to prevent path traversal
      const safeFolder = folder.replace(/\.\./g, '').replace(/[^a-zA-Z0-9_\-/]/g, '');
      const fileExtension = path.extname(originalName).toLowerCase().replace(/[^a-z0-9]/g, '');
      const uniqueFileName = `${uuidv4()}.${fileExtension}`;
      const key = `${safeFolder}/${uniqueFileName}`;

      const params = {
        Bucket: this.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType
      };

      const result = await this.s3.upload(params).promise();

      return {
        success: true,
        url: result.Location,
        key: result.Key,
        bucket: result.Bucket,
        originalName
      };
    } catch (error) {
      console.error('S3 Upload Error:', error);
      throw new Error(`Failed to upload file to S3: ${error.message}`);
    }
  }

  /**
   * Delete file from S3
   * @param {String} fileKey - S3 file key
   * @returns {Promise<Boolean>} Success status
   */
  async deleteFile(fileKey) {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: fileKey
      };

      await this.s3.deleteObject(params).promise();
      return true;
    } catch (error) {
      console.error('S3 Delete Error:', error);
      throw new Error(`Failed to delete file from S3: ${error.message}`);
    }
  }

  /**
   * Get signed URL for private file access
   * @param {String} fileKey - S3 file key
   * @param {Number} expiresIn - URL expiration time in seconds (default: 1 hour)
   * @returns {Promise<String>} Signed URL
   */
  async getSignedUrl(fileKey, expiresIn = 3600) {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: fileKey,
        Expires: expiresIn
      };

      const url = await this.s3.getSignedUrlPromise('getObject', params);
      return url;
    } catch (error) {
      console.error('S3 Signed URL Error:', error);
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
  }

  /**
   * Extract S3 key from URL
   * @param {String} url - Full S3 URL
   * @returns {String} S3 key
   */
  extractKeyFromUrl(url) {
    try {
      // Extract key from URL like: https://bucket.s3.region.amazonaws.com/folder/file.ext
      const urlObj = new URL(url);
      return urlObj.pathname.substring(1); // Remove leading slash
    } catch (error) {
      console.error('URL Parse Error:', error);
      return null;
    }
  }
}

export default new S3Service();
