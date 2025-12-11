import { Router, Request, Response } from 'express';

const router = Router();

// MP3 analyzer endpoint (placeholder for now)
router.post('/', (_req: Request, res: Response) => {
  res.json({
    message: 'MP3 analyzer endpoint - placeholder',
    frames: 0
  });
});

export default router;
