import { Request, Response } from 'express';
import analyzeController from '../../../controllers/analyze.controller';

describe('AnalyzeController', () => {
  describe('analyze', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let responseJson: jest.Mock;
    let responseStatus: jest.Mock;

    beforeEach(() => {
      responseJson = jest.fn();
      responseStatus = jest.fn().mockReturnValue({ json: responseJson });
      
      mockRequest = {};
      mockResponse = {
        status: responseStatus,
        json: responseJson,
      };
    });

    it('should return 400 error when no file is uploaded', async () => {
      mockRequest.file = undefined;

      await analyzeController.analyze(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        error: 'No file uploaded',
        message: 'Please upload an MP3 file using the "file" field in multipart/form-data',
      });
    });

    it('should return 200 with status received and fileName when file is uploaded', async () => {
      const mockFile = {
        fieldname: 'file',
        originalname: 'test.mp3',
        encoding: '7bit',
        mimetype: 'audio/mpeg',
        buffer: Buffer.from('mock file content'),
        size: 1234,
      };

      mockRequest.file = mockFile as Express.Multer.File;

      await analyzeController.analyze(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({
        status: 'received',
        fileName: 'test.mp3',
      });
    });
  });
});
