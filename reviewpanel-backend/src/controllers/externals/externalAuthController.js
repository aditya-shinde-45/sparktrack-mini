import ApiResponse from '../../utils/apiResponse.js';
import { asyncHandler, ApiError } from '../../utils/errorHandler.js';
import externalAuthModel from '../../models/externalAuthModel.js';

/**
 * Controller for external evaluator authentication
 */
class ExternalAuthController {
  /**
   * Login an external evaluator and generate token
   */
  externalLogin = asyncHandler(async (req, res) => {
    const { external_id, password } = req.body;

    if (!external_id || !password) {
      throw ApiError.badRequest('External ID and password are required.');
    }

    const external = await externalAuthModel.validateCredentials(external_id, password);
    
    if (!external) {
      throw ApiError.unauthorized('Invalid external ID or password.');
    }
    
    const token = externalAuthModel.generateToken(external);
    
    return ApiResponse.success(res, 'Login successful', { 
      token, 
      user: { 
        external_id: external.external_id, 
        name: external.name, 
        role: 'external' // Ensure consistent lowercase role
      }
    });
  });

  /**
   * Get groups assigned to an external evaluator
   */
  getAssignedGroups = asyncHandler(async (req, res) => {
    const { external_id } = req.user; // From JWT auth middleware
    
    if (!external_id) {
      throw ApiError.badRequest('External ID missing in token.');
    }
    
    const groups = await externalAuthModel.getAssignedGroups(external_id);
    
    return ApiResponse.success(res, 'Groups retrieved successfully', { 
      external_id, 
      groups 
    });
  });

  /**
   * Get groups assigned to a mentor by mentor name
   */
  getGroupsByMentor = asyncHandler(async (req, res) => {
    const { mentor_name } = req.query; // Get mentor_name from query parameters
    
    if (!mentor_name) {
      throw ApiError.badRequest('Mentor name is required.');
    }
    
    const groups = await externalAuthModel.getGroupsByMentorName(mentor_name);
    
    return ApiResponse.success(res, 'Mentor groups retrieved successfully', { 
      mentor_name, 
      groups 
    });
  });

  /**
   * Get all mentors list
   */
  getAllMentors = asyncHandler(async (req, res) => {
    const mentors = await externalAuthModel.getAllMentors();
    
    return ApiResponse.success(res, 'Mentors list retrieved successfully', { 
      mentors 
    });
  });
}

export default new ExternalAuthController();