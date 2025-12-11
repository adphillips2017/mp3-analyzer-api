import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'MP3 Analyzer API is running' });
});

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'MP3 Analyzer API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      analyze: '/api/analyze (POST)'
    }
  });
});

// MP3 analyzer endpoint (placeholder for now)
app.post('/api/analyze', (_req: Request, res: Response) => {
  res.json({
    message: 'MP3 analyzer endpoint - placeholder',
    frames: 0
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
