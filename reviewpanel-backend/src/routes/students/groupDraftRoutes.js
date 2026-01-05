import express from "express";
import {
  createDraft,
  getLeaderDrafts,
  sendInvitations,
  getStudentInvitations,
  respondToInvitation,
  getGroupDetails,
  confirmGroup,
  cancelDraft,
} from "../../controllers/students/groupDraftController.js";

const router = express.Router();

// Create draft group (Step 1)
router.post("/draft", createDraft);

// Get leader's draft groups
router.get("/draft/leader/:enrollmentNo", getLeaderDrafts);

// Send invitations to members (Step 2)
router.post("/invite", sendInvitations);

// Get invitations for a student
router.get("/invitations/:enrollmentNo", getStudentInvitations);

// Respond to invitation (accept/reject)
router.post("/respond", respondToInvitation);

// Get group details with invitation status
router.get("/draft/:groupId", getGroupDetails);

// Confirm and finalize group (Step 3)
router.post("/confirm/:groupId", confirmGroup);

// Cancel draft group
router.delete("/draft/:groupId", cancelDraft);

export default router;
