import express from 'express';
import roleAccessController from '../../controllers/admin/roleaccessController.js';
import authMiddleware from '../../middleware/authMiddleware.js';

const router = express.Router();

/**
 * Role Access Routes - For Sub-Admin table management
 * All routes require authentication and role-based permissions
 */

// GET all records from a specific table
router.get('/:tableName', authMiddleware.authenticateUser, roleAccessController.getAllRecords);

// GET a single record by ID
router.get('/:tableName/:id', authMiddleware.authenticateUser, roleAccessController.getRecordById);

// POST create a new record
router.post('/:tableName', authMiddleware.authenticateUser, roleAccessController.createRecord);

// PUT update an existing record
router.put('/:tableName/:id', authMiddleware.authenticateUser, roleAccessController.updateRecord);

// DELETE a record
router.delete('/:tableName/:id', authMiddleware.authenticateUser, roleAccessController.deleteRecord);

export default router;
