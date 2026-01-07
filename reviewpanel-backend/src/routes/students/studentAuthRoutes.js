import express from 'express';
import studentAuthController from '../../controllers/students/studentAuthController.js';
import authMiddleware from '../../middleware/authMiddleware.js';

const router = express.Router();

// Authentication routes
router.post('/login', studentAuthController.studentLogin);

router.post('/refresh-token', studentAuthController.refreshAccessToken);

router.post('/logout', authMiddleware.authenticateStudent, studentAuthController.logout);

// Password management routes
router.post('/set-password', studentAuthController.setNewUserPassword);

router.post('/first-time/send-otp', studentAuthController.sendFirstTimeOtp);

router.post('/forgot-password/send-otp', studentAuthController.sendForgotPasswordOtp);

router.post('/forgot-password/reset', studentAuthController.resetPasswordWithOtp);

// Protected routes (require authentication)
router.get('/profile', authMiddleware.authenticateStudent, studentAuthController.getStudentProfile);

router.put('/profile', authMiddleware.authenticateStudent, studentAuthController.updateUserProfile);

router.post('/change-password', authMiddleware.authenticateStudent, studentAuthController.changePassword);

router.put('/update-password', authMiddleware.authenticateStudent, studentAuthController.updateStudentPassword);

export default router;