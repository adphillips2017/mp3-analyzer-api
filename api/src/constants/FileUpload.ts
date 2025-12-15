/**
 * File upload configuration constants
 */

// Supported MIME types for MP3 files
export const MP3_MIME_TYPES = {
  MPEG: 'audio/mpeg',
  MP3: 'audio/mp3'
} as const;

// File extension
export const MP3_EXTENSION = '.mp3';

// Multer field name for file upload
export const FILE_FIELD_NAME = 'file';

// Maximum file size in bytes
// Can be overridden via MAX_FILE_SIZE environment variable (in MB)
// Default: 100 MB
const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE || '100', 10);
const BYTES_PER_MB = 1024 * 1024; // 1 MB = 1,048,576 bytes
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * BYTES_PER_MB;
