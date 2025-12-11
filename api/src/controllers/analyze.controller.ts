import { Request, Response } from 'express';


class AnalyzeController {
  /**
   * Handle POST /api/analyze
   * Accepts MP3 file and returns confirmation
   * Note: Only MPEG-1 Layer 3 files are supported
   */
  async analyze(req: Request, res: Response): Promise<void> {
    // Check if file was uploaded
    if (!req.file) {
      res.status(400).json({
        error: 'No file uploaded',
        message: 'Please upload an MP3 file using the "file" field in multipart/form-data'
      });
      return;
    }

    // Return simple confirmation response
    res.status(200).json({
      status: 'received',
      fileName: req.file.originalname
    });
  }
}

export default new AnalyzeController();
