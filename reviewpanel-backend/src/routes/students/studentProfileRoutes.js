import express from 'express';
import studentProfileController, { uploadFiles } from '../../controllers/students/studentProfileController.js';
import authMiddleware from '../../middleware/authMiddleware.js';

const router = express.Router();

router.get(
  '/student/profile/:enrollment_no',
  authMiddleware.authenticateUser,
  studentProfileController.getStudentProfile,
);

router.put(
  '/student/profile/:enrollment_no',
  authMiddleware.authenticateUser,
  uploadFiles,
  studentProfileController.updateStudentProfile,
);

export default router;
