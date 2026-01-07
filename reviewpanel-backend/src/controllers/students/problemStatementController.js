import ApiResponse from '../../utils/apiResponse.js';
import { asyncHandler, ApiError } from '../../utils/errorHandler.js';
import problemStatementModel from '../../models/problemStatementModel.js';

/**
 * Controller handling problem statement CRUD for student groups
 */
class ProblemStatementController {
  /**
   * Submit a new problem statement for a group
   */
  submitProblemStatement = asyncHandler(async (req, res) => {
    const { group_id, title, type, technologyBucket, domain, description } = req.body;

    if (!group_id || !title) {
      throw ApiError.badRequest('Group ID and title are required.');
    }

    const problemStatement = await problemStatementModel.create({
      group_id,
      title,
      type: type || null,
      technologybucket: technologyBucket || null,
      domain: domain || null,
      description: description || null,
    });

    // Update ps_id in pbl table for all group members
    if (problemStatement && problemStatement.ps_id) {
      await problemStatementModel.updatePsIdInPbl(group_id, problemStatement.ps_id);
    }

    return ApiResponse.success(
      res,
      'Problem statement submitted successfully.',
      { problemStatement },
      201,
    );
  });

  /**
   * Get problem statement for a group
   */
  getProblemStatement = asyncHandler(async (req, res) => {
    const { group_id } = req.params;

    if (!group_id) {
      throw ApiError.badRequest('Group ID is required.');
    }

    const problemStatement = await problemStatementModel.findByGroup(group_id);

    if (!problemStatement) {
      throw ApiError.notFound('Problem statement not found.');
    }

    return ApiResponse.success(res, 'Problem statement retrieved successfully.', { problemStatement });
  });

  /**
   * Edit an existing problem statement
   */
  editProblemStatement = asyncHandler(async (req, res) => {
    const { group_id } = req.params;
    const { title, type, technologyBucket, domain, description } = req.body;

    if (!group_id) {
      throw ApiError.badRequest('Group ID is required.');
    }

    const existing = await problemStatementModel.findByGroup(group_id);
    if (!existing) {
      throw ApiError.notFound('Problem statement not found.');
    }

    const updates = {
      title: title ?? existing.title,
      type: type ?? existing.type,
      technologybucket: technologyBucket ?? existing.technologybucket,
      domain: domain ?? existing.domain,
      description: description ?? existing.description,
    };

    const problemStatement = await problemStatementModel.update(group_id, updates);

    return ApiResponse.success(res, 'Problem statement updated successfully.', { problemStatement });
  });

  /**
   * Delete a problem statement entry for a group
   */
  deleteProblemStatement = asyncHandler(async (req, res) => {
    const { group_id } = req.params;

    if (!group_id) {
      throw ApiError.badRequest('Group ID is required.');
    }

    const existing = await problemStatementModel.findByGroup(group_id);
    if (!existing) {
      throw ApiError.notFound('Problem statement not found.');
    }

    await problemStatementModel.delete(group_id);

    // Clear ps_id in pbl table
    await problemStatementModel.updatePsIdInPbl(group_id, null);

    return ApiResponse.success(res, 'Problem statement deleted successfully.');
  });
}

export default new ProblemStatementController();
