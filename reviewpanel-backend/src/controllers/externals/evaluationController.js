import ApiResponse from '../../utils/apiResponse.js';
import { asyncHandler, ApiError } from '../../utils/errorHandler.js';
import evaluationModel from '../../models/evaluationModel.js';
import pblModel from '../../models/pblModel.js';

/**
 * Controller for handling evaluation operations
 */
class EvaluationController {
  /**
   * Submit evaluation for a PBL group (Review 1)
   */
  submitEvaluation = asyncHandler(async (req, res) => {
    const {
      group_id,
      evaluations,
      feedback,
      crieya,
      patent,
      copyright,
      aic,
      tech_transfer,
      external_name,
    } = req.body;

    if (!group_id || !Array.isArray(evaluations) || !evaluations.length) {
      throw ApiError.badRequest('Group ID and evaluations array are required.');
    }

    const role = req.user?.role;
    if (!['admin', 'mentor', 'external'].includes(role)) {
      throw ApiError.forbidden('You are not authorized to submit evaluations.');
    }

    const groupExists = await pblModel.findGroupById(group_id);
    if (!groupExists) {
      throw ApiError.notFound('Group not found.');
    }

    if (role === 'external') {
      const alreadyEvaluated = await evaluationModel.checkExternalEvaluation(group_id);
      if (alreadyEvaluated) {
        throw ApiError.forbidden('This group has already been evaluated by an external examiner.');
      }
    }

    const updates = await evaluationModel.saveEvaluationBatch(group_id, evaluations, {
      feedback,
      crieya,
      patent,
      copyright,
      aic,
      tech_transfer,
      externalname: external_name,
    });

    return ApiResponse.success(res, 'Evaluations saved successfully.', { updates }, 201);
  });

  /**
   * Submit evaluation for PBL Review 2
   */
  submitEvaluationReview2 = asyncHandler(async (req, res) => {
    const {
      group_id,
      evaluations,
      feedback,
      faculty_guide,
      industry_guide,
      external1_name,
      external2_name,
      organization1_name,
      organization2_name,
    } = req.body;

    if (!group_id || !Array.isArray(evaluations) || !evaluations.length) {
      throw ApiError.badRequest('Group ID and evaluations array are required.');
    }

    const role = req.user?.role;
    if (!['admin', 'mentor', 'external'].includes(role)) {
      throw ApiError.forbidden('You are not authorized to submit evaluations.');
    }

    const groupExists = await pblModel.findGroupById(group_id);
    if (!groupExists) {
      throw ApiError.notFound('Group not found.');
    }

    // Check if external has already evaluated this group for Review 2
    if (role === 'external') {
      const alreadyEvaluated = await evaluationModel.checkExternalEvaluationReview2(group_id);
      if (alreadyEvaluated) {
        throw ApiError.forbidden('This group has already been evaluated by an external examiner for Review 2.');
      }
    }

    const updates = await evaluationModel.saveEvaluationReview2Batch(group_id, evaluations, {
      feedback,
      faculty_guide,
      industry_guide,
      external1_name,
      external2_name,
      organization1_name,
      organization2_name,
    });

    return ApiResponse.success(res, 'PBL Review 2 evaluations saved successfully.', { updates }, 201);
  });

  /**
   * Get evaluations for a specific group (Review 1)
   */
  getGroupEvaluations = asyncHandler(async (req, res) => {
    const { group_id } = req.params;

    if (!group_id) {
      throw ApiError.badRequest('Group ID is required.');
    }

    await this.#ensureViewPermission(req.user, group_id);

    const evaluations = await evaluationModel.getStudentsByGroup(group_id);

    return ApiResponse.success(res, 'Evaluations retrieved successfully.', { evaluations });
  });

  /**
   * Get evaluations for a specific group (Review 2)
   */
  getGroupEvaluationsReview2 = asyncHandler(async (req, res) => {
    const { group_id } = req.params;

    if (!group_id) {
      throw ApiError.badRequest('Group ID is required.');
    }

    await this.#ensureViewPermission(req.user, group_id);

    const evaluations = await evaluationModel.getStudentsByGroupReview2(group_id);

    return ApiResponse.success(res, 'Review 2 evaluations retrieved successfully.', { evaluations });
  });

  /**
   * Get average scores across different evaluation parameters
   */
  getAverageScores = asyncHandler(async (req, res) => {
    const { group_id } = req.params;

    if (!group_id) {
      throw ApiError.badRequest('Group ID is required.');
    }

    await this.#ensureViewPermission(req.user, group_id);

    const averageScores = await evaluationModel.calculateAverageScores(group_id);

    return ApiResponse.success(res, 'Average scores retrieved successfully.', {
      group_id,
      averageScores,
    });
  });

  /**
   * Get all evaluations (admin only)
   */
  getAllEvaluations = asyncHandler(async (req, res) => {
    if (req.user?.role !== 'admin') {
      throw ApiError.forbidden('Only administrators can access all evaluations.');
    }

    const evaluations = await evaluationModel.getAllEvaluationsSummary();

    return ApiResponse.success(res, 'All evaluations retrieved successfully.', { evaluations });
  });

  /**
   * Ensure the requesting user has permission to view group evaluations
   */
  #ensureViewPermission = async (user, groupId) => {
    if (!user?.role) {
      throw ApiError.unauthorized('Authentication required.');
    }

    if (['admin', 'mentor'].includes(user.role)) {
      return true;
    }

    if (user.role === 'student') {
      const inGroup = await pblModel.isStudentInGroup(user.student_id, groupId);
      if (!inGroup) {
        throw ApiError.forbidden('You do not have permission to view this group.');
      }
      return true;
    }

    if (user.role === 'external') {
      // Check if MITADT external - they have access to all groups for selected mentor
      if (user.external_id?.toUpperCase() === 'MITADT') {
        // For MITADT, we allow access to all groups as they select mentor dynamically
        return true;
      }
      
      // For regular externals, check assignment
      const assigned = await pblModel.isExternalAssignedToGroup(user.external_id, groupId);
      if (!assigned) {
        throw ApiError.forbidden('You do not have permission to view this group.');
      }
      return true;
    }

    throw ApiError.forbidden('You do not have permission to view this group.');
  };
}

export default new EvaluationController();