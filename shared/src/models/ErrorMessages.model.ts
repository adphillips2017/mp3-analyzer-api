/**
 * Centralized error messages for the MP3 Analyzer API
 * Shared between frontend and backend to ensure consistency
 */
export const ErrorMessages = {
  NO_FILE_UPLOADED: {
    error: 'No file uploaded',
    message: 'Please upload an MP3 file using the "file" field in multipart/form-data'
  }
} as const;
