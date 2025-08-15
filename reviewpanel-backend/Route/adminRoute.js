import express from 'express';
import { getAllExternals, updateExternal, getPBLData } from '../controller/adminController.js';
import { verifyToken } from '../middleware/authmiddleware.js'; // optional admin check

const router = express.Router();

// Get all externals
router.get('/externals', verifyToken, getAllExternals);
router.get('/pbl', verifyToken ,getPBLData);

// Update external by external_id
router.put('/externals/:external_id', verifyToken, updateExternal);

export default router;
