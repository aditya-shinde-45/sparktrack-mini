import { asyncHandler, ApiError } from '../../utils/errorHandler.js';
import ApiResponse from '../../utils/apiResponse.js';
import userModel from '../../models/userModel.js';
import studentAuthModel from '../../models/studentAuthModel.js';
import pblModel from '../../models/pblModel.js';

/**
 * Controller for admin operations
 */
class AdminController {
  /**
   * Get dashboard data for admin
   */
  getDashboardData = asyncHandler(async (req, res) => {
    // Get counts of users by role
    const userCounts = await userModel.getUserCountsByRole();
    
    // Get count of students
    const studentCount = await studentAuthModel.getStudentCount();
    
    // Get count of groups
    const groupCount = await pblModel.getGroupCount();
    
    // Get count of active projects
    const activeProjectsCount = await pblModel.getActiveProjectsCount();
    
    // Get recent activities
    const recentActivities = await userModel.getRecentActivities();
    
    return ApiResponse.success(res, 'Dashboard data retrieved successfully', {
      userCounts,
      studentCount,
      groupCount,
      activeProjectsCount,
      recentActivities
    });
  });

  /**
   * Get all users (admin and mentors)
   */
  getAllUsers = asyncHandler(async (req, res) => {
    const users = await userModel.getAllUsers();
    
    return ApiResponse.success(res, 'Users retrieved successfully', { users });
  });

  /**
   * Create a new user (admin or mentor)
   */
  createUser = asyncHandler(async (req, res) => {
    const { username, email, password, role, name } = req.body;
    
    if (!username || !email || !password || !role || !name) {
      throw ApiError.badRequest('Missing required fields');
    }
    
    // Check if role is valid
    if (!['admin', 'mentor'].includes(role)) {
      throw ApiError.badRequest('Invalid role');
    }
    
    // Check if user with email already exists
    const existingUser = await userModel.findByEmail(email);
    if (existingUser) {
      throw ApiError.conflict('User with this email already exists');
    }
    
    // Create new user
    const newUser = await userModel.createUser({
      username,
      email,
      password,
      role,
      name
    });
    
    // Remove password from response
    delete newUser.password;
    
    return ApiResponse.created(res, 'User created successfully', { user: newUser });
  });

  /**
   * Update a user
   */
  updateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { username, email, role, name, active } = req.body;
    
    if (!id) {
      throw ApiError.badRequest('User ID is required');
    }
    
    // Check if user exists
    const existingUser = await userModel.findById(id);
    if (!existingUser) {
      throw ApiError.notFound('User not found');
    }
    
    // Update user
    const updatedUser = await userModel.updateUser(id, {
      username,
      email,
      role,
      name,
      active
    });
    
    // Remove password from response
    delete updatedUser.password;
    
    return ApiResponse.success(res, 'User updated successfully', { user: updatedUser });
  });

  /**
   * Delete a user
   */
  deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    if (!id) {
      throw ApiError.badRequest('User ID is required');
    }
    
    // Check if user exists
    const existingUser = await userModel.findById(id);
    if (!existingUser) {
      throw ApiError.notFound('User not found');
    }
    
    // Delete user
    await userModel.deleteUser(id);
    
    return ApiResponse.success(res, 'User deleted successfully');
  });
}

export default new AdminController();