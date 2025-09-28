import express from 'express';
import evaluationController from '../../controllers/externals/evaluationController.js';
import authMiddleware from '../../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route POST /api/evaluation
 * @desc Submit an evaluation for a group
 * @access Private (Admin, Mentor, External Evaluator)
 */
router.post('/', 
  authMiddleware.authenticateUser, 
  authMiddleware.restrictTo('admin', 'mentor', 'external'),
  evaluationController.submitEvaluation
);

/**
 * @route GET /api/evaluation/group/:group_id
 * @desc Get evaluations for a specific group
 * @access Private (Admin, Mentor, Group Members)
 */
router.get('/group/:group_id', 
  authMiddleware.authenticateUser, 
  evaluationController.getGroupEvaluations
);

/**
 * @route GET /api/evaluation/scores/:group_id
 * @desc Get average scores for a group
 * @access Private (Admin, Mentor, Group Members)
 */
router.get('/scores/:group_id', 
  authMiddleware.authenticateUser, 
  evaluationController.getAverageScores
);

/**
 * @route GET /api/evaluation/all
 * @desc Get all evaluations (admin only)
 * @access Private (Admin Only)
 */
router.get('/all', 
  authMiddleware.authenticateUser, 
  authMiddleware.restrictTo('admin'),
  evaluationController.getAllEvaluations
);

export default router;