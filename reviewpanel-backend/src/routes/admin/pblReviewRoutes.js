import express from 'express';
import pblReviewController from '../../controllers/admin/pblReviewController.js';
import authMiddleware from '../../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route POST /api/reviews
 * @desc Create a new review
 * @access Private (Admin, Mentor, External)
 */
router.post('/', 
  authMiddleware.authenticateUser,
  authMiddleware.restrictTo('admin', 'mentor', 'external'),
  pblReviewController.createReview
);

/**
 * @route GET /api/reviews/:groupId
 * @desc Get reviews for a group
 * @access Private (Admin, Mentor, Student in group, External assigned to group)
 */
router.get('/:groupId', 
  authMiddleware.authenticateUser,
  pblReviewController.getReviewsByGroup
);

/**
 * @route GET /api/reviews/student/:studentId
 * @desc Get reviews for a student
 * @access Private (Admin, Mentor, Student themselves)
 */
router.get('/student/:studentId', 
  authMiddleware.authenticateUser,
  pblReviewController.getReviewsByStudent
);

/**
 * @route PUT /api/reviews/:reviewId
 * @desc Update a review
 * @access Private (Admin, Mentor, External who created it)
 */
router.put('/:reviewId', 
  authMiddleware.authenticateUser,
  pblReviewController.updateReview
);

/**
 * @route DELETE /api/reviews/:reviewId
 * @desc Delete a review
 * @access Private (Admin only)
 */
router.delete('/:reviewId', 
  authMiddleware.authenticateAdmin,
  pblReviewController.deleteReview
);

/**
 * @route GET /api/reviews/summary/:groupId
 * @desc Get summary of reviews for a group
 * @access Private (Admin, Mentor, Student in group)
 */
router.get('/summary/:groupId', 
  authMiddleware.authenticateUser,
  pblReviewController.getReviewSummary
);

export default router;