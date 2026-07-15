// ═══════════════════════════════════════════════════════════════
// File Upload Middleware
// Multer memory-storage setup with size and mimetype verification
// ═══════════════════════════════════════════════════════════════

import multer from 'multer';
import { ApiError } from '../utils/api-error';
import { UPLOAD } from '@nexastore/shared';

// Use memory storage since we upload files directly to Cloudinary
const storage = multer.memoryStorage();

/** Filter files based on allowed image/video formats */
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const isImage = (UPLOAD.ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.mimetype);
  const isVideo = (UPLOAD.ALLOWED_VIDEO_TYPES as readonly string[]).includes(file.mimetype);

  if (isImage || isVideo) {
    cb(null, true);
  } else {
    cb(
      ApiError.badRequest(
        `Unsupported file type: ${file.mimetype}. Allowed types: Images (JPG/PNG/WEBP/GIF), Videos (MP4/WEBM)`
      ) as any,
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    // Default general limit (will be enforced conditionally inside fields or via router)
    fileSize: Math.max(UPLOAD.MAX_IMAGE_SIZE, UPLOAD.MAX_VIDEO_SIZE),
  },
});

export const uploadSingle = (fieldName: string) => upload.single(fieldName);

export const uploadMultiple = (fieldName: string, maxCount = 10) => upload.array(fieldName, maxCount);

export const uploadFields = (fields: multer.Field[]) => upload.fields(fields);
