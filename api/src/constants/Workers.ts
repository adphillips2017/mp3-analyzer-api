/**
 * Worker thread configuration constants
 */
import os from 'os';

// Default worker count based on CPU cores
export const DEFAULT_MAX_WORKERS = os.cpus().length;

// Maximum number of worker threads (configurable via WORKER_THREADS env var)
const getMaxWorkers = (): number => {
  const envValue = process.env.WORKER_THREADS;
  if (envValue) {
    const parsed = parseInt(envValue, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return DEFAULT_MAX_WORKERS;
};

export const MAX_WORKERS = getMaxWorkers();

// Default timeout for worker operations in milliseconds
const DEFAULT_WORKER_TIMEOUT_SECONDS = 30;
const getWorkerTimeout = (): number => {
  const envValue = process.env.WORKER_TIMEOUT;
  if (envValue) {
    const parsed = parseInt(envValue, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed * 1000; // Convert seconds to milliseconds
    }
  }
  return DEFAULT_WORKER_TIMEOUT_SECONDS * 1000;
};

export const WORKER_TIMEOUT_MS = getWorkerTimeout();
