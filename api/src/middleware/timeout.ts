import timeout from 'connect-timeout';
import { Request, Response, NextFunction } from 'express';
import { ErrorMessages } from '@mp3-analyzer/shared';
import { HttpStatus } from '../constants/HttpStatus';
import { ResponseStatus } from '@mp3-analyzer/shared';

/**
 * Default timeout duration (in seconds)
 * Can be overridden via REQUEST_TIMEOUT environment variable
 */
const DEFAULT_TIMEOUT_SECONDS = 60;

/**
 * Get timeout duration from environment variable or use default
 */
const getTimeoutSeconds = (envVar: string | undefined, defaultValue: number): number => {
  if (envVar) {
    const parsed = parseInt(envVar, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return defaultValue;
};

/**
 * Convert seconds to milliseconds for connect-timeout
 */
const timeoutMs = getTimeoutSeconds(process.env.REQUEST_TIMEOUT, DEFAULT_TIMEOUT_SECONDS) * 1000;

/**
 * Timeout middleware for requests
 * Default: 60 seconds
 * Configure via REQUEST_TIMEOUT environment variable (in seconds)
 * Uses respond: false to handle timeout manually with custom error response
 */
export const requestTimeout = timeout(timeoutMs, { respond: false });

/**
 * Middleware to check for timeout and return appropriate error response
 * Should be placed after the timeout middleware but before route handlers
 */
export const timeoutErrorHandler = (req: Request, res: Response, next: NextFunction): void => {
  // Check if this request has timed out
  if (req.timedout) {
    // If response headers haven't been sent, send timeout error
    if (!res.headersSent) {
      res.status(HttpStatus.REQUEST_TIMEOUT).json({
        status: ResponseStatus.ERROR,
        error: ErrorMessages.REQUEST_TIMEOUT.error,
        message: ErrorMessages.REQUEST_TIMEOUT.message
      });
    }
    return;
  }

  // If not timed out, continue to next middleware
  next();
};
