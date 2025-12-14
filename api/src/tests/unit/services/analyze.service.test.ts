import analyzeService from '../../../services/analyze.service';
import { Mp3Header } from '../../../models/Mp3';

describe('AnalyzeService', () => {
  describe('calculateFrameLength', () => {
    it('should calculate frame length correctly without padding', () => {
      const header: Mp3Header = {
        frameSync: 0x7FF,
        mpegVersion: 3,
        layer: 1,
        bitrateIndex: 5, // 64 kbps
        sampleRateIndex: 1, // 48000 Hz
        padding: 0
      };
      
      // Formula: (144 * bitrate * 1000) / sampleRate + padding
      // (144 * 64 * 1000) / 48000 + 0 = 192
      const frameLength = analyzeService.calculateFrameLength(header);
      
      expect(frameLength).toBe(192);
    });

    it('should calculate frame length correctly with padding', () => {
      const header: Mp3Header = {
        frameSync: 0x7FF,
        mpegVersion: 3,
        layer: 1,
        bitrateIndex: 5, // 64 kbps
        sampleRateIndex: 1, // 48000 Hz
        padding: 1
      };
      
      // Formula: (144 * bitrate * 1000) / sampleRate + padding
      // (144 * 64 * 1000) / 48000 + 1 = 193
      const frameLength = analyzeService.calculateFrameLength(header);
      
      expect(frameLength).toBe(193);
    });

    it('should calculate frame length for different bitrates', () => {
      const header: Mp3Header = {
        frameSync: 0x7FF,
        mpegVersion: 3,
        layer: 1,
        bitrateIndex: 9, // 128 kbps
        sampleRateIndex: 0, // 44100 Hz
        padding: 0
      };
      
      // (144 * 128 * 1000) / 44100 = 417.96... -> 417 (floored)
      const frameLength = analyzeService.calculateFrameLength(header);
      
      expect(frameLength).toBe(417);
    });

    it('should calculate frame length for different sample rates', () => {
      const header: Mp3Header = {
        frameSync: 0x7FF,
        mpegVersion: 3,
        layer: 1,
        bitrateIndex: 5, // 64 kbps
        sampleRateIndex: 0, // 44100 Hz
        padding: 0
      };
      
      // (144 * 64 * 1000) / 44100 = 208.97... -> 208 (floored)
      const frameLength = analyzeService.calculateFrameLength(header);
      
      expect(frameLength).toBe(208);
    });

    it('should handle high bitrate correctly', () => {
      const header: Mp3Header = {
        frameSync: 0x7FF,
        mpegVersion: 3,
        layer: 1,
        bitrateIndex: 14, // 320 kbps
        sampleRateIndex: 1, // 48000 Hz
        padding: 0
      };
      
      // (144 * 320 * 1000) / 48000 = 960
      const frameLength = analyzeService.calculateFrameLength(header);
      
      expect(frameLength).toBe(960);
    });

    it('should return a positive integer', () => {
      const header: Mp3Header = {
        frameSync: 0x7FF,
        mpegVersion: 3,
        layer: 1,
        bitrateIndex: 5, // 64 kbps
        sampleRateIndex: 1, // 48000 Hz
        padding: 0
      };
      
      const frameLength = analyzeService.calculateFrameLength(header);
      
      expect(frameLength).toBeGreaterThan(0);
      expect(Number.isInteger(frameLength)).toBe(true);
    });
  });
});
