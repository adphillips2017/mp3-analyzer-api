/**
 * Server configuration constants
 */

// Server port (default: 3000)
export const DEFAULT_PORT = 3000;
export const PORT = parseInt(process.env.PORT || String(DEFAULT_PORT), 10);

// Server host (default: 0.0.0.0 to accept connections from all interfaces)
export const DEFAULT_HOST = '0.0.0.0';
export const HOST = process.env.HOST || DEFAULT_HOST;
