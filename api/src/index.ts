import express from 'express';
import routes from './routes';
import { setupMiddleware } from './middleware';
import { ROUTES } from './constants/Routes';
import { PORT } from './constants/Server';
import analyzeRouter from './routes/analyze';

const app = express();

// Middleware
setupMiddleware(app);

// Forward /file-upload to /api/file-upload
// additional measure to ensure app meets the requirement:
// "application must host an endpoint at /file-upload"
app.use(ROUTES.FILE_UPLOAD, analyzeRouter);

// Routes - mount all routes under /api
app.use(ROUTES.API_BASE, routes);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}${ROUTES.API_BASE}${ROUTES.HEALTH}`);
});
