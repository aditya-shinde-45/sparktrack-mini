import ApiResponse from '../../utils/apiResponse.js';
import { asyncHandler, ApiError } from '../../utils/errorHandler.js';
import studentAuthModel from '../../models/studentAuthModel.js';

/**
 * Controller for student authentication operations
 */
class StudentAuthController {
  /**
   * Student login with enrollment number and password
   */
  studentLogin = asyncHandler(async (req, res) => {
    const { enrollment_no, password } = req.body;

    if (!enrollment_no || !password) {
      throw ApiError.badRequest('Enrollment number and password are required.');
    }

    const student = await studentAuthModel.validateCredentials(enrollment_no, password);
    if (!student) {
      throw ApiError.unauthorized('Invalid enrollment number or password.');
    }

    // Generate access token
    const token = studentAuthModel.generateToken({
      student_id: student.student_id,
      enrollment_no: student.enrollment_no,
      email: student.email,
      role: student.role,
    });

    const responseData = {
      token,
      student: {
        enrollment_no: student.enrollment_no,
        email: student.email,
        role: student.role,
      },
    };

    return ApiResponse.success(res, 'Login successful', responseData);
  });

  /**
   * Get authenticated student profile
   */
  getStudentProfile = asyncHandler(async (req, res) => {
    const enrollmentNo = req.user?.enrollment_no || req.user?.student_id;

    if (!enrollmentNo) {
      throw ApiError.badRequest('Enrollment number missing in token.');
    }

    const profile = await studentAuthModel.getStudentProfile(enrollmentNo);

    return ApiResponse.success(res, 'Profile retrieved successfully.', { profile });
  });

  /**
   * Update student password
   */
  updateStudentPassword = asyncHandler(async (req, res) => {
    const enrollmentNo = req.user?.enrollment_no || req.user?.student_id;
    const { newPassword } = req.body;

    if (!enrollmentNo || !newPassword) {
      throw ApiError.badRequest('New password is required.');
    }

    await studentAuthModel.updatePassword(enrollmentNo, newPassword);

    return ApiResponse.success(res, 'Password updated successfully.');
  });

  /**
   * Logout student (placeholder for future token invalidation)
   */
  logout = asyncHandler(async (req, res) => {
    return ApiResponse.success(res, 'Logged out successfully.');
  });
}

export default new StudentAuthController();