import ApiResponse from '../../utils/apiResponse.js';
import { asyncHandler, ApiError } from '../../utils/errorHandler.js';
import deadlineModel from '../../models/deadlineModel.js';

/**
 * Controller for deadline control operations
 */
class DeadlineController {
  /**
   * Get all deadline controls
   */
  getAllDeadlines = asyncHandler(async (req, res) => {
    const deadlines = await deadlineModel.getAll();
    return ApiResponse.success(res, 'Deadlines retrieved successfully', { deadlines });
  });

  /**
   * Get a deadline control by key
   */
  getDeadlineByKey = asyncHandler(async (req, res) => {
    const { key } = req.params;
    
    if (!key) {
      throw ApiError.badRequest('Deadline key is required.');
    }
    
    const deadline = await deadlineModel.getByKey(key);
    
    return ApiResponse.success(res, 'Deadline retrieved successfully', { deadline });
  });

  /**
   * Update a deadline control
   */
  updateDeadline = asyncHandler(async (req, res) => {
    const { key } = req.params;
    const { enabled } = req.body;
    
    if (!key) {
      throw ApiError.badRequest('Deadline key is required.');
    }
    
    if (enabled === undefined || typeof enabled !== 'boolean') {
      throw ApiError.badRequest('Enabled status must be a boolean value.');
    }
    
    const updated = await deadlineModel.update(key, enabled);
    
    return ApiResponse.success(res, 'Deadline updated successfully', { updated });
  });
}

export default new DeadlineController();