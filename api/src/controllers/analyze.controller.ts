import { Response } from 'express';
import { AnalyzeResponse, ErrorMessages, ResponseStatus } from '@mp3-analyzer/shared';
import { FileRequest } from '../models/RequestWithFile';
import { HttpStatus } from '../constants/HttpStatus';
import AnalyzeService from '../services/analyze.service';

class AnalyzeController {
  /**
   * Handle POST /api/analyze
   * Accepts MP3 file and returns frame count
   * Note: Only MPEG-1 Layer 3 files are supported
   */
  analyze(req: FileRequest, res: Response<AnalyzeResponse>): void {
    try {
      // Check if file was uploaded
      // Note: If multer fileFilter rejects the file, req.file will be undefined
      if (!req.file) {
        // Check if there was a file validation error (invalid file type)
        const fileValidationError = req.fileValidationError;
        if (fileValidationError) {
          const errorResponse: AnalyzeResponse = {
            status: ResponseStatus.ERROR,
            error: ErrorMessages.INVALID_FILE_TYPE.error,
            message: ErrorMessages.INVALID_FILE_TYPE.message
          };
          res.status(HttpStatus.BAD_REQUEST).json(errorResponse);
          return;
        }

        // No file uploaded at all
        const errorResponse: AnalyzeResponse = {
          status: ResponseStatus.ERROR,
          error: ErrorMessages.NO_FILE_UPLOADED.error,
          message: ErrorMessages.NO_FILE_UPLOADED.message
        };
        res.status(HttpStatus.BAD_REQUEST).json(errorResponse);
        return;
      }

      const frames = AnalyzeService.getMp3FrameCount(req.file.buffer);

      res.status(HttpStatus.OK).json({ frameCount: frames });
    } catch (error: unknown) {
      console.error('Error analyzing MP3:', error);
      const errorResponse: AnalyzeResponse = {
        status: ResponseStatus.ERROR,
        error: 'ANALYSIS_ERROR',
        message:
          error instanceof Error ? error.message : 'An error occurred while analyzing the MP3 file'
      };
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse);
    }
  }
}

export default new AnalyzeController();
