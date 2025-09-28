import express from 'express';
import pblController from '../../controllers/admin/pblController.js';
import authMiddleware from '../../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   GET /api/admin/pbl
 * @desc    Get all PBL data with optional class filter
 * @access  Private (Admin)
 */
router.get(
  '/pbl', 
  authMiddleware.verifyToken, 
  authMiddleware.authenticateAdmin, 
  pblController.getPBLData
);

/**
 * @route   GET /api/admin/pbl/:group_id
 * @desc    Get PBL group by ID
 * @access  Private (Admin)
 */
router.get(
  '/pbl/:group_id', 
  authMiddleware.verifyToken, 
  authMiddleware.authenticateAdmin, 
  pblController.getPBLGroupById
);

/**
 * @route   POST /api/admin/pbl
 * @desc    Add a new PBL group
 * @access  Private (Admin)
 */
router.post(
  '/pbl', 
  authMiddleware.verifyToken, 
  authMiddleware.authenticateAdmin, 
  pblController.addPBLGroup
);

/**
 * @route   PUT /api/admin/pbl/:group_id
 * @desc    Update a PBL group
 * @access  Private (Admin)
 */
router.put(
  '/pbl/:group_id', 
  authMiddleware.verifyToken, 
  authMiddleware.authenticateAdmin, 
  pblController.updatePBLGroup
);

/**
 * @route   DELETE /api/admin/pbl/:group_id
 * @desc    Delete a PBL group
 * @access  Private (Admin)
 */
router.delete(
  '/pbl/:group_id', 
  authMiddleware.verifyToken, 
  authMiddleware.authenticateAdmin, 
  pblController.deletePBLGroup
);

export default router;