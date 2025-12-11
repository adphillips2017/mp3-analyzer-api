import { Router, Request, Response } from 'express';
import analyzeRouter from './analyze';

const router = Router();

// Health check endpoint
router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'MP3 Analyzer API is running' });
});

// Root API endpoint
router.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'MP3 Analyzer API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      analyze: '/api/analyze (POST)'
    }
  });
});

// Mount analyze routes
router.use('/analyze', analyzeRouter);

export default router;
