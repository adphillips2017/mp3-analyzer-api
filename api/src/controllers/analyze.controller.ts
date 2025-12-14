import { Response } from 'express';
import { AnalyzeResponse, ErrorMessages, ResponseStatus } from '@mp3-analyzer/shared';
import { FileRequest } from '../models/RequestWithFile';
import { HttpStatus } from '../models/HttpStatus';
import AnalyzeService from '../services/analyze.service';


class AnalyzeController {
  /**
   * Handle POST /api/analyze
   * Accepts MP3 file and returns frame count
   * Note: Only MPEG-1 Layer 3 files are supported
   */
  async analyze(req: FileRequest, res: Response<AnalyzeResponse>): Promise<void> {
    try {
      // Check if file was uploaded
      if (!req.file) {
        const errorResponse: AnalyzeResponse = {
          status: ResponseStatus.ERROR,
          error: ErrorMessages.NO_FILE_UPLOADED.error,
          message: ErrorMessages.NO_FILE_UPLOADED.message
        };
        res.status(HttpStatus.BAD_REQUEST).json(errorResponse);
        return;
      }

      const frames = await AnalyzeService.getMp3FrameCount(req.file.buffer);

      // Return simple confirmation response for now.
      const successResponse: AnalyzeResponse = {
        status: ResponseStatus.RECEIVED,
        fileName: req.file.originalname,
        frameCount: frames
      };
      res.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      console.error('Error analyzing MP3:', error);
      const errorResponse: AnalyzeResponse = {
        status: ResponseStatus.ERROR,
        error: 'ANALYSIS_ERROR',
        message: error instanceof Error ? error.message : 'An error occurred while analyzing the MP3 file'
      };
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse);
    }
  }
}

export default new AnalyzeController();
