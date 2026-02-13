import express from 'express';
import industrialMentorController from '../../controllers/mentor/industrialMentorController.js';
import authMiddleware from '../../middleware/authMiddleware.js';

const router = express.Router();

router.get(
  '/industrial-mentor',
  authMiddleware.verifyToken,
  authMiddleware.authorize(['mentor']),
  industrialMentorController.getIndustrialMentor
);

router.post(
  '/industrial-mentor',
  authMiddleware.verifyToken,
  authMiddleware.authorize(['mentor']),
  industrialMentorController.createIndustrialMentor
);

router.put(
  '/industrial-mentor',
  authMiddleware.verifyToken,
  authMiddleware.authorize(['mentor']),
  industrialMentorController.updateIndustrialMentor
);

router.delete(
  '/industrial-mentor',
  authMiddleware.verifyToken,
  authMiddleware.authorize(['mentor']),
  industrialMentorController.deleteIndustrialMentor
);

export default router;
