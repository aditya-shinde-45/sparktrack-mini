import ApiResponse from '../../utils/apiResponse.js';
import { asyncHandler, ApiError } from '../../utils/errorHandler.js';
import problemStatementModel from '../../models/problemStatementModel.js';

/**
 * Controller handling problem statement approval/rejection for mentors
 */
class ProblemStatementReviewController {
  /**
   * Review a problem statement (Approve or Reject)
   * PUT /api/mentors/problem-statement/:group_id/review
   */
  reviewProblemStatement = asyncHandler(async (req, res) => {
    const { group_id } = req.params;
    const { status, feedback } = req.body;

    // Validate group_id
    if (!group_id) {
      throw ApiError.badRequest('Group ID is required.');
    }

    // Validate status
    if (!status || !['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      throw ApiError.badRequest('Invalid status value. Must be: APPROVED, REJECTED, or PENDING');
    }

    // If rejected, feedback is required
    if (status === 'REJECTED' && !feedback) {
      throw ApiError.badRequest('Feedback is required when rejecting a problem statement.');
    }

    // Find existing problem statement
    const existing = await problemStatementModel.findByGroup(group_id);
    if (!existing) {
      throw ApiError.notFound('Problem statement not found for this group.');
    }

    // Prepare updates
    const updates = {
      status: status
    };

    // Store feedback if rejected
    if (status === 'REJECTED' && feedback) {
      updates.review_feedback = feedback;
    } else if (status === 'APPROVED') {
      // Clear any previous feedback on approval
      updates.review_feedback = null;
    }

    // Update the problem statement
    const updated = await problemStatementModel.update(group_id, updates);

    return ApiResponse.success(
      res,
      `Problem statement ${status.toLowerCase()} successfully.`,
      { problemStatement: updated },
      200
    );
  });

  /**
   * Get problem statement with review status
   * GET /api/mentors/problem-statement/:group_id
   */
  getProblemStatementWithReview = asyncHandler(async (req, res) => {
    const { group_id } = req.params;

    if (!group_id) {
      throw ApiError.badRequest('Group ID is required.');
    }

    const problemStatement = await problemStatementModel.findByGroup(group_id);

    if (!problemStatement) {
      throw ApiError.notFound('Problem statement not found for this group.');
    }

    return ApiResponse.success(
      res,
      'Problem statement retrieved successfully.',
      { problemStatement },
      200
    );
  });
}

export default new ProblemStatementReviewController();
