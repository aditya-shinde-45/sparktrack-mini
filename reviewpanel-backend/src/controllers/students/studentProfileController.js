import multer from 'multer';
import ApiResponse from '../../utils/apiResponse.js';
import { asyncHandler, ApiError } from '../../utils/errorHandler.js';
import studentProfileModel from '../../models/studentProfileModel.js';

// Configure multer for in-memory uploads
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'resume') {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      if (!allowedTypes.includes(file.mimetype)) {
        return cb(new Error('Only PDF or Word documents are allowed for resume uploads.'));
      }
    } else if (file.fieldname === 'profilePicture') {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (!allowedTypes.includes(file.mimetype)) {
        return cb(new Error('Only JPG, PNG, or WebP images are allowed for profile pictures.'));
      }
    }
    cb(null, true);
  },
});

export const uploadFiles = upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'profilePicture', maxCount: 1 },
]);

/**
 * Controller for student profile operations
 */
class StudentProfileController {
  /**
   * Get the full student profile (core + extended data)
   */
  getStudentProfile = asyncHandler(async (req, res) => {
    const { enrollment_no } = req.params;

    if (!enrollment_no) {
      throw ApiError.badRequest('Enrollment number is required.');
    }

    const profile = await studentProfileModel.getFullProfile(enrollment_no);

    return ApiResponse.success(res, 'Student profile retrieved successfully.', { profile });
  });

  /**
   * Update student profile details, handling optional file uploads
   */
  updateStudentProfile = asyncHandler(async (req, res) => {
    const { enrollment_no } = req.params;
    const { bio, skills, github_url, linkedin_url, portfolio_url, phone } = req.body;

    if (!enrollment_no) {
      throw ApiError.badRequest('Enrollment number is required.');
    }

    // Ensure student exists
    await studentProfileModel.getFullProfile(enrollment_no);

    const existingProfile = await studentProfileModel.getProfile(enrollment_no);

    const updates = {
      bio,
      skills,
      github_url,
      linkedin_url,
      portfolio_url,
      phone,
      resume_url: existingProfile?.resume_url || null,
      profile_picture_url: existingProfile?.profile_picture_url || null,
    };

    if (req.files?.resume?.[0]) {
      if (existingProfile?.resume_url) {
        await studentProfileModel.deleteFile(existingProfile.resume_url);
      }
      updates.resume_url = await studentProfileModel.uploadFile(req.files.resume[0], 'resumes', enrollment_no);
    }

    if (req.files?.profilePicture?.[0]) {
      if (existingProfile?.profile_picture_url) {
        await studentProfileModel.deleteFile(existingProfile.profile_picture_url);
      }
      updates.profile_picture_url = await studentProfileModel.uploadFile(req.files.profilePicture[0], 'profile-pictures', enrollment_no);
    }

    const profile = await studentProfileModel.upsertProfile(enrollment_no, updates);
    const fullProfile = {
      ...profile,
      enrollment_no,
    };

    return ApiResponse.success(res, 'Student profile updated successfully.', { profile: fullProfile });
  });
}

export default new StudentProfileController();
