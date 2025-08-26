import express from "express";
import {
  getStudentProfile,
  updateStudentProfile,
  uploadFiles,
} from "../../controller/students/studentprofilecontroller.js";
import {
  getGroupDetails,
  getAnnouncements,
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

export default router;