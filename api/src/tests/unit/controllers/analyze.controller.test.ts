import { Request, Response } from 'express';
import { AnalyzeResponse, ErrorMessages, ResponseStatus } from '@mp3-analyzer/shared';
import analyzeController from '../../../controllers/analyze.controller';
import { HttpStatus } from '../../../constants/HttpStatus';
import AnalyzeService from '../../../services/analyze.service';

// Mock the service
jest.mock('../../../services/analyze.service');

describe('AnalyzeController', () => {
  describe('analyze', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let responseJson: jest.Mock;
    let responseStatus: jest.Mock;
    let mockGetMp3FrameCount: jest.Mock;

    beforeEach(() => {
      responseJson = jest.fn();
      responseStatus = jest.fn().mockReturnValue({ json: responseJson });

      mockRequest = {};
      mockResponse = {
        status: responseStatus,
        json: responseJson
      };

      // Setup service mock
      mockGetMp3FrameCount = jest.fn();
      (AnalyzeService.getMp3FrameCount as jest.Mock) = mockGetMp3FrameCount;
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should return 400 error when no file is uploaded', async () => {
      mockRequest.file = undefined;

      analyzeController.analyze(mockRequest as Request, mockResponse as Response);

      // Should not call the service when no file is uploaded
      expect(mockGetMp3FrameCount).not.toHaveBeenCalled();

      // Should return error response
      expect(responseStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      const expectedErrorResponse: AnalyzeResponse = {
        status: ResponseStatus.ERROR,
        error: ErrorMessages.NO_FILE_UPLOADED.error,
        message: ErrorMessages.NO_FILE_UPLOADED.message
      };
      expect(responseJson).toHaveBeenCalledWith(expectedErrorResponse);
    });

    it('should call service with file buffer and return success response with frame count', async () => {
      const mockFileBuffer = Buffer.from('mock file content');
      const mockFrameCount = 42;
      const mockFile = {
        fieldname: 'file',
        originalname: 'test.mp3',
        encoding: '7bit',
        mimetype: 'audio/mpeg',
        buffer: mockFileBuffer,
        size: 1234
      };

      mockRequest.file = mockFile as Express.Multer.File;
      mockGetMp3FrameCount.mockResolvedValue(mockFrameCount);

      await analyzeController.analyze(mockRequest as Request, mockResponse as Response);

      // Should call service with the file buffer
      expect(mockGetMp3FrameCount).toHaveBeenCalledTimes(1);
      expect(mockGetMp3FrameCount).toHaveBeenCalledWith(mockFileBuffer);

      // Should return success response with frame count
      expect(responseStatus).toHaveBeenCalledWith(HttpStatus.OK);
      expect(responseJson).toHaveBeenCalledWith({ frameCount: mockFrameCount });
    });

    it('should handle different file names correctly', async () => {
      const mockFileBuffer = Buffer.from('another file');
      const mockFrameCount = 100;
      const mockFile = {
        fieldname: 'file',
        originalname: 'different-file.mp3',
        encoding: '7bit',
        mimetype: 'audio/mpeg',
        buffer: mockFileBuffer,
        size: 5678
      };

      mockRequest.file = mockFile as Express.Multer.File;
      mockGetMp3FrameCount.mockResolvedValue(mockFrameCount);

      await analyzeController.analyze(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(HttpStatus.OK);
      expect(responseJson).toHaveBeenCalledWith({ frameCount: mockFrameCount });
    });

    it('should handle zero frame count', async () => {
      const mockFileBuffer = Buffer.from('invalid mp3 content');
      const mockFrameCount = 0;
      const mockFile = {
        fieldname: 'file',
        originalname: 'empty.mp3',
        encoding: '7bit',
        mimetype: 'audio/mpeg',
        buffer: mockFileBuffer,
        size: 100
      };

      mockRequest.file = mockFile as Express.Multer.File;
      mockGetMp3FrameCount.mockResolvedValue(mockFrameCount);

      await analyzeController.analyze(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(HttpStatus.OK);
      expect(responseJson).toHaveBeenCalledWith({ frameCount: 0 });
    });
  });
});
