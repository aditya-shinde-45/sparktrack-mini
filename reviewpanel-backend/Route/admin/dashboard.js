import express from "express";
import { getDashboardData, getStatCards } from '../../controller/admin/dashboard.js';
import { verifyToken } from "../../middleware/authmiddleware.js";

const router = express.Router();


router.get('/admin/dashboard', verifyToken, getDashboardData);
router.get('/admin/stats', verifyToken, getStatCards);


export default router;