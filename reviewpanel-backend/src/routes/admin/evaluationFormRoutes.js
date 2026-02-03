import express from 'express';
import evaluationFormController from '../../controllers/admin/evaluationFormController.js';
import authMiddleware from '../../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   GET /api/admin/evaluation-forms
 * @desc    List evaluation forms
 * @access  Private (Admin)
 */
router.get(
  '/evaluation-forms',
  authMiddleware.verifyToken,
  authMiddleware.authenticateAdmin,
  evaluationFormController.listForms
);

/**
 * @route   GET /api/admin/evaluation-forms/:formId
 * @desc    Get evaluation form by ID
 * @access  Private (Admin)
 */
router.get(
  '/evaluation-forms/:formId',
  authMiddleware.verifyToken,
  authMiddleware.authenticateAdmin,
  evaluationFormController.getForm
);

/**
 * @route   POST /api/admin/evaluation-forms
 * @desc    Create a new evaluation form
 * @access  Private (Admin)
 */
router.post(
  '/evaluation-forms',
  authMiddleware.verifyToken,
  authMiddleware.authenticateAdmin,
  evaluationFormController.createForm
);

/**
 * @route   PUT /api/admin/evaluation-forms/:formId
 * @desc    Update an evaluation form
 * @access  Private (Admin)
 */
router.put(
  '/evaluation-forms/:formId',
  authMiddleware.verifyToken,
  authMiddleware.authenticateAdmin,
  evaluationFormController.updateForm
);

/**
 * @route   GET /api/admin/evaluation-forms/:formId/group/:groupId
 * @desc    Get group details for evaluation form
 * @access  Private (Admin)
 */
router.get(
  '/evaluation-forms/:formId/group/:groupId',
  authMiddleware.verifyToken,
  authMiddleware.authenticateAdmin,
  evaluationFormController.getGroupDetails
);

/**
 * @route   POST /api/admin/evaluation-forms/:formId/submit
 * @desc    Submit evaluation for a group
 * @access  Private (Admin)
 */
router.post(
  '/evaluation-forms/:formId/submit',
  authMiddleware.verifyToken,
  authMiddleware.authenticateAdmin,
  evaluationFormController.submitEvaluation
);

/**
 * @route   GET /api/admin/evaluation-forms/:formId/submissions
 * @desc    List submissions for an evaluation form
 * @access  Private (Admin)
 */
router.get(
  '/evaluation-forms/:formId/submissions',
  authMiddleware.verifyToken,
  authMiddleware.authenticateAdmin,
  evaluationFormController.getFormSubmissions
);

export default router;
