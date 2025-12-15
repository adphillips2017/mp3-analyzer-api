/**
 * Worker thread for MP3 parsing
 * Uses shared parsing module to avoid code duplication
 * 
 * This worker receives a buffer, parses it, and returns the frame count
 */

import { parentPort } from 'worker_threads';
import { getMp3FrameCount } from '../services/mp3-parser';

// Worker message handler
if (parentPort) {
  parentPort.on('message', (buffer: Buffer) => {
    try {
      // Use shared parsing module - single source of truth
      const frameCount = getMp3FrameCount(buffer);
      parentPort!.postMessage({ success: true, frameCount });
    } catch (error) {
      parentPort!.postMessage({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
}
