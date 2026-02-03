/* LEGACY EVALUATION ROUTES REMOVED
import express from 'express';
import pblEvaluationController from '../../controllers/admin/pblEvaluationController.js';
import authMiddleware from '../../middleware/authMiddleware.js';
import { deadlineBlocker } from '../../middleware/deadlineMiddleware.js';

const router = express.Router();

/**
 * @route   GET /api/evaluation/pbl1/:groupId
 * @desc    Get PBL Review 1 evaluations for a group
 * @access  Private (External)
 */
router.get(
  '/pbl1/:groupId',
  authMiddleware.authenticateExternalOrMentor,
  deadlineBlocker('pbl_review_1'),
  (req, res, next) => {
    req.params.reviewType = 'pbl1';
    next();
  },
  pblEvaluationController.getGroupEvaluations
);

/**
 * @route   GET /api/evaluation/pbl2/:groupId
 * @desc    Get PBL Review 2 evaluations for a group
 * @access  Private (External)
 */
router.get(
  '/pbl2/:groupId',
  authMiddleware.authenticateExternalOrMentor,
  deadlineBlocker('pbl_review_2'),
  (req, res, next) => {
    req.params.reviewType = 'pbl2';
    next();
  },
  pblEvaluationController.getGroupEvaluations
);

/**
 * @route   POST /api/evaluation/pbl1
 * @desc    Save PBL Review 1 evaluation for a group
 * @access  Private (External)
 */
router.post(
  '/pbl1',
  authMiddleware.authenticateExternalOrMentor,
  deadlineBlocker('pbl_review_1'),
  (req, res, next) => {
    req.params.reviewType = 'pbl1';
    next();
  },
  pblEvaluationController.saveEvaluation
);

/**
 * @route   POST /api/evaluation/pbl2
 * @desc    Save PBL Review 2 evaluation for a group
 * @access  Private (External)
 */
router.post(
  '/pbl2',
  authMiddleware.authenticateExternalOrMentor,
  deadlineBlocker('pbl_review_2'),
  (req, res, next) => {
    req.params.reviewType = 'pbl2';
    next();
  },
  pblEvaluationController.saveEvaluation
);

/**
 * @route   GET /api/evaluation/zero-review
 * @desc    Get Zero Review data from internship_details table
 * @access  Private (Admin)
 */
router.get(
  '/zero-review',
  authMiddleware.authenticateAdmin,
  pblEvaluationController.getZeroReviewData
);

/**
 * @route   GET /api/evaluation/zero-review/download
 * @desc    Download Zero Review data as CSV
 * @access  Private (Admin)
 */
router.get(
  '/zero-review/download',
  authMiddleware.authenticateAdmin,
  pblEvaluationController.downloadZeroReviewCSV
);

export default router;
*/

export default {};