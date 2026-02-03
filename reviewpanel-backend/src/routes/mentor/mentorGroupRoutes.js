import express from 'express';
import mentorGroupController from '../../controllers/mentor/mentorGroupController.js';
import authMiddleware from '../../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   GET /api/mentors/groups-by-mentor-code
 * @desc    Get mentor groups from pbl table using mentor_code
 * @access  Private (Mentor)
 */
router.get(
  '/groups-by-mentor-code',
  authMiddleware.verifyToken,
  authMiddleware.authorize(['mentor']),
  mentorGroupController.getGroupsByMentorCode
);

export default router;
