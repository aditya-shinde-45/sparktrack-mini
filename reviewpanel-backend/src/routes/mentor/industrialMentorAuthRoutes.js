import express from 'express';
import industrialMentorAuthController from '../../controllers/mentor/industrialMentorAuthController.js';
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

export default router;
