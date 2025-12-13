import { Request, Response } from 'express';
import { AnalyzeResponse } from '@mp3-analyzer/shared';
import analyzeController from '../../../controllers/analyze.controller';
import { HttpStatus } from '../../../models/HttpStatus';

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

      expect(responseStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      const expectedErrorResponse: AnalyzeResponse = {
        status: 'error',
        error: 'No file uploaded',
        message: 'Please upload an MP3 file using the "file" field in multipart/form-data',
      };
      expect(responseJson).toHaveBeenCalledWith(expectedErrorResponse);
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

      expect(responseStatus).toHaveBeenCalledWith(HttpStatus.OK);
      const expectedSuccessResponse: AnalyzeResponse = {
        status: 'received',
        fileName: 'test.mp3',
      };
      expect(responseJson).toHaveBeenCalledWith(expectedSuccessResponse);
    });
  });
});
