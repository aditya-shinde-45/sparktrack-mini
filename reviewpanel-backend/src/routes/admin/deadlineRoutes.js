import express from 'express';
import deadlineController from '../../controllers/admin/deadlineController.js';
import authMiddleware from '../../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   GET /api/deadlines
 * @desc    Get all deadline controls
 * @access  Private (Admin)
 */
router.get(
  '/', 
  authMiddleware.verifyToken, 
  authMiddleware.authenticateAdmin, 
  deadlineController.getAllDeadlines
);

/**
 * @route   GET /api/deadlines/:key
 * @desc    Get a deadline control by key
 * @access  Private (Admin)
 */
router.get(
  '/:key', 
  authMiddleware.verifyToken, 
  authMiddleware.authenticateAdmin, 
  deadlineController.getDeadlineByKey
);

/**
 * @route   PUT /api/deadlines/:key
 * @desc    Update a deadline control
 * @access  Private (Admin)
 */
router.put(
  '/:key', 
  authMiddleware.verifyToken, 
  authMiddleware.authenticateAdmin, 
  deadlineController.updateDeadline
);

export default router;