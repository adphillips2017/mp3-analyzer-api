/**
 * Mock executor for testing
 * Executes parsing synchronously in the main thread (no workers)
 * Used in unit tests for fast execution without worker overhead
 */
import { WorkerExecutor } from './worker-executor.interface';
import { getMp3FrameCount } from '../services/mp3-parser';

class MockExecutor implements WorkerExecutor {
  /**
   * Execute MP3 parsing synchronously (for testing)
   * @param buffer - The MP3 file buffer
   * @returns Promise resolving to frame count
   */
  async execute(buffer: Buffer): Promise<number> {
    // Execute synchronously using the shared parser
    // This is fast and doesn't require workers for unit tests
    return Promise.resolve(getMp3FrameCount(buffer));
  }
}

export { MockExecutor };
