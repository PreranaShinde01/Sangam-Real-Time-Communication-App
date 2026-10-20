import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { fileController } from '../controllers/fileController';
import { optionalAuth } from '../middleware/auth';
import { uploadLimiter } from '../middleware/rateLimiter';
import { env } from '../config/env';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.resolve(env.UPLOAD_DIR));
  },
  filename: (req, file, cb) => {
    const randomName = crypto.randomBytes(16).toString('hex');
    cb(null, `${Date.now()}-${randomName}.enc`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,
  },
});

const router = Router();

router.post('/upload', optionalAuth, uploadLimiter, upload.single('file'), fileController.uploadFile);
router.get('/:fileId/download', optionalAuth, fileController.downloadFile);

export const fileRoutes = router;
