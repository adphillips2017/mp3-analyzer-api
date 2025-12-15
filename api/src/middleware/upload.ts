import multer from 'multer';
import { Request } from 'express';
import { ErrorMessages } from '@mp3-analyzer/shared';
import {
  FILE_FIELD_NAME,
  MAX_FILE_SIZE_BYTES,
  MP3_EXTENSION,
  MP3_MIME_TYPES
} from '../constants/FileUpload';

// Configure multer for memory storage (file will be in req.file.buffer)
const storage = multer.memoryStorage();

// File filter to only accept MP3 files
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
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
    file.mimetype === MP3_MIME_TYPES.MPEG ||
    file.mimetype === MP3_MIME_TYPES.MP3 ||
    file.originalname.toLowerCase().endsWith(MP3_EXTENSION)
  );
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES
  }
});

// Middleware for single file upload with field name 'file'
export const uploadSingle = upload.single(FILE_FIELD_NAME);
