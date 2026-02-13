import ApiResponse from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/errorHandler.js';
import mentorModel from '../../models/mentorModel.js';
import supabase from '../../config/database.js';

/**
 * Controller for mentor operations
 */
class MentorController {
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
}

export default new MentorController();