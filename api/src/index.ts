import express from 'express';
import routes from './routes';
import { setupMiddleware } from './middleware';
import { ROUTES } from './constants/Routes';
import { PORT } from './constants/Server';

const app = express();

// Middleware
setupMiddleware(app);

// Routes - mount all routes under /api
app.use(ROUTES.API_BASE, routes);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}${ROUTES.API_BASE}${ROUTES.HEALTH}`);
});
