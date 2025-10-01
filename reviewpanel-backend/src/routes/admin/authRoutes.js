import express from 'express';
import authController from '../../controllers/admin/authController.js';
import authMiddleware from '../../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/auth/login
 * @desc    Login user and get token
 * @access  Public
 */
router.post('/login', authController.login);

/**
 * @route   POST /api/auth/validate
 * @desc    Validate token
 * @access  Public
 */
router.post('/validate', authController.validateToken);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', authMiddleware.verifyToken, authController.getCurrentUser);

export default router;