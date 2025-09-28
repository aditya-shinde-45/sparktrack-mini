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

export default router;