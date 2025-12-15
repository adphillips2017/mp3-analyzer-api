import { Request, Response } from 'express';
import { HttpStatus } from '../constants/HttpStatus';
import { API_NAME, API_VERSION, HEALTH_STATUS } from '../constants/Api';
import { ROUTES } from '../constants/Routes';

/**
 * Controller for general API endpoints
 */
class ApiController {
  /**
   * Handle GET /api/health
   * Returns API health status
   */
  health(_req: Request, res: Response): void {
    res.status(HttpStatus.OK).json({
      status: HEALTH_STATUS,
      message: `${API_NAME} is running`
    });
  }

  /**
   * Handle GET /api/
   * Returns API information and available endpoints
   */
  info(_req: Request, res: Response): void {
    res.status(HttpStatus.OK).json({
      message: API_NAME,
      version: API_VERSION,
      endpoints: {
        health: `${ROUTES.API_BASE}${ROUTES.HEALTH}`,
        analyze: `${ROUTES.API_BASE}${ROUTES.FILE_UPLOAD} (POST)`
      }
    });
  }
}

export default new ApiController();
