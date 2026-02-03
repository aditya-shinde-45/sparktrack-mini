import jwt from 'jsonwebtoken';
import { asyncHandler, ApiError } from '../../utils/errorHandler.js';
import ApiResponse from '../../utils/apiResponse.js';
import mentorModel from '../../models/mentorModel.js';
import supabase from '../../config/database.js';
import config from '../../config/index.js';

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

  setMentorPassword = asyncHandler(async (req, res) => {
    const { contact_number, password, confirm_password } = req.body || {};

    if (!contact_number || !password || !confirm_password) {
      throw ApiError.badRequest('Contact number and passwords are required');
    }

    if (password !== confirm_password) {
      throw ApiError.badRequest('Passwords do not match');
    }

    await mentorModel.setPassword(contact_number, password);

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
    }

    const token = jwt.sign(
      {
        mentor_id: mentor.mentor_code,
        mentor_name: mentor.mentor_name,
        contact_number: mentor.contact_number,
        role: 'mentor'
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
