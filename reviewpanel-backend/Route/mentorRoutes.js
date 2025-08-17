import express from 'express';
import {
  mentorLogin,
  getMentorGroups,
  saveMentorEvaluation,
  getStudentsByMentorGroup,
  updateMentorPassword
} from '../controller/mentorcontroller.js';
import { verifyToken } from '../middleware/authmiddleware.js';

const router = express.Router();

// Public login route
router.post('/mentor/login', mentorLogin);

// Protected routes
router.get('/mentor/groups', verifyToken, getMentorGroups);
router.post('/mentor/evaluation', verifyToken, saveMentorEvaluation);
router.get('/mentor/students/:groupId', verifyToken, getStudentsByMentorGroup);
router.put('/mentor/update-password', verifyToken, updateMentorPassword);

export default router;
