import express from 'express';
import routes from './routes';
import { setupMiddleware } from './middleware';
import { ROUTES } from './constants/Routes';
import { PORT, HOST } from './constants/Server';

const app = express();

// Middleware
setupMiddleware(app);

// Routes - mount all routes under /api
app.use(ROUTES.API_BASE, routes);

// Start server - bind to HOST to accept connections from all interfaces
const server = app.listen(PORT, HOST, () => {
  console.log(`Server is running on port: ${PORT}`);
  console.log(`Server is accessible at http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}${ROUTES.API_BASE}${ROUTES.HEALTH}`);
});

// Graceful shutdown handling
const gracefulShutdown = (signal: string): void => {
  console.log(`Received ${signal}, shutting down gracefully...`);
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
