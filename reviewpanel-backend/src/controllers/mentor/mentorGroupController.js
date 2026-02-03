import { asyncHandler, ApiError } from '../../utils/errorHandler.js';
import ApiResponse from '../../utils/apiResponse.js';
import supabase from '../../config/database.js';

class MentorGroupController {
  /**
   * Get groups assigned to mentor using mentor_code (from mentors table)
   */
  getGroupsByMentorCode = asyncHandler(async (req, res) => {
    const { mentor_id, mentor_code, contact_number } = req.user || {};

    if (!mentor_code && !mentor_id && !contact_number) {
      throw ApiError.badRequest('Mentor identification is required');
    }

    // Fetch mentor_code from mentors table
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

    const mentorCode = mentorData.mentor_code;

    // Fetch groups from pbl table by mentor_code
    const { data: pblData, error: pblError } = await supabase
      .from('pbl')
      .select('group_id')
      .eq('mentor_code', mentorCode);

    if (pblError) {
      throw pblError;
    }

    const groups = [...new Set((pblData || []).map((row) => row.group_id))];

    return ApiResponse.success(res, 'Mentor groups retrieved successfully', {
      groups,
      mentor_code: mentorCode
    });
  });
}

export default new MentorGroupController();
