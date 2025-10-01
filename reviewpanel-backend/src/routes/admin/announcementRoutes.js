import express from 'express';
import announcementController, { uploadFile } from '../../controllers/admin/announcementController.js';
import pblReviewController from '../../controllers/admin/pblReviewController.js';
import authMiddleware from '../../middleware/authMiddleware.js';
import { deadlineBlocker } from '../../middleware/deadlineMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/admin/tools/announcement/send
 * @desc    Send a new announcement with optional file upload
 * @access  Private (Admin)
 */
router.post(
  '/announcement/send', 
  authMiddleware.verifyToken, 
  authMiddleware.authenticateAdmin, 
  uploadFile, 
  announcementController.sendAnnouncement
);

/**
 * @route   GET /api/admin/tools/announcement
 * @desc    Get all announcements
 * @access  Private
 */
router.get(
  '/', 
  authMiddleware.verifyToken, 
  announcementController.getAnnouncements
);

/**
 * @route   DELETE /api/admin/tools/announcement/:id
 * @desc    Delete an announcement
 * @access  Private (Admin)
 */
router.delete(
  '/announcement/:id', 
  authMiddleware.verifyToken, 
  authMiddleware.authenticateAdmin, 
  announcementController.deleteAnnouncement
);

/**
 * @route   GET /api/admin/tools/announcement/:id/download
 * @desc    Download file from announcement
 * @access  Private
 */
router.get(
  '/announcement/:id/download', 
  authMiddleware.verifyToken, 
  announcementController.downloadAnnouncementFile
);

/**
 * @route   GET /api/admin/tools/announcement/review1marks
 * @desc    Show PBL Review 1 marks for a student
 * @access  Private (with deadline control)
 */
router.get(
  '/announcement/review1marks', 
  authMiddleware.verifyToken, 
  deadlineBlocker('show_pbl_review1_marks'), 
  pblReviewController.showPBLReview1Marks
);

/**
 * @route   GET /api/admin/tools/announcement/review2marks
 * @desc    Show PBL Review 2 marks for a student
 * @access  Private (with deadline control)
 */
router.get(
  '/announcement/review2marks', 
  authMiddleware.verifyToken, 
  deadlineBlocker('show_pbl_review2_marks'), 
  pblReviewController.showPBLReview2Marks
);

export default router;