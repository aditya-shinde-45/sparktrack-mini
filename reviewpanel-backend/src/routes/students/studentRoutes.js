import express from 'express';
import studentController from '../../controllers/students/studentController.js';
import authMiddleware from '../../middleware/authMiddleware.js';

const router = express.Router();

router.get('/profile/:enrollment_no',
  authMiddleware.authenticateUser,
  authMiddleware.enforceSelfEnrollment('enrollment_no'),
  studentController.getStudentProfileByEnrollment
);

router.get('/pbl/gp/:enrollment_no',
  authMiddleware.authenticateUser,
  authMiddleware.enforceSelfEnrollment('enrollment_no'),
  studentController.getGroupDetails
);

// Check if student is in a finalized group
router.get('/check-membership/:enrollment_no',
  authMiddleware.authenticateUser,
  authMiddleware.enforceSelfEnrollment('enrollment_no'),
  studentController.checkGroupMembership
);

router.get('/admintools/class/:classPrefix',
  authMiddleware.authenticateUser,
  authMiddleware.restrictTo('admin', 'mentor', 'industry_mentor'),
  studentController.getAnnouncements
);

router.get('/group/:groupId',
  authMiddleware.authenticateUser,
  authMiddleware.restrictTo('admin', 'mentor', 'industry_mentor'),
  studentController.getStudentsByGroup
);

router.get('/class/:classname', studentController.getStudentsByClass);

router.get('/specialization/:specialization', studentController.getStudentsBySpecialization);

router.get('/', studentController.getAllStudents);

router.get('/:id', 
  authMiddleware.authenticateUser,
  authMiddleware.enforceSelfEnrollment('id'),
  studentController.getStudent
);

router.put('/:id', 
  authMiddleware.authenticateUser,
  authMiddleware.enforceSelfEnrollment('id'),
  studentController.updateStudent
);

router.post('/group', 
  authMiddleware.authenticateAdmin,
  studentController.assignStudentsToGroup
);

export default router;