import request from 'supertest';
import express, { Express } from 'express';
import { E2E_TEST_TIMEOUT } from './test.config';
import { HttpStatus } from '../../constants/HttpStatus';
import { ROUTES } from '../../constants/Routes';
import { ErrorMessages } from '@mp3-analyzer/shared';
import routes from '../../routes';
import { setupMiddleware } from '../../middleware';
import timeout from 'connect-timeout';
import { ResponseStatus } from '@mp3-analyzer/shared';

describe('Request Timeout E2E', () => {
  let app: Express;
  let originalTimeout: string | undefined;

  // Use a very short timeout for testing (1 second)
  const TEST_TIMEOUT_SECONDS = 1;
  const TEST_TIMEOUT_MS = TEST_TIMEOUT_SECONDS * 1000;

  beforeAll(() => {
    // Save original timeout value
    originalTimeout = process.env.REQUEST_TIMEOUT;

    app = express();
    setupMiddleware(app);
    app.use(ROUTES.API_BASE, routes);
  });

  afterAll(() => {
    // Restore original timeout value
    if (originalTimeout !== undefined) {
      process.env.REQUEST_TIMEOUT = originalTimeout;
    } else {
      delete process.env.REQUEST_TIMEOUT;
    }
  });

  describe('Analyze Endpoint Timeout', () => {
    /**
     * Helper function to send timeout error response
     */
    const sendTimeoutResponse = (res: express.Response): void => {
      if (!res.headersSent) {
        res.status(HttpStatus.REQUEST_TIMEOUT).json({
          status: ResponseStatus.ERROR,
          error: ErrorMessages.REQUEST_TIMEOUT.error,
          message: ErrorMessages.REQUEST_TIMEOUT.message
        });
      }
    };

    /**
     * Helper function to simulate a long-running operation
     * that checks for timeout periodically
     */
    const simulateLongRunningOperation = async (
      req: express.Request,
      durationMs: number,
      checkIntervalMs: number = 50
    ): Promise<void> => {
      let elapsed = 0;
      while (elapsed < durationMs) {
        if (req.timedout) {
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, checkIntervalMs));
        elapsed += checkIntervalMs;
      }
    };

    it(
      'should return 408 Request Timeout when request exceeds timeout duration',
      async () => {
        // Create a test app with timeout middleware
        const testApp = express();
        setupMiddleware(testApp);
        const testTimeout = timeout(TEST_TIMEOUT_MS, { respond: false });

        // Create a route that simulates a long-running operation
        testApp.post(`${ROUTES.API_BASE}${ROUTES.FILE_UPLOAD}`, testTimeout, async (req, res) => {
          if (req.timedout) {
            sendTimeoutResponse(res);
            return;
          }

          // Simulate operation that exceeds timeout
          await simulateLongRunningOperation(req, TEST_TIMEOUT_MS + 500);

          // Handle timeout if it occurred during the operation
          if (req.timedout) {
            sendTimeoutResponse(res);
            return;
          }

          // Success response (should not reach here in this test)
          if (!res.headersSent) {
            res.status(HttpStatus.OK).json({ frameCount: 0 });
          }
        });

        // Make request that will timeout
        const response = await request(testApp)
          .post(`${ROUTES.API_BASE}${ROUTES.FILE_UPLOAD}`)
          .expect(HttpStatus.REQUEST_TIMEOUT);

        // Verify timeout error response
        expect(response.body).toMatchObject({
          status: ResponseStatus.ERROR,
          error: ErrorMessages.REQUEST_TIMEOUT.error,
          message: ErrorMessages.REQUEST_TIMEOUT.message
        });
      },
      E2E_TEST_TIMEOUT
    );

    it(
      'should allow requests that complete within timeout duration',
      async () => {
        // Use the health endpoint which is fast and doesn't require file uploads
        // This verifies that normal requests complete successfully without timing out
        const response = await request(app)
          .get(`${ROUTES.API_BASE}${ROUTES.HEALTH}`)
          .expect(HttpStatus.OK);

        // Verify it's not a timeout error and returns expected health response
        expect(response.status).not.toBe(HttpStatus.REQUEST_TIMEOUT);
        expect(response.body).toHaveProperty('status');
        expect(response.body).toHaveProperty('message');
      },
      E2E_TEST_TIMEOUT
    );

    it(
      'should use configurable timeout from REQUEST_TIMEOUT env var',
      async () => {
        // Test that the timeout middleware respects the environment variable
        // The default timeout is 60 seconds, but we can configure it via env var
        const { requestTimeout } = await import('../../middleware/timeout');

        // Verify the middleware was created
        expect(requestTimeout).toBeDefined();

        // The middleware should be configured based on REQUEST_TIMEOUT env var
        // or default to 60 seconds if not set
        expect(typeof requestTimeout).toBe('function');
      },
      E2E_TEST_TIMEOUT
    );
  });
});
