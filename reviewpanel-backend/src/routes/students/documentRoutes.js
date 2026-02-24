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

const router = express.Router();

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common document types
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif',
      'video/mp4',
      'video/mpeg',
      'application/zip',
      'application/x-zip-compressed'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only documents, images, videos, and archives are allowed.'));
    }
  }
});

// All routes require student authentication
router.use(authMiddleware.authenticateStudent);

// Document routes
router.post('/upload', upload.single('file'), uploadDocument);
router.post('/link', addDocumentLink);
router.get('/', getDocuments);
router.get('/:id', getDocumentById);
router.delete('/:id', deleteDocument);

export default router;
