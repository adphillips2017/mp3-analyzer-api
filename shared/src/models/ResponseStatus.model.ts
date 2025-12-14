/**
 * Centralized response status strings for the MP3 Analyzer API
 * Shared between frontend and backend to ensure consistency
 */
export const ResponseStatus = {
  ERROR: 'error',
  RECEIVED: 'received',
  SUCCESS: 'success'  // Included to match AnalyzeResponse model
} as const;

export type ResponseStatusType = typeof ResponseStatus[keyof typeof ResponseStatus];
