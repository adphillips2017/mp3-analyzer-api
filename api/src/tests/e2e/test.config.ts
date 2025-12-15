/**
 * E2E Test Configuration
 *
 * Timeout values can be overridden by:
 * - Setting E2E_TEST_TIMEOUT in .env file (in api directory)
 * - Setting E2E_TEST_TIMEOUT environment variable
 * - Default: 30 seconds (converted to 30000 milliseconds)
 */

import dotenv from 'dotenv';
import path from 'path';

// Load .env file from the api directory
dotenv.config({ path: path.join(__dirname, '../../../.env') });

// E2E_TEST_TIMEOUT is specified in seconds in .env, but Jest expects milliseconds
const E2E_TEST_TIMEOUT_SECONDS = parseInt(process.env.E2E_TEST_TIMEOUT || '30', 10);
const MILLISECONDS_PER_SECOND = 1000;
const E2E_TEST_TIMEOUT = E2E_TEST_TIMEOUT_SECONDS * MILLISECONDS_PER_SECOND;

export { E2E_TEST_TIMEOUT };
