import express from 'express';
import multer from 'multer';
import authMiddleware from '../../middleware/authMiddleware.js';
import { createUploader } from '../../utils/secureUpload.js';
import {
  getNocForStudent,
  saveNocForStudent,
  uploadNocProof,
} from '../../controllers/students/nocController.js';

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

router.get('/noc/me', getNocForStudent);
router.put('/noc/me', saveNocForStudent);
router.post('/noc/proof', uploadProofMiddleware, uploadNocProof);

export default router;