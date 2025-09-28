import express from 'express';
import adminController from '../../controllers/admin/adminController.js';
import authMiddleware from '../../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route GET /api/admin/dashboard
 * @desc Get admin dashboard data
 * @access Private (Admin only)
 */
router.get('/dashboard', 
  authMiddleware.authenticateAdmin, 
  adminController.getDashboardData
);

/**
 * @route GET /api/admin/users
 * @desc Get all users
 * @access Private (Admin only)
 */
router.get('/users', 
  authMiddleware.authenticateAdmin, 
  adminController.getAllUsers
);

/**
 * @route POST /api/admin/users
 * @desc Create a new user
 * @access Private (Admin only)
 */
router.post('/users', 
  authMiddleware.authenticateAdmin, 
  adminController.createUser
);

/**
 * @route PUT /api/admin/users/:id
 * @desc Update a user
 * @access Private (Admin only)
 */
router.put('/users/:id', 
  authMiddleware.authenticateAdmin, 
  adminController.updateUser
);

/**
 * @route DELETE /api/admin/users/:id
 * @desc Delete a user
 * @access Private (Admin only)
 */
router.delete('/users/:id', 
  authMiddleware.authenticateAdmin, 
  adminController.deleteUser
);

export default router;