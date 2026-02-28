/**
 * Secure multer upload factory.
 *
 * Enforces both MIME-type AND file-extension whitelists so a malicious actor
 * cannot bypass the filter by simply spoofing Content-Type.
 */
import multer from 'multer';
import path from 'path';

// Map of allowed MIME types → allowed extensions for each upload profile
const PROFILES = {
  /** Images only (JPEG / PNG / GIF / WebP) – posts, announcements */
  image: {
    mimes: new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']),
    exts: new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']),
    maxSizeMb: 10,
    label: 'image (JPEG, PNG, GIF, WebP)'
  },
  /** Images + PDF – announcements */
  imageOrPdf: {
    mimes: new Set([
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf'
    ]),
    exts: new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf']),
    maxSizeMb: 10,
    label: 'image or PDF'
  },
  /** Resume – PDF / Word */
  resume: {
    mimes: new Set([
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]),
    exts: new Set(['.pdf', '.doc', '.docx']),
    maxSizeMb: 5,
    label: 'PDF or Word document'
  },
  /** Profile picture – JPEG / PNG / WebP */
  profilePicture: {
    mimes: new Set(['image/jpeg', 'image/png', 'image/jpg', 'image/webp']),
    exts: new Set(['.jpg', '.jpeg', '.png', '.webp']),
    maxSizeMb: 5,
    label: 'JPEG, PNG, or WebP image'
  },
  /** Generic documents – broad whitelist for student document uploads */
  document: {
    mimes: new Set([
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
    ]),
    exts: new Set([
      '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx',
      '.txt', '.jpg', '.jpeg', '.png', '.gif', '.mp4', '.mpeg', '.zip'
    ]),
    maxSizeMb: 50,
    label: 'document, image, video, or archive'
  }
};

/**
 * Build a multer instance that enforces the given profile.
 *
 * @param {'image'|'imageOrPdf'|'resume'|'profilePicture'|'document'} profileName
 * @returns {import('multer').Multer}
 */
export const createUploader = (profileName) => {
  const profile = PROFILES[profileName];
  if (!profile) throw new Error(`Unknown upload profile: ${profileName}`);

  return multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: profile.maxSizeMb * 1024 * 1024,
      files: 5 // safety cap – individual callers can reduce further
    },
    fileFilter: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();

      if (!profile.mimes.has(file.mimetype)) {
        return cb(new Error(`Invalid file type. Only ${profile.label} files are allowed.`));
      }

      if (!profile.exts.has(ext)) {
        return cb(new Error(`Invalid file extension. Only ${[...profile.exts].join(', ')} extensions are allowed.`));
      }

      cb(null, true);
    }
  });
};

export { PROFILES };
