import express from 'express';
import problemStatementController from '../../controllers/students/problemStatementController.js';
import authMiddleware from '../../middleware/authMiddleware.js';

const router = express.Router();

router.post(
  '/student/problem-statement',
  authMiddleware.authenticateUser,
  authMiddleware.restrictTo('student', 'admin', 'mentor'),
  problemStatementController.submitProblemStatement,
);

router.get(
  '/student/problem-statement/:group_id',
  authMiddleware.authenticateUser,
  problemStatementController.getProblemStatement,
);

router.put(
  '/student/problem-statement/:group_id',
  authMiddleware.authenticateUser,
  authMiddleware.restrictTo('student', 'admin', 'mentor'),
  problemStatementController.editProblemStatement,
);

router.delete(
  '/student/problem-statement/:group_id',
  authMiddleware.authenticateUser,
  authMiddleware.restrictTo('student', 'admin'),
  problemStatementController.deleteProblemStatement,
);

export default router;
