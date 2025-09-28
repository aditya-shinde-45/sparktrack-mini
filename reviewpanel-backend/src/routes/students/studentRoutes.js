import express from 'express';
import studentController from '../../controllers/students/studentController.js';
import authMiddleware from '../../middleware/authMiddleware.js';

const router = express.Router();

router.get('/profile/:enrollment_no',
  authMiddleware.authenticateUser,
  studentController.getStudentProfileByEnrollment
);

router.get('/pbl/gp/:enrollment_no',
  authMiddleware.authenticateUser,
  studentController.getGroupDetails
);

router.get('/admintools/class/:classPrefix',
  authMiddleware.authenticateUser,
  studentController.getAnnouncements
);

router.get('/group/:groupId',
  authMiddleware.authenticateUser,
  authMiddleware.restrictTo('admin', 'mentor'),
  studentController.getStudentsByGroup
);

router.get('/class/:classname', studentController.getStudentsByClass);

router.get('/specialization/:specialization', studentController.getStudentsBySpecialization);

router.get('/', studentController.getAllStudents);

router.get('/:id', 
  authMiddleware.authenticateUser,
  studentController.getStudent
);

router.put('/:id', 
  authMiddleware.authenticateUser,
  studentController.updateStudent
);

router.post('/group', 
  authMiddleware.authenticateAdmin,
  studentController.assignStudentsToGroup
);

export default router;