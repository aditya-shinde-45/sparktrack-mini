import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { asyncHandler, ApiError } from '../../utils/errorHandler.js';
import ApiResponse from '../../utils/apiResponse.js';
import industrialMentorModel from '../../models/industrialMentorModel.js';
import config from '../../config/index.js';
import supabase from '../../config/database.js';
import mentorOTPService from '../../services/mentorOTPService.js';
import emailService from '../../services/emailService.js';
import { validatePassword } from '../../utils/passwordValidator.js';

class IndustrialMentorAuthController {
  requestOtp = asyncHandler(async (req, res) => {
    const { contact_number } = req.body || {};

    if (!contact_number) {
      throw ApiError.badRequest('Contact number is required');
    }

    const mentor = await industrialMentorModel.getOneByContact(contact_number);
    if (!mentor) {
      throw ApiError.notFound('Industry mentor not found with this contact number');
    }

    if (!mentor.email) {
      throw ApiError.badRequest(
        'No email address is registered for this industry mentor. Please contact your administrator.'
      );
    }

    const mentorName = mentor.name || 'Industry Mentor';

    const { sessionToken, otp, expiresInMinutes } = await mentorOTPService.createOTP(
      contact_number,
      mentor.email,
      mentorName
    );

    await emailService.sendMentorOtpEmail(mentor.email, otp, mentorName, expiresInMinutes);

    const [local, domain] = mentor.email.split('@');
    const maskedEmail = `${local.slice(0, 2)}****@${domain}`;

    return ApiResponse.success(res, 'OTP sent to your registered email address', {
      session_token: sessionToken,
      email: maskedEmail,
      expires_in_minutes: expiresInMinutes,
    });
  });

  verifyOtp = asyncHandler(async (req, res) => {
    const { session_token, otp } = req.body || {};

    if (!session_token || !otp) {
      throw ApiError.badRequest('Session token and OTP are required');
    }

    const result = await mentorOTPService.verifyOTP(session_token, otp);

    if (!result.success) {
      const statusCode = result.error?.includes('Maximum') ? 429 : 400;
      return ApiResponse.error(res, result.error, statusCode, {
        remainingAttempts: result.remainingAttempts,
      });
    }

    return ApiResponse.success(res, result.message, {
      session_token,
      contact_number: result.contactNumber,
    });
  });

  setIndustrialMentorPassword = asyncHandler(async (req, res) => {
    const { contact_number, password, confirm_password, session_token } = req.body || {};

    if (!contact_number || !password || !confirm_password || !session_token) {
      throw ApiError.badRequest('Contact number, session token, and passwords are required');
    }

    if (password !== confirm_password) {
      throw ApiError.badRequest('Passwords do not match');
    }

    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) {
      throw ApiError.badRequest(pwCheck.message);
    }

    const verified = await mentorOTPService.isVerified(session_token, contact_number);
    if (!verified) {
      throw ApiError.unauthorized('OTP session expired. Please restart the password reset process.');
    }

    const updatedRecords = await industrialMentorModel.setPasswordByContact(contact_number, password);
    if (!updatedRecords || updatedRecords.length === 0) {
      throw ApiError.notFound('Industry mentor not found with this contact number');
    }

    await mentorOTPService.invalidateSession(session_token);

    return ApiResponse.success(res, 'Password set successfully', { contact_number });
  });

  industrialMentorLogin = asyncHandler(async (req, res) => {
    const { username, password } = req.body || {};

    if (!username || !password) {
      throw ApiError.badRequest('Username and password are required');
    }

    const records = await industrialMentorModel.validateCredentials(username, password);
    if (!records || records.length === 0) {
      throw ApiError.unauthorized('Invalid industrial mentor credentials');
    }

    // Primary record (first entry) used for identity fields
    const primary = records[0];
    // Collect all unique mentor_codes this industry mentor is linked to
    const mentorCodes = [...new Set(records.map((r) => r.mentor_code).filter(Boolean))];

    const token = jwt.sign(
      {
        industrial_mentor_code: primary.industrial_mentor_code,
        mentor_code: primary.mentor_code,
        mentor_codes: mentorCodes,
        name: primary.name,
        contact: primary.contact,
        email: primary.email,
        role: 'industry_mentor',
        jti: randomUUID()
      },
      config.jwt.secret,
      { expiresIn: '7d' }
    );

    return ApiResponse.success(res, 'Industrial mentor login successful', {
      token,
      industrial_mentor_code: primary.industrial_mentor_code,
      mentor_code: primary.mentor_code,
      mentor_codes: mentorCodes,
      name: primary.name,
      contact: primary.contact,
      email: primary.email
    });
  });

  getIndustrialMentorGroups = asyncHandler(async (req, res) => {
    // Support both single mentor_code (legacy) and array mentor_codes
    const primaryMentorCode = req.user?.mentor_code;
    const mentorCodes = Array.isArray(req.user?.mentor_codes) && req.user.mentor_codes.length > 0
      ? req.user.mentor_codes
      : (primaryMentorCode ? [primaryMentorCode] : []);

    if (mentorCodes.length === 0) {
      throw ApiError.badRequest('Mentor code is required');
    }

    // Fetch PBL rows for all linked faculties
    const { data: pblRows, error: pblError } = await supabase
      .from('pbl')
      .select('group_id, mentor_code')
      .in('mentor_code', mentorCodes);

    if (pblError) {
      throw pblError;
    }

    // Fetch mentor names for all linked faculties
    const { data: mentorRows, error: mentorError } = await supabase
      .from('mentors')
      .select('mentor_code, mentor_name')
      .in('mentor_code', mentorCodes);

    if (mentorError) {
      throw mentorError;
    }

    const mentorNameMap = {};
    (mentorRows || []).forEach((m) => {
      mentorNameMap[m.mentor_code] = m.mentor_name;
    });

    // Group groups by faculty
    const facultyMap = {};
    (pblRows || []).forEach((row) => {
      const code = row.mentor_code;
      if (!facultyMap[code]) {
        facultyMap[code] = {
          mentor_code: code,
          faculty_name: mentorNameMap[code] || code,
          groups: []
        };
      }
      if (!facultyMap[code].groups.includes(row.group_id)) {
        facultyMap[code].groups.push(row.group_id);
      }
    });

    const groupsByFaculty = Object.values(facultyMap);
    // Flat list for backward compatibility
    const groups = [...new Set((pblRows || []).map((row) => row.group_id))];

    return ApiResponse.success(res, 'Industrial mentor groups retrieved successfully', {
      groups,
      groupsByFaculty,
      mentor_code: primaryMentorCode,
      mentor_codes: mentorCodes
    });
  });
}

export default new IndustrialMentorAuthController();
