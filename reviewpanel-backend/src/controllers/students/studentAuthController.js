import ApiResponse from '../../utils/apiResponse.js';
import { asyncHandler, ApiError } from '../../utils/errorHandler.js';
import studentAuthModel from '../../models/studentAuthModel.js';
import emailService from '../../services/emailService.js';

/**
 * Controller for student authentication operations
 */
class StudentAuthController {
  /**
   * Send OTP for first-time registration
   */
  sendFirstTimeOtp = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
      throw ApiError.badRequest('Email is required.');
    }

    const authRecord = await studentAuthModel.getAuthByEmail(email);
    if (authRecord?.password_hash) {
      throw ApiError.badRequest('User already registered. Please login or use forgot password.');
    }

    const studentRecord = await studentAuthModel.checkEmailInRecords(email);
    if (!studentRecord) {
      throw ApiError.badRequest('Email not found in student records.');
    }

    let otpDetails;
    if (authRecord) {
      otpDetails = await studentAuthModel.updateOtp(email);
    } else {
      otpDetails = await studentAuthModel.saveOtp(email, studentRecord.enrollment_no);
    }

    await emailService.sendOtpEmail(email, otpDetails.otp);

    return ApiResponse.success(res, 'OTP sent to your email.');
  });

  /**
   * Set password for first-time users after OTP verification
   */
  setNewUserPassword = asyncHandler(async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      throw ApiError.badRequest('Email, OTP, and new password are required.');
    }

    const authRecord = await studentAuthModel.getAuthByEmail(email);
    if (!authRecord) {
      throw ApiError.badRequest('User not found. Please request OTP first.');
    }

    if (authRecord.password_hash) {
      throw ApiError.badRequest('Password already set. Please login or use forgot password.');
    }

    const isValidOtp = await studentAuthModel.verifyOtp(email, otp);
    if (!isValidOtp) {
      throw ApiError.badRequest('Invalid or expired OTP.');
    }

    await studentAuthModel.setPassword(email, newPassword);

    return ApiResponse.success(res, 'Registration successful. You can now login.');
  });

  /**
   * Send OTP for forgot password flow
   */
  sendForgotPasswordOtp = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
      throw ApiError.badRequest('Email is required.');
    }

    const authRecord = await studentAuthModel.getAuthByEmail(email);
    if (!authRecord) {
      throw ApiError.badRequest('User not found.');
    }

    const otpDetails = await studentAuthModel.updateOtp(email);
    await emailService.sendOtpEmail(email, otpDetails.otp);

    return ApiResponse.success(res, 'OTP sent to your email.');
  });

  /**
   * Reset password using OTP
   */
  resetPasswordWithOtp = asyncHandler(async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      throw ApiError.badRequest('Email, OTP, and new password are required.');
    }

    const isValidOtp = await studentAuthModel.verifyOtp(email, otp);
    if (!isValidOtp) {
      throw ApiError.badRequest('Invalid or expired OTP.');
    }

    await studentAuthModel.setPassword(email, newPassword);

    return ApiResponse.success(res, 'Password reset successful. You can now login.');
  });

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

    const token = studentAuthModel.generateToken({
      student_id: student.student_id,
      enrollment_no: student.enrollment_no,
      email: student.email,
      role: student.role,
    });

    return ApiResponse.success(res, 'Login successful', {
      token,
      student: {
        enrollment_no: student.enrollment_no,
        email: student.email,
        role: student.role,
      },
    });
  });

  /**
   * Get authenticated student profile (core + extended)
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
   * Update basic student auth profile (email / enrollment mapping)
   */
  updateUserProfile = asyncHandler(async (req, res) => {
    const currentEmail = req.user?.email;
    const { enrollment_no, newEmail } = req.body;

    if (!currentEmail) {
      throw ApiError.badRequest('Authenticated email missing.');
    }

    if (!enrollment_no && !newEmail) {
      throw ApiError.badRequest('Provide enrollment number or new email to update.');
    }

    const updates = {};
    if (enrollment_no) updates.enrollment_no = enrollment_no;
    if (newEmail) updates.email = newEmail;

    const updated = await studentAuthModel.updateAuthByEmail(currentEmail, updates);

    return ApiResponse.success(res, 'Profile updated successfully.', { profile: updated });
  });

  /**
   * Change password for authenticated student (profile settings)
   */
  changePassword = asyncHandler(async (req, res) => {
    const enrollmentNo = req.user?.enrollment_no || req.user?.student_id;
    const { oldPassword, newPassword } = req.body;

    if (!enrollmentNo || !oldPassword || !newPassword) {
      throw ApiError.badRequest('Current and new passwords are required.');
    }

    const isValid = await studentAuthModel.validatePassword(enrollmentNo, oldPassword);
    if (!isValid) {
      throw ApiError.badRequest('Current password is incorrect.');
    }

    await studentAuthModel.updatePasswordByEnrollment(enrollmentNo, newPassword);

    return ApiResponse.success(res, 'Password changed successfully.');
  });

  /**
   * Update student password (header dropdown shortcut)
   */
  updateStudentPassword = asyncHandler(async (req, res) => {
    const enrollmentNo = req.user?.enrollment_no || req.user?.student_id;
    const { oldPassword, newPassword } = req.body;

    if (!enrollmentNo || !oldPassword || !newPassword) {
      throw ApiError.badRequest('Both old and new passwords are required.');
    }

    const isValid = await studentAuthModel.validatePassword(enrollmentNo, oldPassword);
    if (!isValid) {
      throw ApiError.badRequest('Current password is incorrect.');
    }

    await studentAuthModel.updatePasswordByEnrollment(enrollmentNo, newPassword);

    return ApiResponse.success(res, 'Password updated successfully.');
  });
}

export default new StudentAuthController();