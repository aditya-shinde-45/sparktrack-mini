import express from "express";
import { saveEvaluation, getStudentsByGroup } from "../controller/evalutionController.js";

const router = express.Router();

// Get students in a group
router.get("/pbl/:groupId", getStudentsByGroup);

export default router;
