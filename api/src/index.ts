import express from 'express';
import routes from './routes';
import { setupMiddleware } from './middleware';
import { ROUTES } from './constants/Routes';
import { PORT } from './constants/Server';
import analyzeRouter from './routes/analyze';

const app = express();

// Middleware
setupMiddleware(app);


// Routes - mount all routes under /api
app.use(ROUTES.API_BASE, routes);

// Forward /file-upload to /api/file-upload
// additional measure to ensure app meets the requirement:
// "application must host an endpoint at /file-upload"
// app.post('/file-upload', analyzeRouter);

// Start server - bind to 0.0.0.0 to accept connections from all interfaces
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port: ${PORT}`);
  console.log(`Server is accessible at http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}${ROUTES.API_BASE}${ROUTES.HEALTH}`);
});

// Graceful shutdown handling
const gracefulShutdown = (signal: string) => {
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
