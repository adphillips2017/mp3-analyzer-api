import { Router } from 'express';
import analyzeController from '../controllers/analyze.controller';

const router = Router();

// MP3 analyzer endpoint
router.post('/', analyzeController.analyze.bind(analyzeController));

export default router;
