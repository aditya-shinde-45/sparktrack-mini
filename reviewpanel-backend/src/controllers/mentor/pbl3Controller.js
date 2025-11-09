import ApiResponse from '../../utils/apiResponse.js';
import { asyncHandler, ApiError } from '../../utils/errorHandler.js';
import pbl3Model from '../../models/pbl3Model.js';
import mentorModel from '../../models/mentorModel.js';
import deadlineModel from '../../models/deadlineModel.js';
import externalOTPService from '../../services/externalOTP.js';
import emailService from '../../services/emailService.js';
import supabase from '../../config/database.js';
import jwt from 'jsonwebtoken';
import config from '../../config/index.js';

/**
 * Controller for PBL3 Review operations
 */
class Pbl3Controller {
  /**
   * Mentor login with phone number and fixed password
   * Username: contact_number (phone)
   * Password: MITADT1230 (fixed)
   */
  mentorLogin = asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      throw ApiError.badRequest('Phone number and password are required');
    }

    // Fixed password for all mentors
    const MENTOR_PASSWORD = 'MITADT1230';

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
   * Send OTP to external evaluators
   * POST /api/pbl3/send-external-otp
   */
  sendExternalOTP = asyncHandler(async (req, res) => {
    const { externals, group_ids } = req.body;
    const { contact_number, mentor_name } = req.user;

    // Validation
    if (!externals || !Array.isArray(externals) || externals.length === 0) {
      throw ApiError.badRequest('At least one external evaluator is required');
    }

    if (!group_ids || !Array.isArray(group_ids) || group_ids.length === 0) {
      throw ApiError.badRequest('Group IDs are required');
    }

    // Verify mentor has access to these groups
    let mentorData;
    try {
      if (contact_number) {
        const { data, error } = await supabase
          .from('mentors')
          .select('mentor_id, group_id')
          .eq('contact_number', contact_number);
        
        if (error) {
          console.error('Supabase error:', error);
          throw new Error(`Database error: ${error.message}`);
        }
        mentorData = data;
      } else if (mentor_name) {
        mentorData = await mentorModel.getByName(mentor_name);
      } else {
        throw ApiError.badRequest('Mentor identification is required');
      }
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      throw ApiError.internal('Failed to connect to database. Please check your internet connection.');
    }

    if (!mentorData || mentorData.length === 0) {
      throw ApiError.notFound('Mentor not found');
    }

    const mentorGroupIds = [...new Set(mentorData.map(m => m.group_id))];
    const invalidGroups = group_ids.filter(gid => !mentorGroupIds.includes(gid));

    if (invalidGroups.length > 0) {
      throw ApiError.forbidden('You do not have access to some of the specified groups');
    }

    const sessions = [];
    const failedEmails = [];

    // Generate OTP and send email for each external
    for (const external of externals) {
      try {
        // Validate external data
        if (!external.name || !external.email || !external.organization || !external.phone) {
          failedEmails.push({
            email: external.email || 'unknown',
            reason: 'Missing required fields'
          });
          continue;
        }

        // Create OTP session
        const otpResult = externalOTPService.createOTP(external.email, {
          name: external.name,
          organization: external.organization,
          phone: external.phone,
          groupIds: group_ids,
          mentorId: mentorData[0].mentor_id
        });

        // Get the actual OTP for sending email
        const otpData = externalOTPService.otpStore.get(otpResult.sessionToken);
        const otp = otpData ? otpData.otp : '123456';

        // Send OTP email
        await emailService.sendExternalOtpEmail(
          external.email,
          otp,
          external.name,
          external.organization,
          otpResult.expiresInMinutes
        );

        sessions.push(otpResult.sessionToken);

        console.log(`✅ OTP sent successfully to ${external.email}: ${otp}`);
      } catch (error) {
        console.error(`❌ Failed to send OTP to ${external.email}:`, error);
        failedEmails.push({
          email: external.email,
          reason: error.message
        });
      }
    }

    if (sessions.length === 0) {
      throw ApiError.badRequest('Failed to send OTP to any external evaluator');
    }

    return ApiResponse.success(res, `OTP sent to ${sessions.length} external evaluator(s)`, {
      sessions,
      expiresInMinutes: 10,
      ...(failedEmails.length > 0 && { failedEmails })
    });
  });

  /**
   * Verify OTP and register external evaluators
   * POST /api/pbl3/verify-external-otp
   */
  verifyExternalOTP = asyncHandler(async (req, res) => {
    const { verifications, group_ids } = req.body;
    const { contact_number, mentor_name } = req.user;

    // Validation
    if (!verifications || !Array.isArray(verifications) || verifications.length === 0) {
      throw ApiError.badRequest('Verification data is required');
    }

    const verifiedExternals = [];
    const failedVerifications = [];

    // Verify each OTP
    for (const verification of verifications) {
      const { sessionToken, otp } = verification;

      const result = externalOTPService.verifyOTP(sessionToken, otp);

      if (!result.success) {
        failedVerifications.push({
          sessionToken,
          error: result.error
        });
        continue;
      }

      verifiedExternals.push(result.data);
    }

    // If any verification failed, return error
    if (failedVerifications.length > 0) {
      throw ApiError.badRequest('OTP verification failed', { failedVerifications });
    }

    // Register all verified externals to all groups
    const registeredExternals = [];

    for (const external of verifiedExternals) {
      for (const groupId of group_ids) {
        // Get existing pbl3 record for this group
        const { data: existingPbl3, error: pbl3Error } = await supabase
          .from('pbl3')
          .select('*')
          .eq('group_id', groupId)
          .single();

        if (pbl3Error && pbl3Error.code !== 'PGRST116') {
          console.error('Error fetching pbl3 record:', pbl3Error);
          continue;
        }

        // Determine if this is external1 or external2
        const updateData = {};
        
        if (!existingPbl3 || !existingPbl3.external1_email) {
          // Register as external1
          updateData.external1_name = external.name;
          updateData.external1_email = external.email;
          updateData.external1_phone = external.phone;
          updateData.external1_org = external.organization;
        } else if (!existingPbl3.external2_email) {
          // Register as external2
          updateData.external2_name = external.name;
          updateData.external2_email = external.email;
          updateData.external2_phone = external.phone;
          updateData.external2_org = external.organization;
        } else {
          console.warn(`Group ${groupId} already has 2 externals registered`);
          continue;
        }

        // Update or insert pbl3 record
        if (existingPbl3) {
          const { error: updateError } = await supabase
            .from('pbl3')
            .update(updateData)
            .eq('group_id', groupId);

          if (updateError) {
            console.error('Error updating pbl3 record:', updateError);
            continue;
          }
        } else {
          const { error: insertError } = await supabase
            .from('pbl3')
            .insert({
              group_id: groupId,
              ...updateData
            });

          if (insertError) {
            console.error('Error inserting pbl3 record:', insertError);
            continue;
          }
        }
      }

      registeredExternals.push({
        email: external.email,
        name: external.name
      });

      // Send welcome email
      try {
        await emailService.sendExternalWelcomeEmail(
          external.email,
          external.name,
          group_ids.join(', ')
        );
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
      }

      // Invalidate the session token
      externalOTPService.invalidateSession(external.sessionToken);
    }

    return ApiResponse.success(res, `Successfully registered ${registeredExternals.length} external evaluator(s)`, {
      registeredExternals,
      groups: group_ids
    });
  });

  /**
   * Resend OTP to an external evaluator
   * POST /api/pbl3/resend-external-otp
   */
  resendExternalOTP = asyncHandler(async (req, res) => {
    const { sessionToken } = req.body;

    if (!sessionToken) {
      throw ApiError.badRequest('Session token is required');
    }

    // Get external data before resending
    const otpDataBefore = externalOTPService.getOTPData(sessionToken);

    if (!otpDataBefore) {
      throw ApiError.notFound('Invalid or expired session');
    }

    // Resend OTP
    const result = externalOTPService.resendOTP(sessionToken);
    
    // Get the new OTP for sending email
    const otpDataAfter = externalOTPService.otpStore.get(sessionToken);
    const otp = otpDataAfter ? otpDataAfter.otp : '123456';

    // Send new OTP email
    await emailService.sendExternalOtpEmail(
      otpDataBefore.email,
      otp,
      otpDataBefore.name,
      otpDataBefore.organization,
      result.expiresInMinutes
    );

    return ApiResponse.success(res, 'OTP resent successfully', {
      sessionToken: result.sessionToken,
      expiresInMinutes: result.expiresInMinutes
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
