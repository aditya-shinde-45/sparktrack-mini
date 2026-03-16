import express from 'express';
import industrialMentorAuthController from '../../controllers/mentor/industrialMentorAuthController.js';
import evaluationFormController from '../../controllers/admin/evaluationFormController.js';
import authMiddleware from '../../middleware/authMiddleware.js';
import { loginLimiter } from '../../middleware/rateLimiter.js';

const router = express.Router();

router.post('/login', loginLimiter, industrialMentorAuthController.industrialMentorLogin);

router.get(
  '/groups',
  authMiddleware.verifyToken,
  authMiddleware.authorize(['industry_mentor']),
  industrialMentorAuthController.getIndustrialMentorGroups
);

router.get(
  '/evaluation-forms',
  authMiddleware.verifyToken,
  authMiddleware.authorize(['industry_mentor']),
  evaluationFormController.listForms
);

router.get(
  '/evaluation-forms/:formId',
  authMiddleware.verifyToken,
  authMiddleware.authorize(['industry_mentor']),
  evaluationFormController.getForm
);

router.get(
  '/evaluation-forms/:formId/submissions',
  authMiddleware.verifyToken,
  authMiddleware.authorize(['industry_mentor']),
  evaluationFormController.getFormSubmissions
);

export default router;
