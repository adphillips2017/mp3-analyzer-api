/**
 * Response model for analyze endpoint
 */
export interface AnalyzeResponse {
  status: 'received' | 'success' | 'error';
  fileName?: string;
  frameCount?: number;
  error?: string;
  message?: string;
}
