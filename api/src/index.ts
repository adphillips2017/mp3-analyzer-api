import express from 'express';
import routes from './routes';
import { setupMiddleware } from './middleware';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
setupMiddleware(app);

// Routes - mount all routes under /api
app.use('/api', routes);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
