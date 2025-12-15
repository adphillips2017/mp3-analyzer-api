import express from 'express';
import routes from './routes';
import { setupMiddleware } from './middleware';
import { ROUTES } from './constants/Routes';
import { PORT } from './constants/Server';
import { getWorkerPool } from './workers/worker-pool';

const app = express();

// Middleware
setupMiddleware(app);

// Routes - mount all routes under /api
app.use(ROUTES.API_BASE, routes);

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}${ROUTES.API_BASE}${ROUTES.HEALTH}`);
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}, starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(() => {
    console.log('HTTP server closed');
  });

  // Terminate worker pool
  const workerPool = getWorkerPool();
  if (workerPool) {
    try {
      await workerPool.terminate();
      console.log('Worker pool terminated');
    } catch (error) {
      console.error('Error terminating worker pool:', error);
    }
  }

  // Exit process
  process.exit(0);
};

// Handle termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
