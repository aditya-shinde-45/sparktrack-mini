import express from 'express';
import { createAssignedExternal } from '../../controller/admin/assignexternalsContoller.js';
import { verifyToken } from '../../middleware/authmiddleware.js';

const router = express.Router();

// Protect this route with JWT
router.post('/assign-external', verifyToken, createAssignedExternal);

export default router;
