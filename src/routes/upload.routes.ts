import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { logger } from '../utils/logger';

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Allowed MIME types grouped by category
const ALLOWED_TYPES: Record<string, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  video: ['video/mp4', 'video/quicktime', 'video/webm'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a', 'audio/webm', 'audio/ogg'],
  document: ['application/pdf', 'text/plain'],
};

const ALL_ALLOWED = Object.values(ALLOWED_TYPES).flat();

// File size limits per category (bytes)
const SIZE_LIMITS: Record<string, number> = {
  image: 10 * 1024 * 1024,     // 10 MB
  video: 100 * 1024 * 1024,    // 100 MB
  audio: 50 * 1024 * 1024,     // 50 MB
  document: 20 * 1024 * 1024,  // 20 MB
};

function getFileCategory(mimetype: string): string | null {
  for (const [category, types] of Object.entries(ALLOWED_TYPES)) {
    if (types.includes(mimetype)) return category;
  }
  return null;
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB max (enforced per-category below)
  fileFilter: (_req, file, cb) => {
    if (!ALL_ALLOWED.includes(file.mimetype)) {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
      return;
    }
    cb(null, true);
  },
});

const router = Router();

router.post('/', upload.single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const category = getFileCategory(req.file.mimetype);
    if (!category) {
      // Clean up file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Unsupported file type' });
    }

    // Enforce per-category size limit
    const maxSize = SIZE_LIMITS[category] || 10 * 1024 * 1024;
    if (req.file.size > maxSize) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        error: `File too large. Max size for ${category}: ${Math.round(maxSize / 1024 / 1024)}MB`,
      });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    logger.info(`File uploaded: ${fileUrl} (${category}, ${req.file.size} bytes)`);

    return res.json({
      fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      category,
    });
  } catch (err: any) {
    logger.error('Upload error:', err);
    return res.status(500).json({ error: 'Upload failed' });
  }
});

// Multer error handling
router.use((err: any, _req: Request, res: Response, _next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large (max 100MB)' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err?.message?.startsWith('Unsupported file type')) {
    return res.status(400).json({ error: err.message });
  }
  return res.status(500).json({ error: 'Upload failed' });
});

export default router;
