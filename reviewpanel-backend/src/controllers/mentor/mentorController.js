import ApiResponse from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/errorHandler.js';
import mentorModel from '../../models/mentorModel.js';

/**
 * Controller for mentor operations
 */
class MentorController {
  /**
   * Get all mentors with their assigned groups
   */
  getAllMentors = asyncHandler(async (req, res) => {
    const mentorsData = await mentorModel.getAll();
    
    // Group mentors by mentor_name
    const mentorsMap = {};
    mentorsData.forEach(row => {
      if (!mentorsMap[row.mentor_name]) {
        mentorsMap[row.mentor_name] = {
          mentor_name: row.mentor_name,
          contact_number: row.contact_number,
          groups: [],
        };
      }
      mentorsMap[row.mentor_name].groups.push(row.group_id);
    });

    const mentors = Object.values(mentorsMap);
    
    return ApiResponse.success(res, 'Mentors retrieved successfully', { mentors });
  });

  /**
   * Add a new mentor
   */
  addMentor = asyncHandler(async (req, res) => {
    const { mentor_name, contact_number, group_id } = req.body;
    
    const data = await mentorModel.create({
      mentor_name,
      contact_number,
      group_id
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
    const { contact_number } = req.body;
    
    const updated = await mentorModel.update(mentor_name, { contact_number });
    
    return ApiResponse.success(res, 'Mentor updated successfully', { updated });
  });

  /**
   * Delete a mentor
   */
  deleteMentor = asyncHandler(async (req, res) => {
    const { mentor_name } = req.params;
    const { group_id } = req.query;
    
    await mentorModel.delete(mentor_name, group_id);
    
    return ApiResponse.success(res, 'Mentor deleted successfully');
  });
}

export default new MentorController();