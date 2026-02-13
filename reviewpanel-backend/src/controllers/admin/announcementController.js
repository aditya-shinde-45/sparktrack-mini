import multer from 'multer';
import ApiResponse from '../../utils/apiResponse.js';
import { asyncHandler, ApiError } from '../../utils/errorHandler.js';
import announcementModel from '../../models/announcementModel.js';
import evaluationFormModel from '../../models/evaluationFormModel.js';
import deadlineModel from '../../models/deadlineModel.js';

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

  /**
   * Get evaluation marks for an authenticated student
   */
  getEvaluationMarksForStudent = asyncHandler(async (req, res) => {
    const enrollmentNo = req.user?.enrollment_no || req.user?.student_id || req.query?.enrollment_no;

    if (!enrollmentNo) {
      throw ApiError.badRequest('Enrollment number is required.');
    }

    const forms = await evaluationFormModel.listForms();
    const deadlines = await deadlineModel.getAll();

    const enabledFormIds = new Set(
      (deadlines || [])
        .filter((deadline) => deadline?.key?.startsWith('show_evaluation_form_') && deadline.enabled)
        .map((deadline) => String(deadline.key).replace('show_evaluation_form_', ''))
    );

    const marks = [];

    for (const form of forms) {
      if (!enabledFormIds.has(String(form.id))) {
        continue;
      }

      const submissions = await evaluationFormModel.listSubmissionsByForm(form.id);
      let matched = null;

      for (const submission of submissions) {
        const evaluations = Array.isArray(submission.evaluations) ? submission.evaluations : [];
        const evaluation = evaluations.find(
          (row) => (row.enrollment_no || row.enrollement_no) === enrollmentNo
        );

        if (evaluation) {
          matched = { submission, evaluation };
          break;
        }
      }

      if (matched) {
        marks.push({
          form_id: form.id,
          form_name: form.name,
          total_marks: form.total_marks,
          group_id: matched.submission.group_id,
          external_name: matched.submission.external_name || null,
          created_at: matched.submission.created_at || null,
          evaluation: {
            total: matched.evaluation.total ?? null,
            marks: matched.evaluation.marks || {},
            absent: matched.evaluation.absent || false,
            feedback: matched.evaluation.feedback || matched.submission.feedback || null,
            student_name: matched.evaluation.student_name || matched.evaluation.name_of_student || null
          }
        });
      } else {
        marks.push({
          form_id: form.id,
          form_name: form.name,
          total_marks: form.total_marks,
          evaluation: null
        });
      }
    }

    return ApiResponse.success(res, 'Evaluation marks retrieved successfully', { marks });
  });
}

export default new AnnouncementController();