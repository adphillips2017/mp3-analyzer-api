import { Router } from 'express';
import analyzeController from '../controllers/analyze.controller';
import { uploadSingle } from '../middleware/upload';
import { analyzeRateLimit } from '../middleware/rateLimit';

const router = Router();

// MP3 analyzer endpoint with rate limiting and file upload middleware
// Note: File validation errors are handled in the controller
router.post('/', analyzeRateLimit, uploadSingle, analyzeController.analyze.bind(analyzeController));

export default router;
