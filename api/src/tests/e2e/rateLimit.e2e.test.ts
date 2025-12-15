import request from 'supertest';
import express, { Express } from 'express';
import { E2E_TEST_TIMEOUT } from './test.config';
import { HttpStatus } from '../../constants/HttpStatus';
import { ROUTES } from '../../constants/Routes';
import { ErrorMessages } from '@mp3-analyzer/shared';
import routes from '../../routes';
import { setupMiddleware } from '../../middleware';

describe('Rate Limiting E2E', () => {
  let app: Express;

  // Use lower limits for faster testing
  // Note: Set RATE_LIMIT_ANALYZE and RATE_LIMIT_HEALTH env vars before running tests
  // to use custom limits. Otherwise, defaults will be used.
  const TEST_RATE_LIMIT_ANALYZE = parseInt(process.env.RATE_LIMIT_ANALYZE || '5', 10);
  const TEST_RATE_LIMIT_HEALTH = parseInt(process.env.RATE_LIMIT_HEALTH || '10', 10);

  beforeAll(() => {
    app = express();
    setupMiddleware(app);
    app.use(ROUTES.API_BASE, routes);
  });

  /**
   * Helper to get the actual rate limit from response headers
   */
  const getRateLimitFromHeaders = (
    headers: Record<string, string | string[] | undefined>
  ): number => {
    const limit = headers['ratelimit-limit'];
    if (typeof limit === 'string') {
      return parseInt(limit, 10);
    }
    return 0;
  };

  describe('Analyze Endpoint Rate Limiting', () => {
    it(
      'should allow requests up to the rate limit',
      async () => {
        // Make requests up to the limit (should all succeed)
        for (let i = 0; i < TEST_RATE_LIMIT_ANALYZE; i++) {
          const response = await request(app)
            .post(`${ROUTES.API_BASE}${ROUTES.FILE_UPLOAD}`)
            .expect((res) => {
              // Should not be rate limited (could be 400 for missing file, but not 429)
              expect(res.status).not.toBe(HttpStatus.TOO_MANY_REQUESTS);
            });

          // Check rate limit headers are present
          expect(response.headers['ratelimit-limit']).toBeDefined();
          expect(response.headers['ratelimit-remaining']).toBeDefined();
        }
      },
      E2E_TEST_TIMEOUT
    );

    it(
      'should return 429 when rate limit is exceeded for analyze endpoint',
      async () => {
        // First, get the actual rate limit from headers
        const firstResponse = await request(app).post(`${ROUTES.API_BASE}${ROUTES.FILE_UPLOAD}`);
        const actualLimit = getRateLimitFromHeaders(firstResponse.headers);

        // If we couldn't get the limit from headers, use the test limit
        const limitToTest = actualLimit > 0 ? actualLimit : TEST_RATE_LIMIT_ANALYZE;

        // Make requests up to the limit (skip the first one we already made)
        for (let i = 1; i < limitToTest; i++) {
          await request(app).post(`${ROUTES.API_BASE}${ROUTES.FILE_UPLOAD}`);
        }

        // Next request should be rate limited
        const response = await request(app)
          .post(`${ROUTES.API_BASE}${ROUTES.FILE_UPLOAD}`)
          .expect(HttpStatus.TOO_MANY_REQUESTS);

        // Verify rate limit error message
        expect(response.body).toMatchObject({
          error: ErrorMessages.RATE_LIMIT_EXCEEDED.error,
          retryAfter: ErrorMessages.RATE_LIMIT_EXCEEDED.retryAfter
        });

        // Verify rate limit headers
        expect(response.headers['ratelimit-limit']).toBeDefined();
        expect(response.headers['ratelimit-remaining']).toBe('0');
        expect(response.headers['ratelimit-reset']).toBeDefined();
      },
      E2E_TEST_TIMEOUT
    );
  });

  describe('Health Check Endpoint Rate Limiting', () => {
    it(
      'should allow requests up to the rate limit',
      async () => {
        // Make requests up to the limit (should all succeed)
        for (let i = 0; i < TEST_RATE_LIMIT_HEALTH; i++) {
          const response = await request(app)
            .get(`${ROUTES.API_BASE}${ROUTES.HEALTH}`)
            .expect(HttpStatus.OK);

          // Check rate limit headers are present
          expect(response.headers['ratelimit-limit']).toBeDefined();
          expect(response.headers['ratelimit-remaining']).toBeDefined();
        }
      },
      E2E_TEST_TIMEOUT
    );

    it(
      'should return 429 when rate limit is exceeded for health endpoint',
      async () => {
        // First, get the actual rate limit from headers
        const firstResponse = await request(app).get(`${ROUTES.API_BASE}${ROUTES.HEALTH}`);
        const actualLimit = getRateLimitFromHeaders(firstResponse.headers);

        // If we couldn't get the limit from headers, use the test limit
        const limitToTest = actualLimit > 0 ? actualLimit : TEST_RATE_LIMIT_HEALTH;

        // Make requests up to the limit (skip the first one we already made)
        for (let i = 1; i < limitToTest; i++) {
          await request(app).get(`${ROUTES.API_BASE}${ROUTES.HEALTH}`);
        }

        // Next request should be rate limited
        const response = await request(app)
          .get(`${ROUTES.API_BASE}${ROUTES.HEALTH}`)
          .expect(HttpStatus.TOO_MANY_REQUESTS);

        // Verify rate limit error message
        expect(response.body).toMatchObject({
          error: ErrorMessages.RATE_LIMIT_EXCEEDED.error,
          retryAfter: ErrorMessages.RATE_LIMIT_EXCEEDED.retryAfter
        });

        // Verify rate limit headers
        expect(response.headers['ratelimit-limit']).toBeDefined();
        expect(response.headers['ratelimit-remaining']).toBe('0');
        expect(response.headers['ratelimit-reset']).toBeDefined();
      },
      E2E_TEST_TIMEOUT
    );
  });
});
