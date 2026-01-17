import { asyncHandler, ApiError } from '../../utils/errorHandler.js';
import ApiResponse from '../../utils/apiResponse.js';
import studentModel from '../../models/studentModel.js';
import pblModel from '../../models/pblModel.js';
import supabase from '../../config/database.js';

/**
 * Controller for student management operations
 */
class StudentController {
  /**
   * Get all students
   */
  getAllStudents = asyncHandler(async (req, res) => {
    const students = await studentModel.getAllWithProfiles();

    return ApiResponse.success(res, 'Students retrieved successfully', { students });
  });

  /**
   * Get a single student
   */
  getStudent = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id) {
      throw ApiError.badRequest('Student ID is required');
    }

    // Only allow students to access their own data
    if (req.user?.role === 'student' && req.user?.student_id !== id) {
      throw ApiError.forbidden('You can only access your own profile');
    }

    const student = await studentModel.getByEnrollmentNo(id);

    return ApiResponse.success(res, 'Student retrieved successfully', { student });
  });

  /**
   * Update a student
   */
  updateStudent = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, department, skills, interests } = req.body;

    if (!id) {
      throw ApiError.badRequest('Student ID is required');
    }

    if (req.user?.role === 'student' && req.user.student_id !== id) {
      throw ApiError.forbidden('You can only update your own profile');
    }

    if (req.user?.role !== 'admin' && email) {
      throw ApiError.forbidden('Only administrators can update email.');
    }

    await studentModel.getByEnrollmentNo(id);

    const updatedStudent = await studentModel.updateStudent(id, {
      name,
      email,
      phone,
      department,
      skills,
      interests,
    });

    return ApiResponse.success(res, 'Student updated successfully', { student: updatedStudent });
  });

  /**
   * Assign students to a group
   */
  assignStudentsToGroup = asyncHandler(async (req, res) => {
    const { studentIds, groupId } = req.body;
    
    if (!studentIds || !Array.isArray(studentIds) || !groupId) {
      throw ApiError.badRequest('Student IDs array and group ID are required');
    }
    
    // Check if group exists
    const groupExists = await pblModel.findGroupById(groupId);
    if (!groupExists) {
      throw ApiError.notFound('Group not found');
    }
    
    // Assign students to group
    const result = await pblModel.assignStudentsToGroup(studentIds, groupId);

    return ApiResponse.success(res, 'Students assigned to group successfully', { result });
  });

  /**
   * Get students by group
   */
  getStudentsByGroup = asyncHandler(async (req, res) => {
    const { groupId } = req.params;

    if (!groupId) {
      throw ApiError.badRequest('Group ID is required');
    }

    const groupExists = await pblModel.findGroupById(groupId);
    if (!groupExists) {
      throw ApiError.notFound('Group not found');
    }

    const students = await studentModel.getStudentsByGroup(groupId);

    return ApiResponse.success(res, 'Students retrieved successfully', { students });
  });

  /**
   * Get full student profile by enrollment number (for group member view)
   */
  getStudentProfileByEnrollment = asyncHandler(async (req, res) => {
    const { enrollment_no } = req.params;

    if (!enrollment_no) {
      throw ApiError.badRequest('Enrollment number is required.');
    }

    const profile = await studentModel.getProfileByEnrollment(enrollment_no);

    return ApiResponse.success(res, 'Student profile retrieved successfully.', { profile });
  });

  /**
   * Get group details for a student
   */
  getGroupDetails = asyncHandler(async (req, res) => {
    const { enrollment_no } = req.params;

    if (!enrollment_no) {
      throw ApiError.badRequest('Enrollment number is required.');
    }

    const groupDetails = await studentModel.getGroupDetails(enrollment_no);

    if (!groupDetails) {
      throw ApiError.notFound('Group not found for the provided enrollment number.');
    }

  return ApiResponse.success(res, 'Group details retrieved successfully.', { groupDetails });
  });

  /**
   * Get announcements filtered by class prefix
   */
  getAnnouncements = asyncHandler(async (req, res) => {
    const { classPrefix } = req.params;

    if (!classPrefix) {
      throw ApiError.badRequest('Class prefix is required.');
    }

    const announcements = await studentModel.getAnnouncementsByClassPrefix(classPrefix);

  return ApiResponse.success(res, 'Announcements retrieved successfully.', { announcements });
  });

  /**
   * Get students filtered by class name
   */
  getStudentsByClass = asyncHandler(async (req, res) => {
    const { classname } = req.params;

    if (!classname) {
      throw ApiError.badRequest('Class name is required.');
    }

    const students = await studentModel.getStudentsByClass(classname);

    return ApiResponse.success(res, 'Students retrieved successfully.', { students });
  });

  /**
   * Get students filtered by specialization
   */
  getStudentsBySpecialization = asyncHandler(async (req, res) => {
    const { specialization } = req.params;

    if (!specialization) {
      throw ApiError.badRequest('Specialization is required.');
    }

    const students = await studentModel.getStudentsBySpecialization(specialization);

    return ApiResponse.success(res, 'Students retrieved successfully.', { students });
  });

  /**
   * Check if student is already in a finalized PBL group
   */
  checkGroupMembership = asyncHandler(async (req, res) => {
    const { enrollment_no } = req.params;

    if (!enrollment_no) {
      throw ApiError.badRequest('Enrollment number is required');
    }

    // Check if student exists in pbl table (finalized group)
    const { data: pblGroup, error } = await supabase
      .from('pbl')
      .select('group_id, enrollment_no')
      .eq('enrollment_no', enrollment_no)
      .maybeSingle();

    if (error) {
      console.error('Error checking group membership:', error);
      throw ApiError.internalError('Failed to check group membership');
    }

    const isInGroup = !!pblGroup;
    const group_id = pblGroup?.group_id || null;

    return ApiResponse.success(res, isInGroup ? 'Student is in a group' : 'Student is not in a group', {
      isInGroup,
      group_id,
      enrollment_no
    });
  });
}

export default new StudentController();