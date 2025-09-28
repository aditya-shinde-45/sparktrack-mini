import express from 'express';
import dashboardController from '../../controllers/admin/dashboardController.js';
import authMiddleware from '../../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route GET /api/dashboard/stats
 * @desc Get dashboard statistics
 * @access Private (Admin)
 */
router.get('/stats', 
  authMiddleware.verifyToken, 
  authMiddleware.authenticateAdmin,
  dashboardController.getDashboardStats
);

/**
 * @route GET /api/dashboard/activity
 * @desc Get recent activity data
 * @access Private (Admin)
 */
router.get('/activity', 
  authMiddleware.verifyToken,
  authMiddleware.authenticateAdmin,
  dashboardController.getRecentActivity
);

/**
 * @route GET /api/dashboard/projects
 * @desc Get projects overview for dashboard
 * @access Private (Admin)
 */
router.get('/projects', 
  authMiddleware.verifyToken,
  authMiddleware.authenticateAdmin,
  dashboardController.getProjectsOverview
);

/**
 * @route GET /api/dashboard/evaluations
 * @desc Get evaluations summary for dashboard
 * @access Private (Admin)
 */
router.get('/evaluations', 
  authMiddleware.verifyToken,
  authMiddleware.authenticateAdmin,
  dashboardController.getEvaluationsSummary
);

/**
 * @route GET /api/dashboard/data
 * @desc Get comprehensive dashboard data (all charts and counts)
 * @access Private (Admin)
 */
router.get('/data', 
  authMiddleware.verifyToken, 
  authMiddleware.authenticateAdmin,
  dashboardController.getDashboardData
);

/**
 * @route GET /api/dashboard/stat-cards
 * @desc Get stats for the admin dashboard cards
 * @access Private (Admin)
 */
router.get('/stat-cards', 
  authMiddleware.verifyToken, 
  authMiddleware.authenticateAdmin,
  dashboardController.getStatCards
);

export default router;