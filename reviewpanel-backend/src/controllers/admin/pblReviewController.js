import ApiResponse from '../../utils/apiResponse.js';
import { asyncHandler, ApiError } from '../../utils/errorHandler.js';
import pblReviewModel from '../../models/pblReviewModel.js';
import pblModel from '../../models/pblModel.js';

/**
 * Controller for PBL Review operations
 */
class PblReviewController {
  /**
   * Get PBL Review 1 marks for a student
   */
  showPBLReview1Marks = asyncHandler(async (req, res) => {
    const { enrollement_no } = req.query;
    
    if (!enrollement_no) {
      throw ApiError.badRequest('enrollement_no is required.');
    }
    
    const review1Marks = await pblReviewModel.getReview1Marks(enrollement_no);
    
    return ApiResponse.success(res, 'PBL Review 1 marks retrieved successfully', { review1Marks });
  });

  /**
   * Get PBL Review 2 marks for a student
   */
  showPBLReview2Marks = asyncHandler(async (req, res) => {
    const { enrollement_no } = req.query;
    
    if (!enrollement_no) {
      throw ApiError.badRequest('enrollement_no is required.');
    }
    
    const review2Marks = await pblReviewModel.getReview2Marks(enrollement_no);
    
    return ApiResponse.success(res, 'PBL Review 2 marks retrieved successfully', { review2Marks });
  });
  
  /**
   * Update PBL Review 1 marks for a student
   */
  updatePBLReview1Marks = asyncHandler(async (req, res) => {
    const { enrollement_no } = req.params;
    const { total, feedback, A, B, C, D, E } = req.body;
    
    if (!enrollement_no) {
      throw ApiError.badRequest('enrollement_no is required.');
    }
    
    // Build update object with only provided fields
    const updates = {};
    if (total !== undefined) updates.total = total;
    if (feedback !== undefined) updates.feedback = feedback;
    if (A !== undefined) updates.A = A;
    if (B !== undefined) updates.B = B;
    if (C !== undefined) updates.C = C;
    if (D !== undefined) updates.D = D;
    if (E !== undefined) updates.E = E;
    
    const updated = await pblReviewModel.updateReview1Marks(enrollement_no, updates);
    
    return ApiResponse.success(res, 'PBL Review 1 marks updated successfully', { updated });
  });
  
  /**
   * Update PBL Review 2 marks for a student
   */
  updatePBLReview2Marks = asyncHandler(async (req, res) => {
    const { enrollement_no } = req.params;
    const { total, feedback, A, B, C, D, E } = req.body;
    
    if (!enrollement_no) {
      throw ApiError.badRequest('enrollement_no is required.');
    }
    
    // Build update object with only provided fields
    const updates = {};
    if (total !== undefined) updates.total = total;
    if (feedback !== undefined) updates.feedback = feedback;
    if (A !== undefined) updates.A = A;
    if (B !== undefined) updates.B = B;
    if (C !== undefined) updates.C = C;
    if (D !== undefined) updates.D = D;
    if (E !== undefined) updates.E = E;
    
    const updated = await pblReviewModel.updateReview2Marks(enrollement_no, updates);
    
    return ApiResponse.success(res, 'PBL Review 2 marks updated successfully', { updated });
  });

  /**
   * Create a new review
   */
  createReview = asyncHandler(async (req, res) => {
    const { groupId, reviewType, feedback, scores, deadline } = req.body;
    const reviewer = req.user;
    
    if (!groupId || !reviewType || !feedback || !scores) {
      throw ApiError.badRequest('Group ID, review type, feedback and scores are required');
    }
    
    // Check if group exists
    const groupExists = await pblModel.findGroupById(groupId);
    if (!groupExists) {
      throw ApiError.notFound('Group not found');
    }
    
    // Check if reviewer has permission to review this group
    const hasPermission = await pblReviewModel.checkReviewPermission(reviewer, groupId);
    if (!hasPermission) {
      throw ApiError.forbidden('You do not have permission to review this group');
    }
    
    // Create new review
    const newReview = await pblReviewModel.createReview({
      groupId,
      reviewType,
      feedback,
      scores,
      reviewerId: reviewer.id || reviewer.student_id || reviewer.external_id,
      reviewerRole: reviewer.role,
      deadline
    });
    
    return ApiResponse.created(res, 'Review created successfully', { review: newReview });
  });

  /**
   * Get reviews for a group
   */
  getReviewsByGroup = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const user = req.user;
    
    if (!groupId) {
      throw ApiError.badRequest('Group ID is required');
    }
    
    // Check if group exists
    const groupExists = await pblModel.findGroupById(groupId);
    if (!groupExists) {
      throw ApiError.notFound('Group not found');
    }
    
    // Check if user has permission to view this group's reviews
    // Admin and mentors can view any group's reviews
    // Students can only view their group's reviews
    // External evaluators can only view groups they are assigned to
    let hasPermission = ['admin', 'mentor'].includes(user.role);
    if (!hasPermission) {
      if (user.role === 'student') {
        hasPermission = await pblModel.isStudentInGroup(user.student_id, groupId);
      } else if (user.role === 'external') {
        hasPermission = await pblModel.isExternalAssignedToGroup(user.external_id, groupId);
      }
    }
    
    if (!hasPermission) {
      throw ApiError.forbidden('You do not have permission to view this group\'s reviews');
    }
    
    // Get reviews for group
    const reviews = await pblReviewModel.getReviewsByGroup(groupId);
    
    return ApiResponse.success(res, 'Reviews retrieved successfully', { reviews });
  });

  /**
   * Get reviews for a student
   */
  getReviewsByStudent = asyncHandler(async (req, res) => {
    const { studentId } = req.params;
    const user = req.user;
    
    if (!studentId) {
      throw ApiError.badRequest('Student ID is required');
    }
    
    // Check if user has permission to view this student's reviews
    // Admin and mentors can view any student's reviews
    // Students can only view their own reviews
    let hasPermission = ['admin', 'mentor'].includes(user.role);
    if (!hasPermission && user.role === 'student') {
      hasPermission = user.student_id === studentId;
    }
    
    if (!hasPermission) {
      throw ApiError.forbidden('You can only view your own reviews');
    }
    
    // Get reviews for student
    const reviews = await pblReviewModel.getReviewsByStudent(studentId);
    
    return ApiResponse.success(res, 'Reviews retrieved successfully', { reviews });
  });

  /**
   * Update a review
   */
  updateReview = asyncHandler(async (req, res) => {
    const { reviewId } = req.params;
    const { feedback, scores } = req.body;
    const user = req.user;
    
    if (!reviewId) {
      throw ApiError.badRequest('Review ID is required');
    }
    
    // Check if review exists
    const existingReview = await pblReviewModel.findById(reviewId);
    if (!existingReview) {
      throw ApiError.notFound('Review not found');
    }
    
    // Check if user has permission to update this review
    // Admin can update any review
    // Mentors and externals can only update their own reviews
    let hasPermission = user.role === 'admin';
    
    if (!hasPermission) {
      const reviewerId = existingReview.reviewerId.toString();
      const userId = (user.id || user.external_id || '').toString();
      hasPermission = reviewerId === userId;
    }
    
    if (!hasPermission) {
      throw ApiError.forbidden('You do not have permission to update this review');
    }
    
    // Update review
    const updatedReview = await pblReviewModel.updateReview(reviewId, {
      feedback,
      scores
    });
    
    return ApiResponse.success(res, 'Review updated successfully', { review: updatedReview });
  });

  /**
   * Delete a review
   */
  deleteReview = asyncHandler(async (req, res) => {
    const { reviewId } = req.params;
    
    if (!reviewId) {
      throw ApiError.badRequest('Review ID is required');
    }
    
    // Check if review exists
    const existingReview = await pblReviewModel.findById(reviewId);
    if (!existingReview) {
      throw ApiError.notFound('Review not found');
    }
    
    // Delete review (only admins can delete reviews)
    await pblReviewModel.deleteReview(reviewId);
    
    return ApiResponse.success(res, 'Review deleted successfully');
  });

  /**
   * Get summary of reviews for a group
   */
  getReviewSummary = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const user = req.user;
    
    if (!groupId) {
      throw ApiError.badRequest('Group ID is required');
    }
    
    // Check if group exists
    const groupExists = await pblModel.findGroupById(groupId);
    if (!groupExists) {
      throw ApiError.notFound('Group not found');
    }
    
    // Check if user has permission to view this group's reviews
    // Admin and mentors can view any group's summary
    // Students can only view their group's summary
    let hasPermission = ['admin', 'mentor'].includes(user.role);
    if (!hasPermission && user.role === 'student') {
      hasPermission = await pblModel.isStudentInGroup(user.student_id, groupId);
    }
    
    if (!hasPermission) {
      throw ApiError.forbidden('You do not have permission to view this group\'s review summary');
    }
    
    // Get review summary
    const summary = await pblReviewModel.getReviewSummary(groupId);
    
    return ApiResponse.success(res, 'Review summary retrieved successfully', { summary });
  });
}

export default new PblReviewController();