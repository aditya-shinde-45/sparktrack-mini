import express from 'express';
import mentorController from '../../controllers/mentor/mentorController.js';
import mentorAuthController from '../../controllers/mentor/mentorAuthController.js';
import zerothReviewController from '../../controllers/mentor/zerothReviewController.js';
import mentorDocumentController from '../../controllers/mentor/mentorDocumentController.js';
import problemStatementReviewController from '../../controllers/mentor/problemStatementReviewController.js';
import authMiddleware from '../../middleware/authMiddleware.js';
import { loginLimiter, passwordResetLimiter } from '../../middleware/rateLimiter.js';

const router = express.Router();

/**
 * @route   POST /api/mentors/check-status
 * @desc    Check if mentor exists and has set password
 * @access  Public
 */
router.post('/check-status', loginLimiter, mentorAuthController.checkMentorStatus);

/**
 * @route   POST /api/mentors/request-otp
 * @desc    Step 1 – Send OTP to mentor's registered email for password setup
 * @access  Public
 */
router.post('/request-otp', passwordResetLimiter, mentorAuthController.requestOtp);

/**
 * @route   POST /api/mentors/verify-otp
 * @desc    Step 2 – Verify OTP; returns verified session_token required by set-password
 * @access  Public
 */
router.post('/verify-otp', loginLimiter, mentorAuthController.verifyOtp);

/**
 * @route   POST /api/mentors/set-password
 * @desc    Step 3 – Set password (requires session_token from verified OTP)
 * @access  Public (OTP-gated)
 */
router.post('/set-password', passwordResetLimiter, mentorAuthController.setMentorPassword);

/**
 * @route   POST /api/mentors/login
 * @desc    Mentor login with phone number and password
 * @access  Public
 */
router.post('/login', loginLimiter, mentorAuthController.mentorLogin);

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

/**
 * @route   GET /api/mentors/documents/:groupId
 * @desc    Get all documents for a specific group
 * @access  Private (Mentor)
 */
router.get(
  '/documents/:groupId',
  authMiddleware.verifyToken,
  mentorDocumentController.getGroupDocuments
);

/**
 * @route   PUT /api/mentors/documents/:id/status
 * @desc    Update document status (approve/reject)
 * @access  Private (Mentor)
 */
router.put(
  '/documents/:id/status',
  authMiddleware.verifyToken,
  mentorDocumentController.updateDocumentStatus
);

/**
 * @route   DELETE /api/mentors/documents/:id
 * @desc    Delete a rejected document
 * @access  Private (Mentor)
 */
router.delete(
  '/documents/:id',
  authMiddleware.verifyToken,
  mentorDocumentController.deleteDocument
);

/**
 * @route   PUT /api/mentors/problem-statement/:group_id/review
 * @desc    Review problem statement (approve/reject)
 * @access  Private (Mentor)
 */
router.put(
  '/problem-statement/:group_id/review',
  authMiddleware.verifyToken,
  problemStatementReviewController.reviewProblemStatement
);

/**
 * @route   GET /api/mentors/problem-statement/:group_id
 * @desc    Get problem statement with review status
 * @access  Private (Mentor)
 */
router.get(
  '/problem-statement/:group_id',
  authMiddleware.verifyToken,
  problemStatementReviewController.getProblemStatementWithReview
);

/**
 * @route   GET /api/mentors/evaluations/:group_id
 * @desc    Get evaluation marks (Review 1 & Review 2) for a specific group
 * @access  Private (Mentor)
 */
router.get(
  '/evaluations/:group_id',
  authMiddleware.verifyToken,
  mentorController.getEvaluationMarksByGroup
);

export default router;