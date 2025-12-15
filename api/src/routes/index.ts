import { Router } from 'express';
import analyzeRouter from './analyze';
import apiController from '../controllers/api.controller';
import { ROUTES } from '../constants/Routes';

const router = Router();

// Health check endpoint
router.get(ROUTES.HEALTH, apiController.health.bind(apiController));

// Root API endpoint
router.get('/', apiController.info.bind(apiController));

// Mount analyze routes
router.use(ROUTES.FILE_UPLOAD, analyzeRouter);

export default router;
