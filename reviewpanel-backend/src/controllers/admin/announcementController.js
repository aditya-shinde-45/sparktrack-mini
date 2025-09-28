import multer from 'multer';
import ApiResponse from '../../utils/apiResponse.js';
import { asyncHandler, ApiError } from '../../utils/errorHandler.js';
import announcementModel from '../../models/announcementModel.js';

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and PDFs only
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, JPG, PNG, GIF, WEBP) and PDF files are allowed.'));
    }
  }
});

// Export multer middleware for route usage
export const uploadFile = upload.single('file');

/**
 * Controller for announcement operations
 */
class AnnouncementController {
  /**
   * Send a new announcement with optional file attachment
   */
  sendAnnouncement = asyncHandler(async (req, res) => {
    const { title, message } = req.body;
    
    if (!title || !message) {
      throw ApiError.badRequest('Title and message are required.');
    }

    // Process the announcement with optional file
    const result = await announcementModel.create(
      { title, message },
      req.file?.buffer,
      req.file
    );

    return ApiResponse.success(
      res, 
      'Announcement sent successfully!',
      { 
        announcement: result.announcement,
        file_uploaded: result.fileUploaded
      },
      201
    );
  });

  /**
   * Get all announcements
   */
  getAnnouncements = asyncHandler(async (req, res) => {
    const announcements = await announcementModel.getAll();
    return ApiResponse.success(res, 'Announcements retrieved successfully', { announcements });
  });

  /**
   * Delete an announcement by ID
   */
  deleteAnnouncement = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    if (!id) {
      throw ApiError.badRequest('Announcement ID is required.');
    }

    await announcementModel.delete(id);
    
    return ApiResponse.success(res, 'Announcement deleted successfully');
  });

  /**
   * Download a file attached to an announcement
   */
  downloadAnnouncementFile = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    if (!id) {
      throw ApiError.badRequest('Announcement ID is required.');
    }

    try {
      const { fileData, fileName, fileType } = await announcementModel.downloadFile(id);
      
      // Convert blob to buffer
      const buffer = await fileData.arrayBuffer();

      // Set appropriate headers
      res.setHeader('Content-Type', fileType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      
      // Send file
      res.send(Buffer.from(buffer));
    } catch (error) {
      throw ApiError.notFound('File not found or could not be downloaded');
    }
  });
}

export default new AnnouncementController();