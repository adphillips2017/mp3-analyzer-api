import request from 'supertest';
import express, { Express } from 'express';
import routes from '../../routes';
import { setupMiddleware } from '../../middleware';
import fs from 'fs';
import path from 'path';

describe('Analyze Endpoint E2E', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    setupMiddleware(app);
    app.use('/api', routes);
  });

  it('should analyze given sample MP3 file and return the correct frame count', async () => {
    // Path to the test MP3 file (from api/src/tests/e2e to root/assets/mp3s)
    const mp3Path = path.join(__dirname, '../../../../assets/mp3s/valid_1.mp3');

    // Frame Count as verified by MediaInfo
    const targetFrameCount = 6089;
    
    // Check if file exists
    if (!fs.existsSync(mp3Path)) {
      throw new Error(`Test MP3 file not found at ${mp3Path}`);
    }

    // Make request with file upload
    const response = await request(app)
      .post('/api/file-upload')
      .attach('file', mp3Path)
      .expect(200);

    // Verify response structure
    expect(response.body).toHaveProperty('frameCount');
    expect(typeof response.body.frameCount).toBe('number');
    expect(response.body.frameCount).toBe(targetFrameCount);
  }, 30000); // 30 second timeout

  it('should analyze an additional sample MP3 file and return the correct frame count', async () => {
    // Path to the test MP3 file (from api/src/tests/e2e to root/assets/mp3s)
    const mp3Path = path.join(__dirname, '../../../../assets/mp3s/valid_2.mp3');

    // Frame Count as verified by MediaInfo
    const targetFrameCount = 1610;
    
    // Check if file exists
    if (!fs.existsSync(mp3Path)) {
      throw new Error(`Test MP3 file not found at ${mp3Path}`);
    }

    // Make request with file upload
    const response = await request(app)
      .post('/api/file-upload')
      .attach('file', mp3Path)
      .expect(200);

    
    expect(response.body).toHaveProperty('frameCount');
    expect(typeof response.body.frameCount).toBe('number');
    expect(response.body.frameCount).toBe(targetFrameCount);
  }, 30000); // 30 second timeout

  it('should return error when no file is uploaded', async () => {
    const response = await request(app)
      .post('/api/file-upload')
      .expect(400);

    expect(response.body).toHaveProperty('status');
    expect(response.body.status).toBe('error');
    expect(response.body).toHaveProperty('error');
    expect(response.body).toHaveProperty('message');
  });
});
