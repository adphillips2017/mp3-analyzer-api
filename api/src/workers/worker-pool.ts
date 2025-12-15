/**
 * Worker pool for executing MP3 parsing tasks
 * Implements WorkerExecutor interface
 */
import { Worker } from 'worker_threads';
import path from 'path';
import { WorkerExecutor } from './worker-executor.interface';
import { MAX_WORKERS, WORKER_TIMEOUT_MS } from '../constants/Workers';

interface WorkerTask {
  buffer: Buffer;
  resolve: (value: number) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
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
      // Create timeout for the task
      const timeout = setTimeout(() => {
        reject(new Error(`Worker task timed out after ${WORKER_TIMEOUT_MS}ms`));
      }, WORKER_TIMEOUT_MS);

      const task: WorkerTask = {
        buffer,
        resolve: (value) => {
          clearTimeout(timeout);
          resolve(value);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        },
        timeout
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
    // Worker file path - handle both development (ts) and production (js) modes
    // Try TypeScript file first (for development), fall back to JavaScript (for production)
    const fs = require('fs');
    const tsWorkerPath = path.join(__dirname, 'mp3-parser.worker.ts');
    const jsWorkerPath = path.join(__dirname, 'mp3-parser.worker.js');
    
    let workerPath: string;
    let execArgv: string[] = [];
    
    // Check if TypeScript file exists (development mode)
    // Also check if we're in a test environment (Jest uses ts-jest which can handle .ts files)
    if (fs.existsSync(tsWorkerPath) || process.env.NODE_ENV !== 'production') {
      workerPath = tsWorkerPath;
      // Use tsx loader for TypeScript execution
      execArgv = ['-r', 'tsx/cjs'];
    } else {
      // Use compiled JavaScript (production mode)
      workerPath = jsWorkerPath;
    }
    
    const worker = new Worker(workerPath, {
      execArgv: execArgv.length > 0 ? execArgv : undefined
    });

    worker.on('message', (result: { success: boolean; frameCount?: number; error?: string }) => {
      const task = this.workerTasks.get(worker);
      if (!task) {
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
   * Remove a failed worker
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
