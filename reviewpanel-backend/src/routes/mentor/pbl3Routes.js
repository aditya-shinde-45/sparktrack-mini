import express from 'express';
import pbl3Controller from '../../controllers/mentor/pbl3Controller.js';
import authMiddleware from '../../middleware/authMiddleware.js';
import { deadlineBlocker } from '../../middleware/deadlineMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/pbl3/mentor/login
 * @desc    Mentor login for PBL3
 * @access  Public
 */
router.post('/mentor/login', pbl3Controller.mentorLogin);

/**
 * @route   GET /api/pbl3/mentor/groups
 * @desc    Get groups assigned to logged-in mentor
 * @access  Private (Mentor)
 */
router.get(
  '/mentor/groups',
  authMiddleware.verifyToken,
  pbl3Controller.getMentorGroups
);

/**
 * @route   GET /api/pbl3/previous-externals
 * @desc    Get previously registered external evaluators by this mentor
 * @access  Private (Mentor)
 */
router.get(
  '/previous-externals',
  authMiddleware.verifyToken,
  pbl3Controller.getPreviousExternals
);

// ============================================
// OTP-BASED EXTERNAL REGISTRATION
// ============================================

/**
 * @route   POST /api/pbl3/send-external-otp
 * @desc    Send OTP to external evaluators
 * @access  Private (Mentor)
 */
router.post(
  '/send-external-otp',
  authMiddleware.verifyToken,
  pbl3Controller.sendExternalOTP
);

/**
 * @route   POST /api/pbl3/verify-external-otp
 * @desc    Verify OTP and register external evaluators
 * @access  Private (Mentor)
 */
router.post(
  '/verify-external-otp',
  authMiddleware.verifyToken,
  pbl3Controller.verifyExternalOTP
);

/**
 * @route   POST /api/pbl3/resend-external-otp
 * @desc    Resend OTP to external evaluator
 * @access  Private (Mentor)
 */
router.post(
  '/resend-external-otp',
  authMiddleware.verifyToken,
  pbl3Controller.resendExternalOTP
);

// ============================================
// LEGACY ROUTES
// ============================================

/**
 * @route   POST /api/pbl3/register-externals
 * @desc    Register external evaluators for a group (by mentor) - LEGACY
 * @access  Private (Mentor)
 */
router.post(
  '/register-externals',
  authMiddleware.verifyToken,
  deadlineBlocker('pbl_review_3'),
  pbl3Controller.registerExternals
);

/**
 * @route   POST /api/pbl3/verify-otp
 * @desc    Verify OTP for external evaluator - LEGACY
 * @access  Public
 */
router.post(
  '/verify-otp',
  pbl3Controller.verifyExternalOTP
);

// ============================================
// EVALUATION ROUTES
// ============================================

/**
 * @route   GET /api/pbl3/evaluation/:groupId
 * @desc    Get evaluation data for a group
 * @access  Private (External or Mentor)
 */
router.get(
  '/evaluation/:groupId',
  authMiddleware.verifyToken,
  deadlineBlocker('pbl_review_3'),
  pbl3Controller.getGroupEvaluation
);

/**
 * @route   POST /api/pbl3/evaluation/save
 * @desc    Save evaluation for a group
 * @access  Private (External or Mentor)
 */
router.post(
  '/evaluation/save',
  authMiddleware.verifyToken,
  deadlineBlocker('pbl_review_3'),
  pbl3Controller.saveEvaluation
);

// ============================================
// ADMIN ROUTES
// ============================================

/**
 * @route   GET /api/pbl3/all
 * @desc    Get all PBL3 data with filtering
 * @access  Private (Admin)
 */
router.get(
  '/all',
  authMiddleware.verifyToken,
  authMiddleware.authenticateAdmin,
  pbl3Controller.getAllPbl3Data
);

export default router;
