import express from 'express';
import {
  createGroup,
  getGroupByEnrollment,
  getPreviousGroup
} from '../../controllers/students/creategroup.js';
import { deadlineBlocker } from '../../middleware/deadlineMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/groups/create
 * @desc    Create a new group (fetches from pbl_2025, saves to pbl)
 * @access  Private/Student
 * @note    Protected by deadline blocker - only accessible when group_creation is enabled
 */
router.post('/create', deadlineBlocker('group_creation'), createGroup);

/**
 * @route   GET /api/groups/:enrollmentNo
 * @desc    Get group details by enrollment number
 * @access  Private/Student
 * @note    Always accessible - students need to view their group info
 */
router.get('/:enrollmentNo', getGroupByEnrollment);

/**
 * @route   GET /api/groups/previous/:enrollmentNo
 * @desc    Get previous group data from pbl_2025 table
 * @access  Private/Student
 * @note    Always accessible - needed for internship submissions
 */
router.get('/previous/:enrollmentNo', getPreviousGroup);

export default router;
