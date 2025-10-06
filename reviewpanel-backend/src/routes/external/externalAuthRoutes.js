import express from 'express';
import externalAuthController from '../../controllers/externals/externalAuthController.js';
import authMiddleware from '../../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route POST /api/external-auth/login
 * @desc Login as an external evaluator
 * @access Public
 */
router.post('/login', externalAuthController.externalLogin);

/**
 * @route GET /api/external-auth/groups
 * @desc Get groups assigned to the external evaluator
 * @access Private (External Evaluator Only)
 */
router.get('/groups', 
  authMiddleware.authenticateExternal, 
  externalAuthController.getAssignedGroups
);

/**
 * @route GET /api/external-auth/mentor-groups
 * @desc Get groups assigned to a mentor by mentor name
 * @access Public (or add auth middleware if needed)
 */
router.get('/mentor-groups', 
  externalAuthController.getGroupsByMentor
);

/**
 * @route GET /api/external-auth/mentors
 * @desc Get all mentors list
 * @access Private (External only)
 */
router.get('/mentors', 
  authMiddleware.authenticateExternal,
  externalAuthController.getAllMentors
);

export default router;