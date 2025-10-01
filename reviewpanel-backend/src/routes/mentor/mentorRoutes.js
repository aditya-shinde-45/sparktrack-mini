import express from 'express';
import mentorController from '../../controllers/mentor/mentorController.js';
import authMiddleware from '../../middleware/authMiddleware.js';

const router = express.Router();

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