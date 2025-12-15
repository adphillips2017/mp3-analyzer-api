/**
 * Centralized error messages for the MP3 Analyzer API
 * Shared between frontend and backend to ensure consistency
 */
export const ErrorMessages = {
  NO_FILE_UPLOADED: {
    error: 'No file uploaded',
    message: 'Please upload an MP3 file using the "file" field in multipart/form-data'
  },
  INVALID_FILE_TYPE: {
    error: 'INVALID_FILE_TYPE',
    message: 'Only MP3 files are allowed'
  },
  RATE_LIMIT_EXCEEDED: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '1 minute'
  }
} as const;
