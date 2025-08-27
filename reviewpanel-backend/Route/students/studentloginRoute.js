import express from "express";
import {
  studentLogin,
  sendForgotPasswordOtp,
  resetPasswordWithOtp,
  setNewUserPassword,
  authenticateUser,
  getUserProfile,
  updateUserProfile,
  changePassword,
  updateStudentPassword,
  sendFirstTimeOtp,
  getStudentProfile,
} from "../../controller/students/studentlogin.js";

const router = express.Router();

// Student login
router.post("/login", studentLogin);

// First time user: set password
router.post("/set-password", setNewUserPassword);

// First time user: send OTP
router.post("/first-time/send-otp", sendFirstTimeOtp);

// Forgot password: send OTP
router.post("/forgot-password/send-otp", sendForgotPasswordOtp);

// Forgot password: verify OTP and reset password
router.post("/forgot-password/reset", resetPasswordWithOtp);

// Authenticated routes
router.get("/profile", authenticateUser, getStudentProfile);
router.put("/profile", authenticateUser, updateUserProfile);
router.post("/change-password", authenticateUser, changePassword);

// Update student password (for header dropdown functionality)
router.put("/update-password", authenticateUser, updateStudentPassword);

// Get student profile from students table (for header and profile components)
router.get("/student-profile", authenticateUser, getStudentProfile);

export default router;