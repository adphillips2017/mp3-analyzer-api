/**
 *
 * Mp3 File Structure:
 *
 *  - Made up of individual frames
 *  - Each frame has its own header and data block
 *  - Header includes:
 *    - Frame sync: first 11 bits, all 1's
 *    - mp3 version
 *    - layer
 *    - error protection
 *    - bitrate
 *    - frequency
 *    - padding bits
 *    - etc.
 *
 *    https://en.wikipedia.org/wiki/MP3#File_structure
 *
 */

import { Mp3Header } from '../models/Mp3';
import { WorkerExecutor } from '../workers/worker-executor.interface';
import { createWorkerPool } from '../workers/worker-pool';
import {
  getMp3FrameCount as parseMp3FrameCount,
  parseFrameHeader,
  isValidFrame,
  calculateFrameLength
} from './mp3-parser';

class AnalyzeService {
  private executor: WorkerExecutor;

  constructor(executor?: WorkerExecutor) {
    this.executor = executor || createWorkerPool();
  }

  /**
   * Analyze an MP3 file and return frame count (async, uses worker executor)
   * We assume the file is an MPEG Version 1 Audio Layer 3 (MP3).
   * - Skips ID3v2 tags at the start
   * - Excludes ID3v1 tags at the end
   * - Does not count frames that end exactly at the file boundary (considered incomplete)
   *
   * @param file - The MP3 file
   * @returns Promise resolving to frame count (returns 0 if file is corrupted or invalid)
   * @throws Error if file buffer operations fail unexpectedly
   */
  async getMp3FrameCount(file: Buffer): Promise<number> {
    try {
      return await this.executor.execute(file);
    } catch (error) {
      // Handle worker errors
      // If parsing fails due to malformed data, return 0 frames
      if (error instanceof RangeError || error instanceof TypeError) {
        return 0;
      }
      // Re-throw other errors to be handled by controller
      throw error;
    }
  }

  /**
   * Analyze an MP3 file and return frame count (synchronous version)
   * Used by mock executor for testing
   * Delegates to shared parsing module
   *
   * @param file - The MP3 file
   * @returns Frame count (returns 0 if file is corrupted or invalid)
   * @throws Error if file buffer operations fail unexpectedly
   */
  getMp3FrameCountSync(file: Buffer): number {
    return parseMp3FrameCount(file);
  }

  // Re-export parsing methods for backward compatibility with tests
  // These delegate to the shared parsing module
  parseFrameHeader(buffer: Buffer, offset: number): Mp3Header {
    return parseFrameHeader(buffer, offset);
  }

  isValidFrame(header: Mp3Header): boolean {
    return isValidFrame(header);
  }

  calculateFrameLength(header: Mp3Header): number {
    return calculateFrameLength(header);
  }
}

// Export singleton instance (uses default worker pool)
const defaultService = new AnalyzeService();

// Export class for testing (allows dependency injection)
export { AnalyzeService };

export default defaultService;
