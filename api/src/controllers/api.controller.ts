import { Request, Response } from 'express';

/**
 * Controller for general API endpoints
 */
class ApiController {
  /**
   * Handle GET /api/health
   * Returns API health status
   */
  health(_req: Request, res: Response): void {
    res.status(200).json({ 
      status: 'ok', 
      message: 'MP3 Analyzer API is running' 
    });
  }

  /**
   * Handle GET /api/
   * Returns API information and available endpoints
   */
  info(_req: Request, res: Response): void {
    res.status(200).json({
      message: 'MP3 Analyzer API',
      version: '1.0.0',
      endpoints: {
        health: '/api/health',
        analyze: '/api/analyze (POST)'
      }
    });
  }
}

export default new ApiController();
