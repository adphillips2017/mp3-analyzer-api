import { Router } from 'express';
import analyzeController from '../controllers/analyze.controller';
import { uploadSingle } from '../middleware/upload';
import { analyzeRateLimit } from '../middleware/rateLimit';
import { requestTimeout, timeoutErrorHandler } from '../middleware/timeout';

const router = Router();

// MP3 analyzer endpoint with rate limiting, timeout, and file upload middleware
// Note: File validation errors are handled in the controller
router.post(
  '/',
  analyzeRateLimit,
  requestTimeout,
  uploadSingle,
  timeoutErrorHandler,
  analyzeController.analyze.bind(analyzeController)
);

export default router;
