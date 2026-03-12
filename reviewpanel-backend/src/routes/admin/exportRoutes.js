import express from 'express';
import exportController from '../../controllers/admin/exportController.js';
import authMiddleware from '../../middleware/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/export
 * Query params: formId, groupPrefix, token (JWT may also come from Bearer header)
 * Downloads a flattened CSV of evaluation form submissions.
 */
router.get('/', authMiddleware.authenticateUser, exportController.exportCSV);

export default router;
