import multer from 'multer';
import { Request } from 'express';
import { ErrorMessages } from '@mp3-analyzer/shared';

// Configure multer for memory storage (file will be in req.file.buffer)
const storage = multer.memoryStorage();

// File filter to only accept MP3 files
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback): void => {
  // Check if file is MP3
  if (isMp3(file)) {
    cb(null, true);
  } else {
    // Store error in request for controller to handle
    (req as Request & { fileValidationError?: Error }).fileValidationError = new Error(
      ErrorMessages.INVALID_FILE_TYPE.message
    );
    cb(null, false); // Reject file but don't throw error
  }
};

const isMp3 = (file: Express.Multer.File): boolean => {
  return (
    file.mimetype === 'audio/mpeg' ||
    file.mimetype === 'audio/mp3' ||
    file.originalname.toLowerCase().endsWith('.mp3')
  );
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Middleware for single file upload with field name 'file'
export const uploadSingle = upload.single('file');
