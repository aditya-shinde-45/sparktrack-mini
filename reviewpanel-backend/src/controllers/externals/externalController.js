import ApiResponse from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/errorHandler.js';
import externalModel from '../../models/externalModel.js';
import deadlineModel from '../../models/deadlineModel.js';
import { ApiError } from '../../utils/errorHandler.js';

/**
 * Controller for external evaluator operations
 */
class ExternalController {
  /**
   * Get active PBL review information
   */
  getActivePBLReview = asyncHandler(async (req, res) => {
    // Check if PBL Review 2 is enabled
    const review2 = await deadlineModel.getByKey('pbl_review_2');
    
    if (review2 && review2.enabled) {
      return ApiResponse.success(res, 'Active PBL review retrieved', { 
        activeReview: 2, 
        label: 'PBL Review 2'
      });
    }
    
    // Check if PBL Review 1 is enabled
    const review1 = await deadlineModel.getByKey('pbl_review_1');
    
    if (review1 && review1.enabled) {
      return ApiResponse.success(res, 'Active PBL review retrieved', { 
        activeReview: 1, 
        label: 'PBL Review 1'
      });
    }
    
    // If neither is enabled
    return ApiResponse.success(res, 'No active PBL review', { 
      activeReview: null,
      label: 'No Active PBL Review'
    });
  });
  /**
   * Get all external evaluators
   */
  getAllExternals = asyncHandler(async (req, res) => {
    const externals = await externalModel.getAll();
    return ApiResponse.success(res, 'Externals retrieved successfully', { externals });
  });

  /**
   * Add a new external evaluator
   */
  addExternal = asyncHandler(async (req, res) => {
    const { external_id, password, name } = req.body;

    // Validate required fields
    if (!external_id || !password || !name) {
      throw ApiError.badRequest('External ID, password, and name are required.');
    }

    // Check for duplicate external ID
    const exists = await externalModel.exists(external_id);
    if (exists) {
      throw ApiError.badRequest('External ID already exists.');
    }

    // Create external
    const added = await externalModel.create({ external_id, password, name });
    
    return ApiResponse.success(
      res, 
      'External added successfully',
      { added },
      201
    );
  });

  /**
   * Update an existing external evaluator
   */
  updateExternal = asyncHandler(async (req, res) => {
    const { external_id } = req.params;
    const { password, name } = req.body;

    if (!external_id) {
      throw ApiError.badRequest('External ID is required.');
    }

    // Create update object with only provided fields
    const updateData = {};
    if (password) updateData.password = password;
    if (name) updateData.name = name;

    if (Object.keys(updateData).length === 0) {
      throw ApiError.badRequest('Nothing to update.');
    }

    const updated = await externalModel.update(external_id, updateData);
    
    return ApiResponse.success(res, 'External updated successfully', { updated });
  });

  /**
   * Delete an external evaluator
   */
  deleteExternal = asyncHandler(async (req, res) => {
    const { external_id } = req.params;

    if (!external_id) {
      throw ApiError.badRequest('External ID is required.');
    }

    await externalModel.delete(external_id);
    
    return ApiResponse.success(res, 'External deleted successfully');
  });
}

export default new ExternalController();