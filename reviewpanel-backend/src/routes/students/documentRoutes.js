import express from 'express';
import multer from 'multer';
import {
  uploadDocument,
  getDocuments,
  getDocumentById,
  deleteDocument,
  addDocumentLink
} from '../../controllers/students/documentController.js';
import authMiddleware from '../../middleware/authMiddleware.js';
import { createUploader } from '../../utils/secureUpload.js';

const router = express.Router();

// Secure uploader: broad document whitelist with MIME + extension validation
const _uploader = createUploader('document');

const upload = (req, res, next) => {
  _uploader.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'File size must not exceed 50 MB.' });
      }
      return res.status(400).json({ success: false, message: 'File upload error: ' + err.message });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

// All routes require student authentication
router.use(authMiddleware.authenticateStudent);

// Document routes
router.post('/upload', upload, uploadDocument);
router.post('/link', addDocumentLink);
router.get('/', getDocuments);
router.get('/:id', getDocumentById);
router.delete('/:id', deleteDocument);

export default router;
