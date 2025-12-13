import { Response } from 'express';
import { AnalyzeResponse } from '@mp3-analyzer/shared';
import { FileRequest } from '../models/RequestWithFile';
import { HttpStatus } from '../models/HttpStatus';


class AnalyzeController {
  /**
   * Handle POST /api/analyze
   * Accepts MP3 file and returns confirmation
   * Note: Only MPEG-1 Layer 3 files are supported
   */
  async analyze(req: FileRequest, res: Response<AnalyzeResponse>): Promise<void> {
    // Check if file was uploaded
    if (!req.file) {
      const errorResponse: AnalyzeResponse = {
        status: 'error',
        error: 'No file uploaded',
        message: 'Please upload an MP3 file using the "file" field in multipart/form-data'
      };
      res.status(HttpStatus.BAD_REQUEST).json(errorResponse);
      return;
    }

    // Return simple confirmation response for now.
    const successResponse: AnalyzeResponse = {
      status: 'received',
      fileName: req.file.originalname
    };
    res.status(HttpStatus.OK).json(successResponse);
  }
}

export default new AnalyzeController();
