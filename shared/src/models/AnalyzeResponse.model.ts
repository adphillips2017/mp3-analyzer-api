/**
 * Response model for analyze endpoint
 * Success responses only include frameCount
 * Error responses include status, error, and message
 */
export type AnalyzeResponse =
  | { frameCount: number }  // Success response
  | { status: 'error'; error: string; message: string };  // Error response
