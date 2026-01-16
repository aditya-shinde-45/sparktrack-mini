import express from 'express';
import studentAuthController from '../../controllers/students/studentAuthController.js';
import authMiddleware from '../../middleware/authMiddleware.js';

const router = express.Router();

// Authentication routes
router.post('/login', studentAuthController.studentLogin);
router.post('/set-password', studentAuthController.setPassword);
router.post('/forgot-password/send-otp', studentAuthController.sendForgotPasswordOTP);
router.post('/forgot-password/reset', studentAuthController.resetPassword);
router.post('/logout', authMiddleware.authenticateStudent, studentAuthController.logout);

// Protected routes (require authentication)
router.get('/profile', authMiddleware.authenticateStudent, studentAuthController.getStudentProfile);
router.put('/update-password', authMiddleware.authenticateStudent, studentAuthController.updateStudentPassword);

export default router;