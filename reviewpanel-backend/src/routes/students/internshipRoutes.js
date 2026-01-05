import express from 'express';
import internshipController, { uploadInternshipDocument } from '../../controllers/students/internshipController.js';
import authMiddleware from '../../middleware/authMiddleware.js';

const router = express.Router();

// Student routes (authenticated student)
router.post('/',
  authMiddleware.authenticateUser,
  uploadInternshipDocument,
  internshipController.submitInternship
);

router.get('/my-internship',
  authMiddleware.authenticateUser,
  internshipController.getMyInternship
);

router.put('/',
  authMiddleware.authenticateUser,
  uploadInternshipDocument,
  internshipController.updateInternship
);

router.delete('/',
  authMiddleware.authenticateUser,
  internshipController.deleteInternship
);

// Admin/Mentor routes
router.get('/all',
  authMiddleware.authenticateUser,
  authMiddleware.restrictTo('admin', 'mentor'),
  internshipController.getAllInternships
);

router.get('/enrollment/:enrollment_no',
  authMiddleware.authenticateUser,
  internshipController.getInternshipByEnrollment
);

router.get('/group/:group_id',
  authMiddleware.authenticateUser,
  authMiddleware.restrictTo('admin', 'mentor'),
  internshipController.getInternshipsByGroup
);

router.get('/download/:enrollment_no',
  authMiddleware.authenticateUser,
  internshipController.downloadInternshipDocument
);

export default router;
