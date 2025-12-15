import rateLimit from 'express-rate-limit';
import { ErrorMessages } from '@mp3-analyzer/shared';

/**
 * Default rate limits (requests per minute)
 * Can be overridden via environment variables
 */
const DEFAULT_ANALYZE_LIMIT = 100; // requests per minute
const DEFAULT_HEALTH_LIMIT = 1000; // requests per minute

/**
 * Get rate limit from environment variable or use default
 */
const getRateLimit = (envVar: string | undefined, defaultValue: number): number => {
  if (envVar) {
    const parsed = parseInt(envVar, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return defaultValue;
};

/**
 * Rate limiter for analyze endpoint (lower limit)
 * Default: 100 requests per minute
 * Configure via RATE_LIMIT_ANALYZE environment variable
 */
export const analyzeRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: getRateLimit(process.env.RATE_LIMIT_ANALYZE, DEFAULT_ANALYZE_LIMIT),
  message: ErrorMessages.RATE_LIMIT_EXCEEDED,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false // Disable the `X-RateLimit-*` headers
});

/**
 * Rate limiter for health check endpoint (higher limit)
 * Default: 1000 requests per minute
 * Configure via RATE_LIMIT_HEALTH environment variable
 */
export const healthRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: getRateLimit(process.env.RATE_LIMIT_HEALTH, DEFAULT_HEALTH_LIMIT),
  message: ErrorMessages.RATE_LIMIT_EXCEEDED,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false // Disable the `X-RateLimit-*` headers
});
