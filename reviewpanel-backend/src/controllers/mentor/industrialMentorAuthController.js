import jwt from 'jsonwebtoken';
import { asyncHandler, ApiError } from '../../utils/errorHandler.js';
import ApiResponse from '../../utils/apiResponse.js';
import industrialMentorModel from '../../models/industrialMentorModel.js';
import config from '../../config/index.js';
import supabase from '../../config/database.js';

class IndustrialMentorAuthController {
  industrialMentorLogin = asyncHandler(async (req, res) => {
    const { username, password } = req.body || {};

    if (!username || !password) {
      throw ApiError.badRequest('Username and password are required');
    }

    const mentor = await industrialMentorModel.validateCredentials(username, password);
    if (!mentor) {
      throw ApiError.unauthorized('Invalid industrial mentor credentials');
    }

    const token = jwt.sign(
      {
        industrial_mentor_code: mentor.industrial_mentor_code,
        mentor_code: mentor.mentor_code,
        name: mentor.name,
        contact: mentor.contact,
        email: mentor.email,
        role: 'industry_mentor'
      },
      config.jwt.secret,
      { expiresIn: '7d' }
    );

    return ApiResponse.success(res, 'Industrial mentor login successful', {
      token,
      industrial_mentor_code: mentor.industrial_mentor_code,
      mentor_code: mentor.mentor_code,
      name: mentor.name,
      contact: mentor.contact,
      email: mentor.email
    });
  });

  getIndustrialMentorGroups = asyncHandler(async (req, res) => {
    const mentorCode = req.user?.mentor_code;

    if (!mentorCode) {
      throw ApiError.badRequest('Mentor code is required');
    }

    const { data: pblRows, error } = await supabase
      .from('pbl')
      .select('group_id')
      .eq('mentor_code', mentorCode);

    if (error) {
      throw error;
    }

    const groups = [...new Set((pblRows || []).map((row) => row.group_id))];

    return ApiResponse.success(res, 'Industrial mentor groups retrieved successfully', {
      groups,
      mentor_code: mentorCode
    });
  });
}

export default new IndustrialMentorAuthController();
