import express from 'express';
import evaluationFormController from '../../controllers/admin/evaluationFormController.js';
import authMiddleware from '../../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   GET /api/mentors/evaluation-forms
 * @desc    List evaluation forms
 * @access  Private (Mentor)
 */
router.get(
  '/evaluation-forms',
  authMiddleware.verifyToken,
  authMiddleware.authorize(['mentor']),
  evaluationFormController.listForms
);

/**
 * @route   GET /api/mentors/evaluation-forms/:formId
 * @desc    Get evaluation form by ID
 * @access  Private (Mentor)
 */
router.get(
  '/evaluation-forms/:formId',
  authMiddleware.verifyToken,
  authMiddleware.authorize(['mentor']),
  evaluationFormController.getForm
);

/**
 * @route   GET /api/mentors/evaluation-forms/:formId/group/:groupId
 * @desc    Get group details for evaluation form
 * @access  Private (Mentor)
 */
router.get(
  '/evaluation-forms/:formId/group/:groupId',
  authMiddleware.verifyToken,
  authMiddleware.authorize(['mentor']),
  evaluationFormController.getGroupDetails
);

/**
 * @route   GET /api/mentors/evaluation-forms/:formId/group/:groupId/submission
 * @desc    Get latest submission for a form + group
 * @access  Private (Mentor)
 */
router.get(
  '/evaluation-forms/:formId/group/:groupId/submission',
  authMiddleware.verifyToken,
  authMiddleware.authorize(['mentor']),
  evaluationFormController.getSubmissionByGroup
);

/**
 * @route   POST /api/mentors/evaluation-forms/:formId/submit
 * @desc    Submit evaluation for a group
 * @access  Private (Mentor)
 */
router.post(
  '/evaluation-forms/:formId/submit',
  authMiddleware.verifyToken,
  authMiddleware.authorize(['mentor']),
  evaluationFormController.submitEvaluation
);

export default router;
