import express from "express";
import {
  uploadFile,
  sendAnnouncement,
  getAnnouncements,
  deleteAnnouncement,
  downloadAnnouncementFile,
  showPBLReview1Marks,
  showPBLReview2Marks,
} from "../../../controller/admin/announcement.js";
import { verifyToken } from "../../../middleware/authmiddleware.js";
import { deadlineBlocker } from "../../../middleware/deadlinecontrol.js";

const router = express.Router();

// ============= ANNOUNCEMENT ROUTES =============

// Send a new announcement with optional file upload
router.post("/announcement/send", verifyToken, uploadFile, sendAnnouncement);

// Get all announcements
router.get("/announcement", verifyToken, getAnnouncements);

// Delete an announcement by id
router.delete("/announcement/:id", verifyToken, deleteAnnouncement);

// Download file from announcement
router.get("/announcement/:id/download", verifyToken, downloadAnnouncementFile);

// ============= PBL MARKS ROUTES =============

// Show PBL Review 1 marks for a single student (protected by deadline control)
// Expects enrollement_no as query param: ?enrollement_no=STUDENT_ID
router.get(
  "/announcement/review1marks",
  verifyToken,
  deadlineBlocker("show_pbl_review1_marks"),
  showPBLReview1Marks
);

// Show PBL Review 2 marks for a single student (protected by deadline control)
// Expects enrollement_no as query param: ?enrollement_no=STUDENT_ID
router.get(
  "/announcement/review2marks",
  verifyToken,
  deadlineBlocker("show_pbl_review2_marks"),
  showPBLReview2Marks
);

export default router;