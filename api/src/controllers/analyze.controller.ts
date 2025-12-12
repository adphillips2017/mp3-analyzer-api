import { Request, Response } from 'express';
import { AnalyzeResponse } from '@mp3-analyzer/shared';


class AnalyzeController {
  /**
   * Handle POST /api/analyze
   * Accepts MP3 file and returns confirmation
   * Note: Only MPEG-1 Layer 3 files are supported
   */
  async analyze(req: Request, res: Response): Promise<void> {
    // Check if file was uploaded
    if (!req.file) {
      const errorResponse: AnalyzeResponse = {
        status: 'error',
        error: 'No file uploaded',
        message: 'Please upload an MP3 file using the "file" field in multipart/form-data'
      };
      res.status(400).json(errorResponse);
      return;
    }

    // Return simple confirmation response
    const successResponse: AnalyzeResponse = {
      status: 'received',
      fileName: req.file.originalname
    };
    res.status(200).json(successResponse);
  }
}

export default new AnalyzeController();
