/**
 * Server configuration constants
 */

// Server port (default: 3000)
export const DEFAULT_PORT = 3000;
export const PORT = parseInt(process.env.PORT || String(DEFAULT_PORT), 10);
