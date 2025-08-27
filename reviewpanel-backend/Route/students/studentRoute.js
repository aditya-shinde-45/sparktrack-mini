import express from "express";
import {
  getStudentProfile,
  updateStudentProfile,
  uploadFiles,
} from "../../controller/students/studentprofilecontroller.js";
import {
  getGroupDetails,
  getAnnouncements,
  getAllStudents,
  getStudentsByClass,
  getStudentsBySpecialization,
  getStudentProfileByEnrollment
} from "../../controller/students/studentcontroller.js";
import { authenticateUser } from "../../controller/students/studentlogin.js"; // if you use JWT

const router = express.Router();

// Profile routes
router.get(
  "/student/profile/:enrollment_no",
  authenticateUser,
  getStudentProfile
);
router.put(
  "/student/profile/:enrollment_no",
  authenticateUser,
  uploadFiles,
  updateStudentProfile
);

// Other routes
router.get("/pbl/gp/:enrollment_no", authenticateUser, getGroupDetails);
router.get(
  "/admintools/class/:classPrefix",
  authenticateUser,
  getAnnouncements
);
router.get('/profile/:enrollment_no', authenticateUser, getStudentProfileByEnrollment);

// New routes
router.get("/students/", getAllStudents);                                    // GET /api/students
router.get("/students/class/:classname", getStudentsByClass);               // GET /api/students/class/TY-CSF-3
router.get("/students/specialization/:specialization", getStudentsBySpecialization); // GET /api/students/specialization/cyber

export default router;