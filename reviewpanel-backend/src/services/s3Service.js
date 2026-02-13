import AWS from 'aws-sdk';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

/**
 * S3 Upload Service for document management
 */
class S3Service {
  constructor() {
    // Configure AWS S3
    this.s3 = new AWS.S3({
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS,
      region: process.env.S3_REGION || 'ap-south-1'
    });

    this.bucketName = process.env.S3_BUCKET_NAME || 'mit-adt-student-documents';
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
      // Generate unique filename
      const fileExtension = originalName.split('.').pop();
      const uniqueFileName = `${uuidv4()}.${fileExtension}`;
      const key = `${folder}/${uniqueFileName}`;

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
