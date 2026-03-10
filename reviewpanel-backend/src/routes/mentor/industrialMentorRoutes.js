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

// Search an existing industry mentor by code or contact (for linking)
router.get(
  '/industrial-mentor/search',
  authMiddleware.verifyToken,
  authMiddleware.authorize(['mentor']),
  industrialMentorController.searchIndustrialMentor
);

router.post(
  '/industrial-mentor',
  authMiddleware.verifyToken,
  authMiddleware.authorize(['mentor']),
  industrialMentorController.createIndustrialMentor
);

// Link an existing industry mentor to this faculty's class
router.post(
  '/industrial-mentor/link',
  authMiddleware.verifyToken,
  authMiddleware.authorize(['mentor']),
  industrialMentorController.linkIndustrialMentor
);

router.put(
  '/industrial-mentor/:industrial_mentor_code',
  authMiddleware.verifyToken,
  authMiddleware.authorize(['mentor']),
  industrialMentorController.updateIndustrialMentor
);

router.delete(
  '/industrial-mentor/:industrial_mentor_code',
  authMiddleware.verifyToken,
  authMiddleware.authorize(['mentor']),
  industrialMentorController.deleteIndustrialMentor
);

export default router;
