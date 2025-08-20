import express from "express";
import {
  getStudentProfile,
  getGroupDetails,
  getAnnouncements,
} from "../../controller/students/studentcontroller.js";
import { authenticateUser } from "../../controller/students/studentlogin.js"; // if you use JWT

const router = express.Router();

router.get("/student/profile", authenticateUser, getStudentProfile);
router.get("/pbl/gp/:enrollment_no", authenticateUser, getGroupDetails);
router.get("/admintools/class/:classPrefix", authenticateUser, getAnnouncements);

export default router;