import ApiResponse from '../../utils/apiResponse.js';
import { asyncHandler, ApiError } from '../../utils/errorHandler.js';
import pbl3Model from '../../models/pbl3Model.js';
import mentorModel from '../../models/mentorModel.js';
import deadlineModel from '../../models/deadlineModel.js';
import supabase from '../../config/database.js';
import jwt from 'jsonwebtoken';
import config from '../../config/index.js';

/**
 * Controller for PBL3 Review operations
 */
class Pbl3Controller {
  /**
   * Mentor login with phone number and fixed password
   */
  mentorLogin = asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      throw ApiError.badRequest('Phone number and password are required');
    }

    // Fixed password for all mentors
    const MENTOR_PASSWORD = 'ideabliss912';

    // Check if password matches
    if (password !== MENTOR_PASSWORD) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    // Find mentor by contact_number (phone)
    const { data: mentors, error } = await supabase.from('mentors')
      .select('mentor_id, mentor_name, contact_number, group_id')
      .eq('contact_number', username);

    if (error) throw error;

    if (!mentors || mentors.length === 0) {
      throw ApiError.unauthorized('Invalid phone number');
    }

    // Get the first mentor record (should have at least one group)
    const mentor = mentors[0];

    // Generate JWT token
    const token = jwt.sign(
      {
        mentor_id: mentor.mentor_id,
        mentor_name: mentor.mentor_name,
        contact_number: mentor.contact_number,
        role: 'mentor'
      },
      config.jwt.secret,
      { expiresIn: '1d' }
    );

    return ApiResponse.success(res, 'Mentor login successful', {
      token,
      mentor_id: mentor.mentor_id,
      mentor_name: mentor.mentor_name,
      contact_number: mentor.contact_number,
      role: 'mentor'
    });
  });

  /**
   * Get groups assigned to a mentor
   */
  getMentorGroups = asyncHandler(async (req, res) => {
    const { contact_number, mentor_name } = req.user;

    if (!contact_number && !mentor_name) {
      throw ApiError.badRequest('Mentor identification is required');
    }

    // Query by contact_number first (from token), fallback to mentor_name
    let mentorData;
    if (contact_number) {
      const { data, error } = await supabase.from('mentors')
        .select('mentor_id, mentor_name, contact_number, group_id')
        .eq('contact_number', contact_number);
      
      if (error) throw error;
      mentorData = data;
    } else {
      mentorData = await mentorModel.getByName(mentor_name);
    }

    if (!mentorData || mentorData.length === 0) {
      throw ApiError.notFound('Mentor not found');
    }

    // Extract unique group IDs
    const groups = [...new Set(mentorData.map(m => m.group_id))];

    return ApiResponse.success(res, 'Mentor groups retrieved successfully', { 
      groups,
      mentor_name: mentorData[0].mentor_name 
    });
  });

  /**
   * Get previously registered external evaluators by this mentor
   */
  getPreviousExternals = asyncHandler(async (req, res) => {
    const { contact_number, mentor_name } = req.user;

    if (!contact_number && !mentor_name) {
      throw ApiError.badRequest('Mentor identification is required');
    }

    // Get all groups assigned to this mentor
    let mentorData;
    if (contact_number) {
      const { data, error } = await supabase.from('mentors')
        .select('group_id')
        .eq('contact_number', contact_number);
      
      if (error) throw error;
      mentorData = data;
    } else {
      mentorData = await mentorModel.getByName(mentor_name);
    }

    if (!mentorData || mentorData.length === 0) {
      return ApiResponse.success(res, 'No previous externals found', { externals: [] });
    }

    const groupIds = [...new Set(mentorData.map(m => m.group_id))];

    // Get distinct external evaluators from these groups
    const { data: pblData, error: pblError } = await supabase
      .from('pbl3')
      .select('external1_name, external1_email, external1_phone, external1_org, external2_name, external2_email, external2_phone, external2_org')
      .in('group_id', groupIds)
      .not('external1_email', 'is', null);

    if (pblError) throw pblError;

    // Collect unique externals
    const externalsMap = new Map();

    pblData.forEach(row => {
      if (row.external1_email) {
        externalsMap.set(row.external1_email, {
          name: row.external1_name,
          email: row.external1_email,
          phone: row.external1_phone,
          organization: row.external1_org
        });
      }
      if (row.external2_email) {
        externalsMap.set(row.external2_email, {
          name: row.external2_name,
          email: row.external2_email,
          phone: row.external2_phone,
          organization: row.external2_org
        });
      }
    });

    const externals = Array.from(externalsMap.values());

    return ApiResponse.success(res, 'Previous externals retrieved successfully', { 
      externals,
      count: externals.length
    });
  });

  /**
   * Register external evaluators for a group (by mentor)
   */
  registerExternals = asyncHandler(async (req, res) => {
    const { mentor_name, contact_number } = req.user;
    const { group_id, externals } = req.body;

    if (!group_id || !externals || !Array.isArray(externals)) {
      throw ApiError.badRequest('Group ID and externals array are required');
    }

    // Validate: minimum 1, maximum 2 externals
    if (externals.length < 1 || externals.length > 2) {
      throw ApiError.badRequest('Must provide 1 or 2 external evaluators');
    }

    // Validate each external has required fields
    for (const ext of externals) {
      if (!ext.name || !ext.organization || !ext.phone || !ext.email) {
        throw ApiError.badRequest('Each external must have name, organization, phone, and email');
      }
    }

    // Check if group exists
    const groupExists = await pbl3Model.groupExists(group_id);
    if (!groupExists) {
      throw ApiError.notFound('Group not found');
    }

    // Check if this mentor is assigned to this group - use contact_number for more reliable lookup
    let mentorData;
    if (contact_number) {
      const { data, error } = await supabase.from('mentors')
        .select('mentor_id, mentor_name, contact_number, group_id')
        .eq('contact_number', contact_number);
      
      if (error) throw error;
      mentorData = data;
    } else {
      mentorData = await mentorModel.getByName(mentor_name);
    }

    if (!mentorData || mentorData.length === 0) {
      throw ApiError.notFound('Mentor not found');
    }

    const assignedGroups = mentorData.map(m => m.group_id);

    if (!assignedGroups.includes(group_id)) {
      throw ApiError.forbidden('You are not assigned to this group');
    }

    // Register externals in pbl3 table
    const result = await pbl3Model.registerExternals(group_id, externals);

    // TODO: Send OTP emails to external evaluators (for now, OTP is hardcoded as "123456")

    return ApiResponse.success(res, 'External evaluators registered successfully. OTP sent to their emails.', {
      group_id,
      externals: externals.map(e => ({ name: e.name, email: e.email })),
      otp_note: 'OTP is 123456 (hardcoded for now)'
    });
  });

  /**
   * Verify external evaluator OTP
   */
  verifyExternalOTP = asyncHandler(async (req, res) => {
    const { group_id, email, otp } = req.body;

    if (!group_id || !email || !otp) {
      throw ApiError.badRequest('Group ID, email, and OTP are required');
    }

    // Verify OTP
    const result = await pbl3Model.verifyExternalOTP(group_id, email, otp);

    if (!result.verified) {
      throw ApiError.unauthorized(result.message);
    }

    // Generate JWT token for external evaluator
    const token = jwt.sign(
      {
        email,
        group_id,
        role: 'external_pbl3'
      },
      config.jwt.secret,
      { expiresIn: '1d' }
    );

    return ApiResponse.success(res, 'OTP verified successfully', {
      token,
      email,
      group_id,
      role: 'external_pbl3'
    });
  });

  /**
   * Get group evaluation data
   */
  getGroupEvaluation = asyncHandler(async (req, res) => {
    const { groupId } = req.params;

    // Check if PBL Review 3 is enabled
    const isEnabled = await deadlineModel.getByKey('pbl_review_3');
    if (!isEnabled || !isEnabled.enabled) {
      throw ApiError.forbidden('PBL Review 3 is currently disabled by admin');
    }

    if (!groupId) {
      throw ApiError.badRequest('Group ID is required');
    }

    const evaluations = await pbl3Model.getStudentsByGroup(groupId);

    return ApiResponse.success(res, 'Group evaluation retrieved successfully', {
      group_id: groupId,
      evaluations
    });
  });

  /**
   * Save evaluation for a group
   */
  saveEvaluation = asyncHandler(async (req, res) => {
    const evaluation = req.body;

    // Check if PBL Review 3 is enabled
    const isEnabled = await deadlineModel.getByKey('pbl_review_3');
    if (!isEnabled || !isEnabled.enabled) {
      throw ApiError.forbidden('PBL Review 3 is currently disabled by admin');
    }

    if (!evaluation.group_id || !evaluation.evaluations) {
      throw ApiError.badRequest('Group ID and evaluations are required');
    }

    // Save evaluation
    const saved = await pbl3Model.saveEvaluationBatch(
      evaluation.group_id,
      evaluation.evaluations,
      {
        feedback: evaluation.feedback,
        guide_name: evaluation.faculty_guide,
        industry_guide: evaluation.industry_guide,
        industry_guide_contact: evaluation.industry_guide_contact,
        industry_guide_email: evaluation.industry_guide_email,
        external1_name: evaluation.external1_name,
        external2_name: evaluation.external2_name,
        organization1_name: evaluation.organization1_name,
        organization2_name: evaluation.organization2_name,
        external1_phone: evaluation.ext1_contact,
        external2_phone: evaluation.ext2_contact,
        external1_email: evaluation.ext1_email,
        external2_email: evaluation.ext2_email,
        copyright: evaluation.copyright,
        patent: evaluation.patent,
        research_paper: evaluation.research_paper,
      }
    );

    return ApiResponse.success(res, 'PBL Review 3 evaluation saved successfully', { saved });
  });

  /**
   * Get all PBL3 data with filtering (admin only)
   */
  getAllPbl3Data = asyncHandler(async (req, res) => {
    const { class: classFilter, page = 1, limit = 50, search = '' } = req.query;
    const offset = (page - 1) * limit;

    const result = await pbl3Model.getAll(classFilter, limit, offset, search);

    return ApiResponse.success(res, 'PBL3 data retrieved successfully', result);
  });
}

export default new Pbl3Controller();
