import { Router } from 'express';
import analyzeRouter from './analyze';
import apiController from '../controllers/api.controller';
import { ROUTES } from '../constants/Routes';
import { healthRateLimit } from '../middleware/rateLimit';

const router = Router();

// Health check endpoint with rate limiting
router.get(ROUTES.HEALTH, healthRateLimit, apiController.health.bind(apiController));

// Root API endpoint
router.get('/', apiController.info.bind(apiController));

// Mount analyze routes
router.use(ROUTES.FILE_UPLOAD, analyzeRouter);

export default router;
