import express from 'express';
import exportController from '../../controllers/admin/exportController.js';
import authMiddleware from '../../middleware/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/export/project-details
 * Returns project details from problem_statement for admin tools table view.
 */
router.get('/project-details', authMiddleware.authenticateAdmin, exportController.getProjectDetails);

/**
 * GET /api/export/project-details/csv
 * Downloads project details CSV from problem_statement.
 */
router.get('/project-details/csv', authMiddleware.authenticateAdmin, exportController.downloadProjectDetailsCSV);

/**
 * GET /api/export/project-details/group-status
 * Returns two group lists: filled project details and not-filled project details.
 */
router.get('/project-details/group-status', authMiddleware.authenticateAdmin, exportController.getProjectDetailsGroupStatus);

/**
 * GET /api/export
 * Query params: formId, groupPrefix, token (JWT may also come from Bearer header)
 * Downloads a flattened CSV of evaluation form submissions.
 */
router.get('/', authMiddleware.authenticateAdmin, exportController.exportCSV);

export default router;
