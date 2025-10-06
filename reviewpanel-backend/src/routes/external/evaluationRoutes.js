import express from 'express';
import evaluationController from '../../controllers/externals/evaluationController.js';
import authMiddleware from '../../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route POST /api/evaluation
 * @desc Submit an evaluation for a group (Review 1)
 * @access Private (Admin, Mentor, External Evaluator)
 */
router.post('/', 
  authMiddleware.authenticateUser, 
  authMiddleware.restrictTo('admin', 'mentor', 'external'),
  evaluationController.submitEvaluation
);

/**
 * @route POST /api/evaluation/save-evaluation
 * @desc Submit an evaluation for PBL Review 2
 * @access Private (Admin, Mentor, External Evaluator)
 */
router.post('/save-evaluation', 
  authMiddleware.authenticateUser, 
  authMiddleware.restrictTo('admin', 'mentor', 'external'),
  evaluationController.submitEvaluationReview2
);

/**
 * @route POST /api/evaluation/review2/save-evaluation
 * @desc Submit an evaluation for PBL Review 2 (alternate route)
 * @access Private (Admin, Mentor, External Evaluator)
 */
router.post('/review2/save-evaluation', 
  authMiddleware.authenticateUser, 
  authMiddleware.restrictTo('admin', 'mentor', 'external'),
  evaluationController.submitEvaluationReview2
);

/**
 * @route GET /api/evaluation/group/:group_id
 * @desc Get evaluations for a specific group (Review 1)
 * @access Private (Admin, Mentor, Group Members)
 */
router.get('/group/:group_id', 
  authMiddleware.authenticateUser, 
  evaluationController.getGroupEvaluations
);

/**
 * @route GET /api/evaluation/review2/group/:group_id
 * @desc Get evaluations for a specific group (Review 2)
 * @access Private (Admin, Mentor, Group Members)
 */
router.get('/review2/group/:group_id', 
  authMiddleware.authenticateUser, 
  evaluationController.getGroupEvaluationsReview2
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