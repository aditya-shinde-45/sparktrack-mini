// routes/externalRoutes.js
import express from 'express';
import { externalLogin, getAssignedGroups } from '../controller/externalAuthController.js';
import { verifyToken } from '../middleware/authmiddleware.js';


const router = express.Router();

// Public route
router.post('/external/login', externalLogin);

// Protected route
router.get('/external/groups', verifyToken, getAssignedGroups);

export default router;
