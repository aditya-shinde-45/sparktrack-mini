import express from "express";
import {
  sendAnnouncement,
  getAnnouncements,
  deleteAnnouncement,
  showPBLReview1Marks,
  showPBLReview2Marks,
} from "../../controller/admin/announcement.js";
import { verifyToken } from "../../middleware/authmiddleware.js";
import { deadlineBlocker } from "../../middleware/deadlinecontrol.js";

const router = express.Router();

// Send a new announcement
router.post("/announcement/send", verifyToken, sendAnnouncement);

// Get all announcements
router.get("/announcement", verifyToken, getAnnouncements);

// Delete an announcement by id
router.delete("/announcement/:id", verifyToken, deleteAnnouncement);

// Show PBL Review 1 marks for a single student (protected by deadline control)
// Now expects enrollement_no as query param
router.get(
  "/announcement/review1marks",
  verifyToken,
  deadlineBlocker("show_pbl_review1_marks"),
  showPBLReview1Marks
);

// Show PBL Review 2 marks for a single student (protected by deadline control)
// Now expects enrollement_no as query param
router.get(
  "/announcement/review2marks",
  verifyToken,
  deadlineBlocker("show_pbl_review2_marks"),
  showPBLReview2Marks
);

export default router;