import { Router } from 'express';
import analyzeRouter from './analyze';
import apiController from '../controllers/api.controller';

const router = Router();

// Health check endpoint
router.get('/health', apiController.health.bind(apiController));

// Root API endpoint
router.get('/', apiController.info.bind(apiController));

// Mount analyze routes
router.use('/file-upload', analyzeRouter);

export default router;
