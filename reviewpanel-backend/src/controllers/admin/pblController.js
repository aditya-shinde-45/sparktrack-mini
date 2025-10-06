import ApiResponse from '../../utils/apiResponse.js';
import { asyncHandler, ApiError } from '../../utils/errorHandler.js';
import pblModel from '../../models/pblModel.js';

/**
 * Controller for PBL group operations
 */
class PblController {
  /**
   * Get all PBL groups with optional class filtering and review type
   */
  getPBLData = asyncHandler(async (req, res) => {
    const classFilter = req.query.class?.toUpperCase();
    const reviewType = req.query.review || 'review1'; // 'review1' or 'review2'
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const searchQuery = req.query.search || '';
    
    const result = await pblModel.getAll(classFilter, reviewType, limit, offset, searchQuery);
    
    return ApiResponse.success(res, 'PBL data retrieved successfully', {
      data: result.data,
      pagination: {
        currentPage: page,
        totalPages: result.totalPages,
        totalRecords: result.totalRecords,
        limit: limit,
        hasNextPage: page < result.totalPages,
        hasPrevPage: page > 1
      }
    });
  });

  /**
   * Get a specific PBL group by ID
   */
  getPBLGroupById = asyncHandler(async (req, res) => {
    const { group_id } = req.params;

    if (!group_id) {
      throw ApiError.badRequest('Group ID is required.');
    }

    const data = await pblModel.getByGroupId(group_id);

    if (!data || data.length === 0) {
      throw ApiError.notFound('Group not found.');
    }

    // Extract group-level info from first row
    const { guide_name, guide_contact } = data[0];

    // Extract student info from all rows
    const students = data.map(row => ({
      enrollement_no: row.enrollement_no,
      name_of_student: row.name_of_student,
      class: row.class,
      email_id: row.email_id,
      contact: row.contact,
    }));

    return ApiResponse.success(res, 'PBL group retrieved successfully', {
      group_id,
      guide_name,
      guide_contact,
      students,
    });
  });

  /**
   * Add a new PBL group with students
   */
  addPBLGroup = asyncHandler(async (req, res) => {
    const { group_id, guide_name, guide_contact, students } = req.body;

    if (
      !group_id ||
      !guide_name ||
      !guide_contact ||
      !Array.isArray(students) ||
      students.length === 0
    ) {
      throw ApiError.badRequest('Missing required fields or students array.');
    }

    // Prepare rows for insertion
    const rows = students.map(student => ({
      group_id,
      enrollement_no: student.enrollement_no,
      name_of_student: student.name_of_student,
      class: student.class,
      email_id: student.email_id,
      contact: student.contact,
      guide_name,
      guide_contact,
      A: null,
      B: null,
      C: null,
      D: null,
      E: null,
      total: null,
      feedback: null,
    }));

    const data = await pblModel.create(rows);
    
    return ApiResponse.success(
      res, 
      'PBL group added successfully',
      { inserted: data },
      201
    );
  });

  /**
   * Update an existing PBL group
   */
  updatePBLGroup = asyncHandler(async (req, res) => {
    const { group_id } = req.params;
    const { guide_name, guide_contact, students } = req.body;

    if (!group_id) {
      throw ApiError.badRequest('Group ID is required.');
    }

    // Update guide info if provided
    if (guide_name || guide_contact) {
      const guideInfo = {};
      if (guide_name) guideInfo.guide_name = guide_name;
      if (guide_contact) guideInfo.guide_contact = guide_contact;
      
      await pblModel.updateGuideInfo(group_id, guideInfo);
    }

    // Update student info if provided
    if (Array.isArray(students) && students.length > 0) {
      for (const student of students) {
        const studentData = {
          name_of_student: student.name_of_student,
          class: student.class,
          email_id: student.email_id,
          contact: student.contact,
        };
        
        await pblModel.updateStudent(
          group_id,
          student.enrollement_no,
          studentData
        );
      }
    }

    return ApiResponse.success(res, 'PBL group updated successfully');
  });

  /**
   * Delete a PBL group
   */
  deletePBLGroup = asyncHandler(async (req, res) => {
    const { group_id } = req.params;

    if (!group_id) {
      throw ApiError.badRequest('Group ID is required.');
    }

    await pblModel.deleteGroup(group_id);
    
    return ApiResponse.success(res, 'PBL group deleted successfully');
  });
}

export default new PblController();