import express from "express";
import {  getStudentsByGroup, saveEvaluation } from "../controller/evalutionController.js";
import { verifyToken } from '../middleware/authmiddleware.js';

const router = express.Router();

// Get students in a group
router.get("/pbl/:groupId", verifyToken ,getStudentsByGroup);
router.post("/save-evaluation", verifyToken, saveEvaluation);

export default router;
