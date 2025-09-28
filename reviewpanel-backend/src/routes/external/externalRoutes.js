import express from 'express';
import externalController from '../../controllers/externals/externalController.js';
import authMiddleware from '../../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   GET /api/external/active-pbl-review
 * @desc    Get active PBL review information
 * @access  Private (External)
 */
router.get(
  '/active-pbl-review',
  authMiddleware.authenticateExternalOrMentor,
  externalController.getActivePBLReview
);

/**
 * @route   GET /api/admin/externals
 * @desc    Get all externals
 * @access  Private (Admin)
 */
router.get(
  '/externals', 
  authMiddleware.authenticateAdmin, 
  externalController.getAllExternals
);

/**
 * @route   POST /api/admin/externals
 * @desc    Add a new external
 * @access  Private (Admin)
 */
router.post(
  '/externals', 
  authMiddleware.authenticateAdmin, 
  externalController.addExternal
);

/**
 * @route   PUT /api/admin/externals/:external_id
 * @desc    Update an external
 * @access  Private (Admin)
 */
router.put(
  '/externals/:external_id', 
  authMiddleware.authenticateAdmin, 
  externalController.updateExternal
);

/**
 * @route   DELETE /api/admin/externals/:external_id
 * @desc    Delete an external
 * @access  Private (Admin)
 */
router.delete(
  '/externals/:external_id', 
  authMiddleware.authenticateAdmin, 
  externalController.deleteExternal
);

export default router;