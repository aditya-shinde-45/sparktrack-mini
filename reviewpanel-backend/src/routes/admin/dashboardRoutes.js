import express from 'express';
import dashboardController from '../../controllers/admin/dashboardController.js';
import authMiddleware from '../../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route GET /api/dashboard/stats
 * @desc Get dashboard statistics
 * @access Private (Admin, Mentor)
 */
router.get('/stats', 
  authMiddleware.authenticateUser, 
  authMiddleware.restrictTo('admin', 'mentor'),
  dashboardController.getDashboardStats
);

/**
 * @route GET /api/dashboard/activity
 * @desc Get recent activity data
 * @access Private (Admin, Mentor)
 */
router.get('/activity', 
  authMiddleware.authenticateUser,
  authMiddleware.restrictTo('admin', 'mentor'),
  dashboardController.getRecentActivity
);

/**
 * @route GET /api/dashboard/projects
 * @desc Get projects overview for dashboard
 * @access Private (Admin, Mentor)
 */
router.get('/projects', 
  authMiddleware.authenticateUser,
  authMiddleware.restrictTo('admin', 'mentor'),
  dashboardController.getProjectsOverview
);

/**
 * @route GET /api/dashboard/evaluations
 * @desc Get evaluations summary for dashboard
 * @access Private (Admin, Mentor)
 */
router.get('/evaluations', 
  authMiddleware.authenticateUser,
  authMiddleware.restrictTo('admin', 'mentor'),
  dashboardController.getEvaluationsSummary
);

/**
 * @route GET /api/dashboard/data
 * @desc Get comprehensive dashboard data (all charts and counts)
 * @access Private (Admin, Mentor)
 */
router.get('/data', 
  authMiddleware.authenticateUser, 
  authMiddleware.restrictTo('admin', 'mentor'),
  dashboardController.getDashboardData
);

/**
 * @route GET /api/dashboard/stat-cards
 * @desc Get stats for the admin dashboard cards
 * @access Private (Admin, Mentor)
 */
router.get('/stat-cards', 
  authMiddleware.authenticateUser, 
  authMiddleware.restrictTo('admin', 'mentor'),
  dashboardController.getStatCards
);

export default router;