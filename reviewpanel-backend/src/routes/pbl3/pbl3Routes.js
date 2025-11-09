import express from 'express';
import pbl3Controller from '../../controllers/pbl3/pbl3Controller.js';
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

/**
 * @route   POST /api/pbl3/register-externals
 * @desc    Register external evaluators for a group (by mentor)
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
 * @desc    Verify OTP for external evaluator
 * @access  Public
 */
router.post(
  '/verify-otp',
  pbl3Controller.verifyExternalOTP
);

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
