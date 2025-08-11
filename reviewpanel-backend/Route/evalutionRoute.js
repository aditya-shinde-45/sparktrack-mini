import express from "express";
import { saveEvaluation, getStudentsByGroup } from "../controller/evalutionController.js";

const router = express.Router();

// Save evaluation
router.post("/save-evaluation", saveEvaluation);

// Get students in a group
router.get("/pbl/:groupId", getStudentsByGroup);

export default router;
