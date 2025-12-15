/**
 * E2E Test Configuration
 *
 * Timeout values can be overridden by:
 * - Setting E2E_TEST_TIMEOUT in .env file (in api directory)
 * - Setting E2E_TEST_TIMEOUT environment variable
 * - Default: 30000 (30 seconds)
 */

import dotenv from 'dotenv';
import path from 'path';

// Load .env file from the api directory
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const E2E_TEST_TIMEOUT = parseInt(process.env.E2E_TEST_TIMEOUT || '30000', 10);

export { E2E_TEST_TIMEOUT };
