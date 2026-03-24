import express from 'express';
import {
  createGroup,
  getGroupByEnrollment,
  getPreviousGroup
} from '../../controllers/students/creategroup.js';
import { deadlineBlocker } from '../../middleware/deadlineMiddleware.js';
import authMiddleware from '../../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/groups/create
 * @desc    Create a new group (fetches from pbl_2025, saves to pbl)
 * @access  Private/Student
 * @note    Protected by deadline blocker and authentication
 */
router.post(
  '/create',
  authMiddleware.authenticateStudent,
  deadlineBlocker('group_creation'),
  createGroup
);

/**
 * @route   GET /api/groups/:enrollmentNo
 * @desc    Get group details by enrollment number
 * @access  Private/Student
 */
router.get(
  '/:enrollmentNo',
  authMiddleware.authenticateUser,
  authMiddleware.enforceSelfEnrollment('enrollmentNo'),
  getGroupByEnrollment
);

/**
 * @route   GET /api/groups/previous/:enrollmentNo
 * @desc    Get previous group data from pbl_2025 table
 * @access  Private/Student
 */
router.get(
  '/previous/:enrollmentNo',
  authMiddleware.authenticateUser,
  authMiddleware.enforceSelfEnrollment('enrollmentNo'),
  getPreviousGroup
);

export default router;
