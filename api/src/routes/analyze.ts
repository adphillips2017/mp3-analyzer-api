import { Router } from 'express';
import analyzeController from '../controllers/analyze.controller';
import { uploadSingle } from '../middleware/upload';

const router = Router();

// MP3 analyzer endpoint with file upload middleware
router.post('/', uploadSingle, analyzeController.analyze.bind(analyzeController));

export default router;
