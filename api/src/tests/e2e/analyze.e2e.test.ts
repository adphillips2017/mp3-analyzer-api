import request from 'supertest';
import express, { Express } from 'express';
import routes from '../../routes';
import { setupMiddleware } from '../../middleware';
import fs from 'fs';
import path from 'path';
import { E2E_TEST_TIMEOUT } from './test.config';
import { HttpStatus } from '../../constants/HttpStatus';
import { ROUTES } from '../../constants/Routes';
import { FILE_FIELD_NAME } from '../../constants/FileUpload';

describe('Analyze Endpoint E2E', () => {
  let app: Express;

  // Test data: MP3 files and their expected frame counts (verified by MediaInfo)
  const testFiles = [
    { fileName: 'valid_1.mp3', expectedFrameCount: 6089 },
    { fileName: 'valid_2.mp3', expectedFrameCount: 1610 },
    { fileName: 'valid_3.mp3', expectedFrameCount: 2221 },
    { fileName: 'valid_4.mp3', expectedFrameCount: 2065 },
    { fileName: 'valid_5.mp3', expectedFrameCount: 5090 }
  ];

  // Base path to test files
  const getAssetPath = (fileName: string): string => {
    return path.join(__dirname, '../../../../assets/testFiles', fileName);
  };

  beforeAll(() => {
    app = express();
    setupMiddleware(app);
    app.use(ROUTES.API_BASE, routes);
  });

  // Data-driven tests for MP3 file analysis
  describe.each(testFiles)(
    'should analyze $fileName and return the correct frame count',
    ({ fileName, expectedFrameCount }) => {
      it(
        `should return frame count of ${expectedFrameCount} for ${fileName}`,
        async () => {
          const mp3Path = getAssetPath(fileName);

          // Check if file exists
          if (!fs.existsSync(mp3Path)) {
            throw new Error(`Test MP3 file not found at ${mp3Path}`);
          }

          // Make request with file upload
          const response = await request(app)
            .post(`${ROUTES.API_BASE}${ROUTES.FILE_UPLOAD}`)
            .attach(FILE_FIELD_NAME, mp3Path)
            .expect(HttpStatus.OK);

          // Verify response structure and frame count
          expect(response.body).toHaveProperty('frameCount');
          expect(typeof response.body.frameCount).toBe('number');
          expect(response.body.frameCount).toBe(expectedFrameCount);
        },
        E2E_TEST_TIMEOUT
      );
    }
  );

  it('should return error when no file is uploaded', async () => {
    const response = await request(app)
      .post(`${ROUTES.API_BASE}${ROUTES.FILE_UPLOAD}`)
      .expect(HttpStatus.BAD_REQUEST);

    expect(response.body).toHaveProperty('status');
    expect(response.body.status).toBe('error');
    expect(response.body).toHaveProperty('error');
    expect(response.body).toHaveProperty('message');
  });

  it(
    'should return error when file of improper type is submitted',
    async () => {
      const mp4Path = getAssetPath('invalid_1.mp4');

      // Check if file exists
      if (!fs.existsSync(mp4Path)) {
        throw new Error(`Test MP4 file not found at ${mp4Path}`);
      }

      // Make request with MP4 file upload (should be rejected by multer file filter)
      const response = await request(app)
        .post(`${ROUTES.API_BASE}${ROUTES.FILE_UPLOAD}`)
        .attach(FILE_FIELD_NAME, mp4Path);

      // Verify error response - multer file filter rejects non-MP3 files
      // Invalid file type is a client error, so it should return 400 (BAD_REQUEST)
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);

      // Verify error response structure exists
      expect(response.body).toBeDefined();

      // If response has error structure, verify it
      if (response.body.status) {
        expect(response.body.status).toBe('error');
      }
    },
    E2E_TEST_TIMEOUT
  );
});
