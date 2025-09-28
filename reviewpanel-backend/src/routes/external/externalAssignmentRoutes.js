import express from 'express';
import externalAssignmentController from '../../controllers/externals/externalAssignmentController.js';
import authMiddleware from '../../middleware/authMiddleware.js';

const router = express.Router();

router.post(
  '/assign-external',
  authMiddleware.authenticateAdmin,
  externalAssignmentController.assignExternal,
);

export default router;
