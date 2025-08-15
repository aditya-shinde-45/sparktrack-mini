import express from 'express';
import {
  mentorLogin,
  getMentorGroups,
  saveMentorEvaluation,
  getStudentsByMentorGroup
} from '../controller/mentorcontroller.js';
import { verifyToken } from '../middleware/authmiddleware.js';

const router = express.Router();

// Public login route
router.post('/mentor/login', mentorLogin);

// Protected routes
router.get('/mentor/groups', verifyToken, getMentorGroups);
router.post('/mentor/evaluation', verifyToken, saveMentorEvaluation);
router.get('/mentor/students/:groupId', verifyToken, getStudentsByMentorGroup);

export default router;
