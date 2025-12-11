import { Request, Response } from 'express';
import analyzeService from '../services/analyze.service';


class AnalyzeController {
  /**
   * Handle POST /api/analyze
   * Analyzes an MP3 file and returns the frame count
   */
  async analyze(_req: Request, res: Response): Promise<void> {
    try {
      // TODO: Extract file from request
      // For now, return placeholder response
      const result = await analyzeService.analyzeMp3();
      
      res.status(200).json({
        message: 'MP3 analysis completed',
        frames: result.frames
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        error: 'Failed to analyze MP3 file',
        message: errorMessage
      });
    }
  }
}

export default new AnalyzeController();
