import express from 'express';
import evaluationFormController, { uploadEvaluationFileMiddleware } from '../../controllers/admin/evaluationFormController.js';
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
 * @route   POST /api/admin/evaluation-forms/:formId/upload
 * @desc    Upload a file for evaluation fields
 * @access  Private (Admin)
 */
router.post(
  '/evaluation-forms/:formId/upload',
  authMiddleware.verifyToken,
  authMiddleware.authenticateAdmin,
  uploadEvaluationFileMiddleware,
  evaluationFormController.uploadEvaluationFile
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

/**
 * @route   DELETE /api/admin/evaluation-forms/:formId/submissions/:submissionId
 * @desc    Delete/reset a submission (resets entire group's marks)
 * @access  Private (Admin)
 */
router.delete(
  '/evaluation-forms/:formId/submissions/:submissionId',
  authMiddleware.verifyToken,
  authMiddleware.authenticateAdmin,
  evaluationFormController.deleteSubmission
);

/**
 * @route   PUT /api/admin/evaluation-forms/:formId/submissions/:submissionId/students/:enrollmentNo
 * @desc    Update marks for a specific student inside a submission
 * @access  Private (Admin)
 */
router.put(
  '/evaluation-forms/:formId/submissions/:submissionId/students/:enrollmentNo',
  authMiddleware.verifyToken,
  authMiddleware.authenticateAdmin,
  evaluationFormController.updateSubmissionStudentMarks
);

/**
 * @route   PATCH /api/admin/evaluation-forms/:formId/toggle-mentor-edit
 * @desc    Toggle mentor edit permission for a specific group
 * @access  Private (Admin/SubAdmin with evaluation_form_submission permission)
 */
router.patch(
  '/evaluation-forms/:formId/toggle-mentor-edit',
  authMiddleware.verifyToken,
  authMiddleware.authenticateUser,
  evaluationFormController.toggleMentorEditEnabled
);

/**
 * @route   PUT /api/admin/evaluation-forms/:formId/mentor-edit-groups
 * @desc    Set multiple groups that can edit marks (bulk update)
 * @access  Private (Admin/SubAdmin with evaluation_form_submission permission)
 */
router.put(
  '/evaluation-forms/:formId/mentor-edit-groups',
  authMiddleware.verifyToken,
  authMiddleware.authenticateUser,
  evaluationFormController.setMentorEditGroups
);

export default router;
