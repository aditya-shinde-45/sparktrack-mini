import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { asyncHandler, ApiError } from '../../utils/errorHandler.js';
import ApiResponse from '../../utils/apiResponse.js';
import mentorModel from '../../models/mentorModel.js';
import supabase from '../../config/database.js';
import config from '../../config/index.js';
import mentorOTPService from '../../services/mentorOTPService.js';
import emailService from '../../services/emailService.js';

class MentorAuthController {
  checkMentorStatus = asyncHandler(async (req, res) => {
    const contactNumber = req.body?.contact_number || req.body?.username;

    if (!contactNumber) {
      throw ApiError.badRequest('Contact number is required');
    }

    const status = await mentorModel.hasPassword(contactNumber);

    if (!status) {
      return ApiResponse.error(res, 'Mentor not found', 404);
    }

    return ApiResponse.success(res, 'Mentor status retrieved', status);
  });

  /**
   * Step 1 of password setup: send OTP to the mentor's registered email.
   * POST /api/mentors/request-otp
   * Body: { contact_number }
   */
  requestOtp = asyncHandler(async (req, res) => {
    const { contact_number } = req.body || {};

    if (!contact_number) {
      throw ApiError.badRequest('Contact number is required');
    }

    // Fetch mentor and confirm they exist
    const status = await mentorModel.hasPassword(contact_number);
    if (!status || !status.exists) {
      throw ApiError.notFound('Mentor not found with this contact number');
    }

    const mentor = status.mentor;

    if (!mentor.email) {
      throw ApiError.badRequest(
        'No email address is registered for this mentor. Please contact your administrator.'
      );
    }

    // Generate OTP and session token
    const { sessionToken, otp, expiresInMinutes } = mentorOTPService.createOTP(
      contact_number,
      mentor.email,
      mentor.mentor_name
    );

    // Send OTP email
    await emailService.sendMentorOtpEmail(mentor.email, otp, mentor.mentor_name, expiresInMinutes);

    // Mask email for response (e.g. ab****@gmail.com)
    const [local, domain] = mentor.email.split('@');
    const maskedEmail = `${local.slice(0, 2)}****@${domain}`;

    return ApiResponse.success(res, 'OTP sent to your registered email address', {
      session_token: sessionToken,
      email: maskedEmail,
      expires_in_minutes: expiresInMinutes,
    });
  });

  /**
   * Step 2 of password setup: verify OTP.
   * POST /api/mentors/verify-otp
   * Body: { session_token, otp }
   */
  verifyOtp = asyncHandler(async (req, res) => {
    const { session_token, otp } = req.body || {};

    if (!session_token || !otp) {
      throw ApiError.badRequest('Session token and OTP are required');
    }

    const result = mentorOTPService.verifyOTP(session_token, otp);

    if (!result.success) {
      // 429 if max attempts exceeded, 400 otherwise
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

  setMentorPassword = asyncHandler(async (req, res) => {
    const { contact_number, password, confirm_password, session_token } = req.body || {};

    if (!contact_number || !password || !confirm_password || !session_token) {
      throw ApiError.badRequest('Contact number, session token, and passwords are required');
    }

    if (password !== confirm_password) {
      throw ApiError.badRequest('Passwords do not match');
    }

    // Ensure the OTP session is verified for this contact number
    if (!mentorOTPService.isVerified(session_token, contact_number)) {
      throw ApiError.unauthorized('OTP not verified or session expired. Please verify your OTP first.');
    }

    await mentorModel.setPassword(contact_number, password);

    // Invalidate the OTP session so it cannot be reused
    mentorOTPService.invalidateSession(session_token);

    return ApiResponse.success(res, 'Password set successfully', { contact_number });
  });

  mentorLogin = asyncHandler(async (req, res) => {
    const { username, password } = req.body || {};

    if (!username || !password) {
      throw ApiError.badRequest('Username and password are required');
    }

    const status = await mentorModel.hasPassword(username);

    if (!status || !status.exists) {
      throw ApiError.notFound('Mentor not found');
    }

    const mentor = status.mentor;
    const requirePasswordChange = !status.hasPassword;

    if (!requirePasswordChange) {
      const validated = await mentorModel.validateCredentials(username, password);
      if (!validated) {
        throw ApiError.unauthorized('Invalid mentor credentials');
      }
    } else {
      // Password not yet set — return a prompt response without issuing a JWT
      return ApiResponse.success(res, 'Password setup required', {
        requirePasswordChange: true,
        mentor_id: mentor.mentor_code,
        mentor_name: mentor.mentor_name,
        contact_number: mentor.contact_number,
      });
    }

    const token = jwt.sign(
      {
        mentor_id: mentor.mentor_code,
        mentor_name: mentor.mentor_name,
        contact_number: mentor.contact_number,
        role: 'mentor',
        jti: randomUUID()
      },
      config.jwt.secret,
      { expiresIn: '7d' }
    );

    return ApiResponse.success(res, 'Mentor login successful', {
      token,
      requirePasswordChange,
      mentor_id: mentor.mentor_code,
      mentor_name: mentor.mentor_name,
      contact_number: mentor.contact_number,
      groups: []
    });
  });

  getMentorGroups = asyncHandler(async (req, res) => {
    const { mentor_id, mentor_code, contact_number } = req.user || {};

    if (!mentor_code && !mentor_id && !contact_number) {
      throw ApiError.badRequest('Mentor identification is required');
    }

    let mentorQuery = supabase.from('mentors').select('mentor_code');
    if (mentor_code) {
      mentorQuery = mentorQuery.eq('mentor_code', mentor_code);
    } else if (mentor_id) {
      mentorQuery = mentorQuery.eq('mentor_code', mentor_id);
    } else {
      mentorQuery = mentorQuery.eq('contact_number', contact_number);
    }

    const { data: mentorData, error: mentorError } = await mentorQuery.maybeSingle();

    if (mentorError) {
      throw mentorError;
    }

    if (!mentorData?.mentor_code) {
      return ApiResponse.success(res, 'No mentor code found for this mentor', {
        groups: [],
        mentor_code: null
      });
    }

    const { data: pblData, error: pblError } = await supabase
      .from('pbl')
      .select('group_id')
      .eq('mentor_code', mentorData.mentor_code);

    if (pblError) {
      throw pblError;
    }

    const groups = [...new Set((pblData || []).map((row) => row.group_id))];

    return ApiResponse.success(res, 'Mentor groups retrieved successfully', {
      groups,
      mentor_code: mentorData.mentor_code
    });
  });
}

export default new MentorAuthController();
