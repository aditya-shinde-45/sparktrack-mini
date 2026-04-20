import express from 'express';
import multer from 'multer';
import authMiddleware from '../../middleware/authMiddleware.js';
import { createUploader } from '../../utils/secureUpload.js';
import {
  getTrackerSheetForStudent,
  saveTrackerSheetForStudent,
  uploadTrackerProof,
} from '../../controllers/students/trackerSheetController.js';

const router = express.Router();
const _uploader = createUploader('document');

const uploadProofMiddleware = (req, res, next) => {
  _uploader.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File size must not exceed 50 MB.',
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Proof upload error: ' + err.message,
      });
    }

    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    next();
  });
};

router.use(authMiddleware.authenticateStudent);

router.get('/tracker-sheet/me', getTrackerSheetForStudent);
router.put('/tracker-sheet/me', saveTrackerSheetForStudent);
router.post('/tracker-sheet/proof', uploadProofMiddleware, uploadTrackerProof);

export default router;
