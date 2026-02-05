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

    const existing = await problemStatementModel.findByGroup(group_id);

    const payload = {
      group_id,
      title,
      type: type || null,
      technologybucket: technologyBucket || null,
      domain: domain || null,
      description: description || null,
    };

    let problemStatement;
    let statusCode = 201;
    let message = 'Problem statement submitted successfully.';

    if (existing) {
      const updates = {
        title: payload.title,
        type: payload.type,
        technologybucket: payload.technologybucket,
        domain: payload.domain,
        description: payload.description,
      };
      problemStatement = await problemStatementModel.update(group_id, updates);
      statusCode = 200;
      message = 'Problem statement updated successfully.';
    } else {
      problemStatement = await problemStatementModel.create(payload);
    }

    // Update ps_id in pbl table for all group members
    if (problemStatement && problemStatement.ps_id) {
      await problemStatementModel.updatePsIdInPbl(group_id, problemStatement.ps_id);
    }

    return ApiResponse.success(
      res,
      message,
      { problemStatement },
      statusCode,
    );
  });

  /**
   * Get problem statement for a group or by ps_id
   */
  getProblemStatement = asyncHandler(async (req, res) => {
    const { group_id } = req.params;
    const { ps_id } = req.query;

    if (!group_id && !ps_id) {
      throw ApiError.badRequest('Group ID or PS ID is required.');
    }

    let problemStatement;
    
    if (ps_id) {
      problemStatement = await problemStatementModel.findByPsId(ps_id);
    } else {
      problemStatement = await problemStatementModel.findByGroup(group_id);
    }

    return ApiResponse.success(res, 'Problem statement retrieved successfully.', { problemStatement: problemStatement || null });
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
