import ApiResponse from '../../utils/apiResponse.js';
import { asyncHandler, ApiError } from '../../utils/errorHandler.js';
import pblReviewModel from '../../models/pblReviewModel.js';

/**
 * Controller for PBL Evaluation operations
 */
class PblEvaluationController {
  /**
   * Get PBL evaluations for a group based on the review type
   */
  getGroupEvaluations = asyncHandler(async (req, res) => {
    const { groupId, reviewType } = req.params;
    
    if (!groupId) {
      throw ApiError.badRequest('Group ID is required');
    }
    
    // Determine which review to use
    const reviewNumber = reviewType === 'pbl1' ? 1 : 2;
    
    // Check if this review type is currently enabled
    const isEnabled = await pblReviewModel.isReviewEnabled(reviewNumber);
    if (!isEnabled) {
      throw ApiError.forbidden(`PBL Review ${reviewNumber} is currently disabled by admin`);
    }
    
    const evaluations = await pblReviewModel.getGroupEvaluations(groupId, reviewNumber);
    
    return ApiResponse.success(res, 'Group evaluations retrieved successfully', evaluations);
  });

  /**
   * Save evaluation for a group based on the review type
   */
  saveEvaluation = asyncHandler(async (req, res) => {
    const { reviewType } = req.params;
    const evaluation = req.body;
    
    // Validate required fields
    if (!evaluation.group_id || !evaluation.evaluations) {
      throw ApiError.badRequest('Group ID and evaluations are required');
    }
    
    // Determine which review to use
    const reviewNumber = reviewType === 'pbl1' ? 1 : 2;
    
    // Check if this review type is currently enabled
    const isEnabled = await pblReviewModel.isReviewEnabled(reviewNumber);
    if (!isEnabled) {
      throw ApiError.forbidden(`PBL Review ${reviewNumber} is currently disabled by admin`);
    }
    
    // Save evaluation
    const saved = await pblReviewModel.saveEvaluation(evaluation, reviewNumber);
    
    return ApiResponse.success(res, `PBL Review ${reviewNumber} saved successfully`, { saved });
  });
}

export default new PblEvaluationController();