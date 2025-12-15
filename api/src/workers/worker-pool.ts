/**
 * Worker pool for executing MP3 parsing tasks
 * Implements WorkerExecutor interface
 */
import { Worker } from 'worker_threads';
import path from 'path';
import fs from 'fs';
import { WorkerExecutor } from './worker-executor.interface';
import { MAX_WORKERS, WORKER_TIMEOUT_MS } from '../constants/Workers';

interface WorkerTask {
  buffer: Buffer;
  resolve: (value: number) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
  timedOut?: boolean;
}

class WorkerPool implements WorkerExecutor {
  private workers: Worker[] = [];
  private availableWorkers: Worker[] = [];
  private taskQueue: WorkerTask[] = [];
  private workerTasks: Map<Worker, WorkerTask> = new Map();

  constructor() {
    // Workers are created on-demand
  }

  /**
   * Execute MP3 parsing task using worker pool
   * @param buffer - The MP3 file buffer
   * @returns Promise resolving to frame count
   */
  async execute(buffer: Buffer): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      const task: WorkerTask = {
        buffer,
        resolve: (value) => {
          // Only resolve if not timed out
          if (!task.timedOut) {
            clearTimeout(task.timeout);
            resolve(value);
          }
        },
        reject: (error) => {
          // Only reject if not timed out (timeout already rejected)
          if (!task.timedOut) {
            clearTimeout(task.timeout);
            reject(error);
          }
        },
        timeout: setTimeout(() => {
          // Mark task as timed out
          task.timedOut = true;
          clearTimeout(task.timeout);

          // Find and remove the task from workerTasks if it's being processed
          let timedOutWorker: Worker | undefined;
          for (const [worker, workerTask] of this.workerTasks.entries()) {
            if (workerTask === task) {
              timedOutWorker = worker;
              this.workerTasks.delete(worker);
              break;
            }
          }

          // If task was being processed, return worker to pool for other tasks
          if (timedOutWorker) {
            this.returnWorker(timedOutWorker);
          } else {
            // If task was in queue, remove it
            const queueIndex = this.taskQueue.indexOf(task);
            if (queueIndex !== -1) {
              this.taskQueue.splice(queueIndex, 1);
            }
          }

          reject(new Error(`Worker task timed out after ${WORKER_TIMEOUT_MS}ms`));
        }, WORKER_TIMEOUT_MS)
      };

      // Try to get an available worker
      const worker = this.getAvailableWorker();
      if (worker) {
        this.executeTask(worker, task);
      } else {
        // Queue the task if no workers available
        this.taskQueue.push(task);
      }
    });
  }

  /**
   * Get an available worker or create a new one if under limit
   */
  private getAvailableWorker(): Worker | null {
    // Return an available worker if one exists
    if (this.availableWorkers.length > 0) {
      return this.availableWorkers.pop() || null;
    }

    // Create a new worker if under limit
    if (this.workers.length < MAX_WORKERS) {
      return this.createWorker();
    }

    return null;
  }

  /**
   * Create a new worker thread
   */
  private createWorker(): Worker {
    let workerPath: string;
    let execArgv: string[] = [];
    
    // Simplify path resolution:
    // - Production: always use .js from dist/workers/
    // - Development/test: use .ts from src/workers/ with tsx
    if (process.env.NODE_ENV === 'production') {
      // Production mode: use compiled JavaScript
      workerPath = path.join(__dirname, 'mp3-parser.worker.js');
      
      // Verify the file exists
      if (!fs.existsSync(workerPath)) {
        throw new Error(
          `Worker file not found: ${workerPath}. Make sure the project is built before running in production.`
        );
      }
    } else {
      // Development/test mode: use TypeScript with tsx
      workerPath = path.join(__dirname, 'mp3-parser.worker.ts');
      execArgv = ['-r', 'tsx/cjs'];
      
      // Verify the file exists
      if (!fs.existsSync(workerPath)) {
        throw new Error(
          `Worker file not found: ${workerPath}. Make sure the source file exists.`
        );
      }
    }
    
    const worker = new Worker(workerPath, {
      execArgv: execArgv.length > 0 ? execArgv : undefined
    });

    worker.on('message', (result: { success: boolean; frameCount?: number; error?: string }) => {
      const task = this.workerTasks.get(worker);
      if (!task) {
        return;
      }

      // Ignore results from timed-out tasks
      if (task.timedOut) {
        this.workerTasks.delete(worker);
        // Return worker to pool for other tasks
        this.returnWorker(worker);
        return;
      }

      this.workerTasks.delete(worker);

      if (result.success && result.frameCount !== undefined) {
        task.resolve(result.frameCount);
      } else {
        task.reject(new Error(result.error || 'Unknown error in worker'));
      }

      // Return worker to available pool or process next queued task
      this.returnWorker(worker);
    });

    worker.on('error', (error) => {
      const task = this.workerTasks.get(worker);
      if (task) {
        this.workerTasks.delete(worker);
        task.reject(error);
      }

      // Remove failed worker and create replacement if needed
      this.removeWorker(worker);
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        const task = this.workerTasks.get(worker);
        if (task) {
          this.workerTasks.delete(worker);
          task.reject(new Error(`Worker exited with code ${code}`));
        }
        this.removeWorker(worker);
      }
    });

    this.workers.push(worker);
    return worker;
  }

  /**
   * Execute a task on a worker
   */
  private executeTask(worker: Worker, task: WorkerTask): void {
    this.workerTasks.set(worker, task);
    worker.postMessage(task.buffer);
  }

  /**
   * Return a worker to the available pool or process next queued task
   */
  private returnWorker(worker: Worker): void {
    if (this.taskQueue.length > 0) {
      // Process next queued task
      const nextTask = this.taskQueue.shift();
      if (nextTask) {
        this.executeTask(worker, nextTask);
      }
    } else {
      // Return to available pool
      this.availableWorkers.push(worker);
    }
  }

  /**
   * Remove a failed worker and replace it if needed to maintain pool capacity
   */
  private removeWorker(worker: Worker): void {
    const index = this.workers.indexOf(worker);
    if (index > -1) {
      this.workers.splice(index, 1);
    }

    const availableIndex = this.availableWorkers.indexOf(worker);
    if (availableIndex > -1) {
      this.availableWorkers.splice(availableIndex, 1);
    }

    this.workerTasks.delete(worker);

    // Terminate the worker
    worker.terminate().catch(() => {
      // Ignore termination errors
    });

    // Replace the failed worker to maintain pool capacity up to MAX_WORKERS
    // This ensures the pool can continue handling the expected load
    if (this.workers.length < MAX_WORKERS) {
      try {
        const replacementWorker = this.createWorker();
        
        // If there are queued tasks, immediately assign one to the new worker
        if (this.taskQueue.length > 0) {
          const nextTask = this.taskQueue.shift();
          if (nextTask) {
            this.executeTask(replacementWorker, nextTask);
          } else {
            // No task to assign, add to available pool
            this.availableWorkers.push(replacementWorker);
          }
        } else {
          // No queued tasks, add to available pool
          this.availableWorkers.push(replacementWorker);
        }
      } catch (error) {
        // Log error but don't throw - pool can continue with reduced capacity
        // In production, you might want to use a proper logger here
        console.error('Failed to replace worker after failure:', error);
      }
    }
  }

  /**
   * Terminate all workers and cleanup
   */
  async terminate(): Promise<void> {
    // Clear queued tasks
    this.taskQueue.forEach((task) => {
      task.reject(new Error('Worker pool terminated'));
    });
    this.taskQueue = [];

    // Terminate all workers
    const terminationPromises = this.workers.map((worker) => {
      const task = this.workerTasks.get(worker);
      if (task) {
        task.reject(new Error('Worker pool terminated'));
      }
      return worker.terminate();
    });

    await Promise.all(terminationPromises);

    this.workers = [];
    this.availableWorkers = [];
    this.workerTasks.clear();
  }
}

// Export singleton instance
let workerPoolInstance: WorkerPool | null = null;

export function createWorkerPool(): WorkerExecutor {
  if (!workerPoolInstance) {
    workerPoolInstance = new WorkerPool();
  }
  return workerPoolInstance;
}

export function getWorkerPool(): WorkerPool | null {
  return workerPoolInstance;
}
