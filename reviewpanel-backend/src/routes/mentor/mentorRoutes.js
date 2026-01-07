import express from 'express';
import mentorController from '../../controllers/mentor/mentorController.js';
import pbl3Controller from '../../controllers/mentor/pbl3Controller.js';
import authMiddleware from '../../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/mentors/check-status
 * @desc    Check if mentor exists and has set password
 * @access  Public
 */
router.post('/check-status', pbl3Controller.checkMentorStatus);

/**
 * @route   POST /api/mentors/set-password
 * @desc    Set password for first-time mentor login
 * @access  Public
 */
router.post('/set-password', pbl3Controller.setMentorPassword);

/**
 * @route   POST /api/mentors/login
 * @desc    Mentor login with phone number and password
 * @access  Public
 */
router.post('/login', pbl3Controller.mentorLogin);

/**
 * @route   GET /api/mentors/groups
 * @desc    Get groups assigned to logged-in mentor
 * @access  Private (Mentor)
 */
router.get(
  '/groups',
  authMiddleware.verifyToken,
  pbl3Controller.getMentorGroups
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