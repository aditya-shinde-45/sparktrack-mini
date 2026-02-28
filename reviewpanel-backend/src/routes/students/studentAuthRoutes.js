import express from 'express';
import studentAuthController from '../../controllers/students/studentAuthController.js';
import authMiddleware from '../../middleware/authMiddleware.js';
import { loginLimiter, passwordResetLimiter, otpLimiter } from '../../middleware/rateLimiter.js';

const router = express.Router();

// Authentication routes
router.post('/login', loginLimiter, studentAuthController.studentLogin);
router.post('/set-password', passwordResetLimiter, studentAuthController.setPassword);
router.post('/forgot-password/send-otp', otpLimiter, studentAuthController.sendForgotPasswordOTP);
router.post('/forgot-password/reset', passwordResetLimiter, studentAuthController.resetPassword);
router.post('/logout', authMiddleware.authenticateStudent, studentAuthController.logout);

// Protected routes (require authentication)
router.get('/profile', authMiddleware.authenticateStudent, studentAuthController.getStudentProfile);
router.put('/update-password', authMiddleware.authenticateStudent, studentAuthController.updateStudentPassword);

export default router;