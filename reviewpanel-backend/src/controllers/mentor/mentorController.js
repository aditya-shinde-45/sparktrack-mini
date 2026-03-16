import ApiResponse from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/errorHandler.js';
import mentorModel from '../../models/mentorModel.js';
import supabase from '../../config/database.js';

/**
 * Controller for mentor operations
 */
class MentorController {
  getScopedGroupIds = async (user = {}) => {
    const role = String(user?.role || '').toLowerCase();

    if (role === 'mentor') {
      const mentorCode = user?.mentor_code || user?.mentor_id || null;
      if (!mentorCode) return [];

      const { data, error } = await supabase
        .from('pbl')
        .select('group_id')
        .eq('mentor_code', mentorCode);

      if (error) throw error;
      return [...new Set((data || []).map((row) => row.group_id).filter(Boolean))];
    }

    if (role === 'industry_mentor') {
      const mentorCodes = Array.isArray(user?.mentor_codes) && user.mentor_codes.length > 0
        ? user.mentor_codes
        : (user?.mentor_code ? [user.mentor_code] : []);

      if (mentorCodes.length === 0) return [];

      const { data, error } = await supabase
        .from('pbl')
        .select('group_id')
        .in('mentor_code', mentorCodes);

      if (error) throw error;
      return [...new Set((data || []).map((row) => row.group_id).filter(Boolean))];
    }

    return null;
  };

  /**
   * Get all mentors with their assigned groups
   */
  getAllMentors = asyncHandler(async (req, res) => {
    const mentorsData = await mentorModel.getAll();
    const { data: pblRows, error: pblError } = await supabase
      .from('pbl')
      .select('mentor_code, group_id')
      .not('mentor_code', 'is', null);

    if (pblError) {
      throw pblError;
    }

    const groupsByMentor = new Map();
    (pblRows || []).forEach((row) => {
      if (!row.mentor_code || !row.group_id) {
        return;
      }
      if (!groupsByMentor.has(row.mentor_code)) {
        groupsByMentor.set(row.mentor_code, new Set());
      }
      groupsByMentor.get(row.mentor_code).add(row.group_id);
    });

    const mentors = (mentorsData || []).map((mentor) => ({
      ...mentor,
      groups: Array.from(groupsByMentor.get(mentor.mentor_code) || [])
    }));

    return ApiResponse.success(res, 'Mentors retrieved successfully', { mentors });
  });

  /**
   * Add a new mentor
   */
  addMentor = asyncHandler(async (req, res) => {
    const { mentor_name, contact_number, email, designation } = req.body;
    
    const data = await mentorModel.create({
      mentor_name,
      contact_number,
      email: email || null,
      designation: designation || null
    });
    
    return ApiResponse.success(
      res, 
      'Mentor added successfully',
      { data },
      201
    );
  });

  /**
   * Update mentor information
   */
  updateMentor = asyncHandler(async (req, res) => {
    const { mentor_name } = req.params;
    const { contact_number, email, designation } = req.body;
    
    const updated = await mentorModel.update(mentor_name, { contact_number, email, designation });
    
    return ApiResponse.success(res, 'Mentor updated successfully', { updated });
  });

  /**
   * Delete a mentor
   */
  deleteMentor = asyncHandler(async (req, res) => {
    const { mentor_name } = req.params;
    
    await mentorModel.delete(mentor_name);
    
    return ApiResponse.success(res, 'Mentor deleted successfully');
  });

  /**
   * Get evaluation marks (Review 1 & Review 2) for a specific group
   */
  getEvaluationMarksByGroup = asyncHandler(async (req, res) => {
    const { group_id } = req.params;
    const formId = String(req.query?.formId || '').trim();
    
    if (!group_id) {
      return ApiResponse.error(res, 'Group ID is required', 400);
    }

    const scopedGroupIds = await this.getScopedGroupIds(req.user || {});
    if (Array.isArray(scopedGroupIds) && !scopedGroupIds.includes(group_id)) {
      return ApiResponse.error(res, 'You can access marks only for your assigned groups', 403);
    }

    let submissionsQuery = supabase
      .from('evaluation_form_submissions')
      .select(`
        id,
        form_id,
        group_id,
        external_name,
        feedback,
        evaluations,
        created_at,
        evaluation_forms (name, total_marks)
      `)
      .eq('group_id', group_id);

    if (formId) {
      submissionsQuery = submissionsQuery.eq('form_id', formId);
    }

    const { data: submissions, error: submissionsError } = await submissionsQuery
      .order('created_at', { ascending: true });

    if (submissionsError) {
      throw submissionsError;
    }

    const evaluations = (submissions || []).map((submission) => ({
      form_id: submission.form_id,
      form_name: submission.evaluation_forms?.name || 'Unknown Form',
      total_marks: submission.evaluation_forms?.total_marks || 0,
      external_name: submission.external_name,
      feedback: submission.feedback,
      student_marks: submission.evaluations || [],
      submitted_at: submission.created_at
    }));

    return ApiResponse.success(res, 'Evaluation marks retrieved successfully', {
      evaluations
    });
  });
}

export default new MentorController();