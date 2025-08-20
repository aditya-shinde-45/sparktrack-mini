import express from 'express';
import multer from 'multer';
import path from 'path';
import { uploadSIH, getSIHProblems } from '../../controller/admin/sihController.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    if (ext !== '.xlsx' && ext !== '.xls') {
      return cb(new Error('Only Excel files are allowed'));
    }
    cb(null, true);
  }
});

// Routes
router.post('/upload', upload.single('file'), uploadSIH);
router.get('/problems', getSIHProblems);

export default router;