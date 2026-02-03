import express from 'express';
import mentorController from '../../controllers/mentor/mentorController.js';
import mentorAuthController from '../../controllers/mentor/mentorAuthController.js';
import zerothReviewController from '../../controllers/mentor/zerothReviewController.js';
import authMiddleware from '../../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/mentors/check-status
 * @desc    Check if mentor exists and has set password
 * @access  Public
 */
router.post('/check-status', mentorAuthController.checkMentorStatus);

/**
 * @route   POST /api/mentors/set-password
 * @desc    Set password for first-time mentor login
 * @access  Public
 */
router.post('/set-password', mentorAuthController.setMentorPassword);

/**
 * @route   POST /api/mentors/login
 * @desc    Mentor login with phone number and password
 * @access  Public
 */
router.post('/login', mentorAuthController.mentorLogin);

/**
 * @route   GET /api/mentors/groups
 * @desc    Get groups assigned to logged-in mentor
 * @access  Private (Mentor)
 */
router.get(
  '/groups',
  authMiddleware.verifyToken,
  mentorAuthController.getMentorGroups
);

// Zeroth Review Routes
/**
 * @route   POST /api/mentors/zeroth-review/submit
 * @desc    Submit Zeroth Review evaluation
 * @access  Private (Mentor)
 */
router.post(
  '/zeroth-review/submit',
  authMiddleware.verifyToken,
  zerothReviewController.submitZerothReview
);

/**
 * @route   GET /api/mentors/zeroth-review/:group_id
 * @desc    Get Zeroth Review data for a specific group
 * @access  Private (Mentor)
 */
router.get(
  '/zeroth-review/:group_id',
  authMiddleware.verifyToken,
  zerothReviewController.getZerothReviewByGroup
);

/**
 * @route   GET /api/mentors/zeroth-review
 * @desc    Get all Zeroth Reviews
 * @access  Private (Mentor/Admin)
 */
router.get(
  '/zeroth-review',
  authMiddleware.verifyToken,
  zerothReviewController.getAllZerothReviews
);

/**
 * @route   PUT /api/mentors/zeroth-review/:group_id/:enrollment_no
 * @desc    Update Zeroth Review
 * @access  Private (Mentor)
 */
router.put(
  '/zeroth-review/:group_id/:enrollment_no',
  authMiddleware.verifyToken,
  zerothReviewController.updateZerothReview
);

/**
 * @route   DELETE /api/mentors/zeroth-review/:group_id
 * @desc    Delete Zeroth Review for a group
 * @access  Private (Mentor/Admin)
 */
router.delete(
  '/zeroth-review/:group_id',
  authMiddleware.verifyToken,
  zerothReviewController.deleteZerothReview
);

/**
 * @route   POST /api/mentors/zeroth-review/add-member
 * @desc    Add missing member from PBL 2025 table to internship details
 * @access  Private (Mentor)
 */
router.post(
  '/zeroth-review/add-member',
  authMiddleware.verifyToken,
  zerothReviewController.addMissingMember
);

/**
 * @route   POST /api/mentors/zeroth-review/verify-member
 * @desc    Verify if student exists in PBL 2025 table with same group
 * @access  Private (Mentor)
 */
router.post(
  '/zeroth-review/verify-member',
  authMiddleware.verifyToken,
  zerothReviewController.verifyMissingMember
);

/**
 * @route   GET /api/admin/mentors
 * @desc    Get all mentors with their assigned groups
 * @access  Private (Admin)
 */
router.get(
  '/mentors', 
  authMiddleware.verifyToken, 
  authMiddleware.authenticateAdmin, 
  mentorController.getAllMentors
);

/**
 * @route   POST /api/admin/mentors
 * @desc    Add a new mentor
 * @access  Private (Admin)
 */
router.post(
  '/mentors', 
  authMiddleware.verifyToken, 
  authMiddleware.authenticateAdmin, 
  mentorController.addMentor
);

/**
 * @route   PUT /api/admin/mentors/:mentor_name
 * @desc    Update mentor information
 * @access  Private (Admin)
 */
router.put(
  '/mentors/:mentor_name', 
  authMiddleware.verifyToken, 
  authMiddleware.authenticateAdmin, 
  mentorController.updateMentor
);

/**
 * @route   DELETE /api/admin/mentors/:mentor_name
 * @desc    Delete a mentor
 * @access  Private (Admin)
 */
router.delete(
  '/mentors/:mentor_name', 
  authMiddleware.verifyToken, 
  authMiddleware.authenticateAdmin, 
  mentorController.deleteMentor
);

export default router;