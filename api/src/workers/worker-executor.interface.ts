/**
 * Interface for executing MP3 parsing tasks
 * Allows dependency injection for testability
 */
export interface WorkerExecutor {
  /**
   * Execute MP3 parsing and return frame count
   * @param buffer - The MP3 file buffer
   * @returns Promise resolving to frame count
   */
  execute(buffer: Buffer): Promise<number>;

  /**
   * Terminate the executor and cleanup resources
   * @returns Promise that resolves when cleanup is complete
   */
  terminate?(): Promise<void>;
}
