import analyzeService from '../../../services/analyze.service';
import { Mp3Header } from '../../../models/Mp3';

describe('AnalyzeService', () => {
  describe('calculateFrameLength', () => {
    it('should calculate frame length correctly without padding', () => {
      const header: Mp3Header = {
        frameSync: 0x7ff,
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
        frameSync: 0x7ff,
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
        frameSync: 0x7ff,
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
        frameSync: 0x7ff,
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
        frameSync: 0x7ff,
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
        frameSync: 0x7ff,
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

  describe('isValidFrame', () => {
    it('should return true for a valid MPEG v1 Layer III frame', () => {
      const header: Mp3Header = {
        frameSync: 0x7ff,
        mpegVersion: 3,
        layer: 1,
        bitrateIndex: 5, // 64 kbps
        sampleRateIndex: 1, // 48000 Hz
        padding: 0
      };

      const isValid = analyzeService.isValidFrame(header);

      expect(isValid).toBe(true);
    });

    it('should return false when frame sync is invalid', () => {
      const header: Mp3Header = {
        frameSync: 0x7fe, // Invalid: not all 11 bits are 1s
        mpegVersion: 3,
        layer: 1,
        bitrateIndex: 5,
        sampleRateIndex: 1,
        padding: 0
      };

      const isValid = analyzeService.isValidFrame(header);

      expect(isValid).toBe(false);
    });

    it('should return false when MPEG version is not 3', () => {
      const header: Mp3Header = {
        frameSync: 0x7ff,
        mpegVersion: 2, // Invalid: not Version 1
        layer: 1,
        bitrateIndex: 5,
        sampleRateIndex: 1,
        padding: 0
      };

      const isValid = analyzeService.isValidFrame(header);

      expect(isValid).toBe(false);
    });

    it('should return false when layer is not 1', () => {
      const header: Mp3Header = {
        frameSync: 0x7ff,
        mpegVersion: 3,
        layer: 2, // Invalid: not Layer III
        bitrateIndex: 5,
        sampleRateIndex: 1,
        padding: 0
      };

      const isValid = analyzeService.isValidFrame(header);

      expect(isValid).toBe(false);
    });

    it('should return false when bitrate index is 0', () => {
      const header: Mp3Header = {
        frameSync: 0x7ff,
        mpegVersion: 3,
        layer: 1,
        bitrateIndex: 0, // Invalid: free format
        sampleRateIndex: 1,
        padding: 0
      };

      const isValid = analyzeService.isValidFrame(header);

      expect(isValid).toBe(false);
    });

    it('should return false when bitrate index is 15', () => {
      const header: Mp3Header = {
        frameSync: 0x7ff,
        mpegVersion: 3,
        layer: 1,
        bitrateIndex: 15, // Invalid: reserved
        sampleRateIndex: 1,
        padding: 0
      };

      const isValid = analyzeService.isValidFrame(header);

      expect(isValid).toBe(false);
    });

    it('should return false when sample rate index is 3', () => {
      const header: Mp3Header = {
        frameSync: 0x7ff,
        mpegVersion: 3,
        layer: 1,
        bitrateIndex: 5,
        sampleRateIndex: 3, // Invalid: reserved
        padding: 0
      };

      const isValid = analyzeService.isValidFrame(header);

      expect(isValid).toBe(false);
    });

    it('should return true for valid frames with different bitrate indices', () => {
      const validBitrateIndices = [1, 5, 9, 14];

      validBitrateIndices.forEach((bitrateIndex) => {
        const header: Mp3Header = {
          frameSync: 0x7ff,
          mpegVersion: 3,
          layer: 1,
          bitrateIndex,
          sampleRateIndex: 1,
          padding: 0
        };

        const isValid = analyzeService.isValidFrame(header);
        expect(isValid).toBe(true);
      });
    });

    it('should return true for valid frames with different sample rate indices', () => {
      const validSampleRateIndices = [0, 1, 2];

      validSampleRateIndices.forEach((sampleRateIndex) => {
        const header: Mp3Header = {
          frameSync: 0x7ff,
          mpegVersion: 3,
          layer: 1,
          bitrateIndex: 5,
          sampleRateIndex,
          padding: 0
        };

        const isValid = analyzeService.isValidFrame(header);
        expect(isValid).toBe(true);
      });
    });
  });

  describe('parseFrameHeader', () => {
    // Helper function to create a 32-bit MP3 header value.
    // Using bit-packing to construct a single 32-bit integer by
    // placing multiple logical fields into specific bit positions.
    // Using >>> 0 to ensure the result is an unsigned 32-bit integer.
    const createHeaderValue = (
      frameSync: number,
      mpegVersion: number,
      layer: number,
      bitrateIndex: number,
      sampleRateIndex: number,
      padding: number
    ): number => {
      return (
        ((frameSync << 21) |
          (mpegVersion << 19) |
          (layer << 17) |
          (bitrateIndex << 12) |
          (sampleRateIndex << 10) |
          (padding << 9)) >>>
        0
      );
    };

    // Helper function to create a Buffer with the header at offset 0
    const createHeaderBuffer = (headerValue: number): Buffer => {
      const buffer = Buffer.alloc(4);
      buffer.writeUInt32BE(headerValue, 0);
      return buffer;
    };

    it('should parse a valid MPEG v1 Layer III header correctly', () => {
      // frameSync=0x7FF, mpegVersion=3, layer=1, bitrateIndex=5, sampleRateIndex=1, padding=0
      const headerValue = createHeaderValue(0x7ff, 3, 1, 5, 1, 0);
      const buffer = createHeaderBuffer(headerValue);

      const header = analyzeService.parseFrameHeader(buffer, 0);

      expect(header.frameSync).toBe(0x7ff);
      expect(header.mpegVersion).toBe(3);
      expect(header.layer).toBe(1);
      expect(header.bitrateIndex).toBe(5);
      expect(header.sampleRateIndex).toBe(1);
      expect(header.padding).toBe(0);
    });

    it('should correctly extract frame sync bits', () => {
      const headerValue = createHeaderValue(0x7ff, 3, 1, 5, 1, 0);
      const buffer = createHeaderBuffer(headerValue);

      const header = analyzeService.parseFrameHeader(buffer, 0);

      expect(header.frameSync).toBe(0x7ff);
    });

    it('should correctly extract MPEG version bits', () => {
      const versions = [0, 1, 2, 3];

      versions.forEach((version) => {
        const headerValue = createHeaderValue(0x7ff, version, 1, 5, 1, 0);
        const buffer = createHeaderBuffer(headerValue);

        const header = analyzeService.parseFrameHeader(buffer, 0);

        expect(header.mpegVersion).toBe(version);
      });
    });

    it('should correctly extract layer bits', () => {
      const layers = [0, 1, 2, 3];

      layers.forEach((layer) => {
        const headerValue = createHeaderValue(0x7ff, 3, layer, 5, 1, 0);
        const buffer = createHeaderBuffer(headerValue);

        const header = analyzeService.parseFrameHeader(buffer, 0);

        expect(header.layer).toBe(layer);
      });
    });

    it('should correctly extract bitrate index bits', () => {
      const bitrateIndices = [0, 5, 9, 14, 15];

      bitrateIndices.forEach((bitrateIndex) => {
        const headerValue = createHeaderValue(0x7ff, 3, 1, bitrateIndex, 1, 0);
        const buffer = createHeaderBuffer(headerValue);

        const header = analyzeService.parseFrameHeader(buffer, 0);

        expect(header.bitrateIndex).toBe(bitrateIndex);
      });
    });

    it('should correctly extract sample rate index bits', () => {
      const sampleRateIndices = [0, 1, 2, 3];

      sampleRateIndices.forEach((sampleRateIndex) => {
        const headerValue = createHeaderValue(0x7ff, 3, 1, 5, sampleRateIndex, 0);
        const buffer = createHeaderBuffer(headerValue);

        const header = analyzeService.parseFrameHeader(buffer, 0);

        expect(header.sampleRateIndex).toBe(sampleRateIndex);
      });
    });

    it('should correctly extract padding bit', () => {
      const paddings = [0, 1];

      paddings.forEach((padding) => {
        const headerValue = createHeaderValue(0x7ff, 3, 1, 5, 1, padding);
        const buffer = createHeaderBuffer(headerValue);

        const header = analyzeService.parseFrameHeader(buffer, 0);

        expect(header.padding).toBe(padding);
      });
    });

    it('should parse header at non-zero offset', () => {
      const headerValue = createHeaderValue(0x7ff, 3, 1, 9, 0, 1);
      const buffer = Buffer.alloc(10);
      buffer.writeUInt32BE(headerValue, 5); // Write header at offset 5

      const header = analyzeService.parseFrameHeader(buffer, 5);

      expect(header.frameSync).toBe(0x7ff);
      expect(header.mpegVersion).toBe(3);
      expect(header.layer).toBe(1);
      expect(header.bitrateIndex).toBe(9);
      expect(header.sampleRateIndex).toBe(0);
      expect(header.padding).toBe(1);
    });

    it('should parse header with all fields set to maximum values', () => {
      const headerValue = createHeaderValue(0x7ff, 3, 3, 15, 3, 1);
      const buffer = createHeaderBuffer(headerValue);

      const header = analyzeService.parseFrameHeader(buffer, 0);

      expect(header.frameSync).toBe(0x7ff);
      expect(header.mpegVersion).toBe(3);
      expect(header.layer).toBe(3);
      expect(header.bitrateIndex).toBe(15);
      expect(header.sampleRateIndex).toBe(3);
      expect(header.padding).toBe(1);
    });

    it('should parse header with all fields set to minimum values', () => {
      const headerValue = createHeaderValue(0x0, 0, 0, 0, 0, 0);
      const buffer = createHeaderBuffer(headerValue);

      const header = analyzeService.parseFrameHeader(buffer, 0);

      expect(header.frameSync).toBe(0x0);
      expect(header.mpegVersion).toBe(0);
      expect(header.layer).toBe(0);
      expect(header.bitrateIndex).toBe(0);
      expect(header.sampleRateIndex).toBe(0);
      expect(header.padding).toBe(0);
    });
  });

  describe('getEndPosition', () => {
    // Access private method for testing
    const getEndPosition = (analyzeService as any).getEndPosition.bind(analyzeService);

    it('should return file length when file is smaller than 128 bytes', () => {
      const buffer = Buffer.alloc(50);
      const endPosition = getEndPosition(buffer);

      expect(endPosition).toBe(50);
    });

    it('should return file length when file is exactly 128 bytes but no ID3v1 tag', () => {
      const buffer = Buffer.alloc(128);
      buffer.fill(0x00); // Fill with zeros, no 'TAG' identifier
      const endPosition = getEndPosition(buffer);

      expect(endPosition).toBe(128);
    });

    it('should return file length when file is larger than 128 bytes but no ID3v1 tag', () => {
      const buffer = Buffer.alloc(200);
      buffer.fill(0x00);
      const endPosition = getEndPosition(buffer);

      expect(endPosition).toBe(200);
    });

    it('should return position before ID3v1 tag when tag is present', () => {
      const buffer = Buffer.alloc(200);
      buffer.fill(0x00);

      // Write 'TAG' at position 72 (200 - 128 = 72)
      buffer[72] = 0x54; // 'T'
      buffer[73] = 0x41; // 'A'
      buffer[74] = 0x47; // 'G'

      const endPosition = getEndPosition(buffer);

      expect(endPosition).toBe(72);
    });

    it('should return file length when first byte is not T', () => {
      const buffer = Buffer.alloc(200);
      buffer.fill(0x00);

      // Write something other than 'T' at ID3v1 position
      buffer[72] = 0x41; // 'A' instead of 'T'
      buffer[73] = 0x41; // 'A'
      buffer[74] = 0x47; // 'G'

      const endPosition = getEndPosition(buffer);

      expect(endPosition).toBe(200);
    });

    it('should return file length when second byte is not A', () => {
      const buffer = Buffer.alloc(200);
      buffer.fill(0x00);

      // Write 'T' but not 'A' at ID3v1 position
      buffer[72] = 0x54; // 'T'
      buffer[73] = 0x42; // 'B' instead of 'A'
      buffer[74] = 0x47; // 'G'

      const endPosition = getEndPosition(buffer);

      expect(endPosition).toBe(200);
    });

    it('should return file length when third byte is not G', () => {
      const buffer = Buffer.alloc(200);
      buffer.fill(0x00);

      // Write 'TA' but not 'G' at ID3v1 position
      buffer[72] = 0x54; // 'T'
      buffer[73] = 0x41; // 'A'
      buffer[74] = 0x48; // 'H' instead of 'G'

      const endPosition = getEndPosition(buffer);

      expect(endPosition).toBe(200);
    });

    it('should correctly identify ID3v1 tag at exact 128-byte boundary', () => {
      const buffer = Buffer.alloc(128);
      buffer[0] = 0x54; // 'T'
      buffer[1] = 0x41; // 'A'
      buffer[2] = 0x47; // 'G'

      const endPosition = getEndPosition(buffer);

      expect(endPosition).toBe(0);
    });

    it('should handle large files with ID3v1 tag', () => {
      const buffer = Buffer.alloc(10000);
      buffer.fill(0x00);

      // Write 'TAG' at position 9872 (10000 - 128 = 9872)
      buffer[9872] = 0x54; // 'T'
      buffer[9873] = 0x41; // 'A'
      buffer[9874] = 0x47; // 'G'

      const endPosition = getEndPosition(buffer);

      expect(endPosition).toBe(9872);
    });

    it('should return file length for empty buffer', () => {
      const buffer = Buffer.alloc(0);
      const endPosition = getEndPosition(buffer);

      expect(endPosition).toBe(0);
    });
  });

  describe('skipId3v2Tag', () => {
    // Access private method for testing
    const skipId3v2Tag = (analyzeService as any).skipId3v2Tag.bind(analyzeService);

    // Helper function to encode a synchsafe integer (7 bits per byte, MSB always 0)
    const encodeSynchsafe = (value: number): Buffer => {
      const buffer = Buffer.alloc(4);
      buffer[0] = (value >>> 21) & 0x7f;
      buffer[1] = (value >>> 14) & 0x7f;
      buffer[2] = (value >>> 7) & 0x7f;
      buffer[3] = value & 0x7f;
      return buffer;
    };

    // Helper function to create an ID3v2 tag header
    const createId3v2Tag = (size: number, version: number = 3, flags: number = 0): Buffer => {
      const header = Buffer.alloc(10);
      header[0] = 0x49; // 'I'
      header[1] = 0x44; // 'D'
      header[2] = 0x33; // '3'
      header[3] = version;
      header[4] = 0; // Subversion
      header[5] = flags;
      const sizeBytes = encodeSynchsafe(size);
      sizeBytes.copy(header, 6);
      return header;
    };

    it('should return original position when buffer is too small', () => {
      const buffer = Buffer.alloc(5);
      const position = skipId3v2Tag(buffer, 0);

      expect(position).toBe(0);
    });

    it('should return original position when not enough bytes from position', () => {
      const buffer = Buffer.alloc(100);
      const position = skipId3v2Tag(buffer, 95); // Only 5 bytes left, need 10

      expect(position).toBe(95);
    });

    it('should return original position when no ID3v2 tag is present', () => {
      const buffer = Buffer.alloc(100);
      buffer.fill(0x00);
      const position = skipId3v2Tag(buffer, 0);

      expect(position).toBe(0);
    });

    it('should return original position when first byte is not I', () => {
      const buffer = Buffer.alloc(100);
      buffer[0] = 0x41; // 'A' instead of 'I'
      buffer[1] = 0x44; // 'D'
      buffer[2] = 0x33; // '3'
      const position = skipId3v2Tag(buffer, 0);

      expect(position).toBe(0);
    });

    it('should return original position when second byte is not D', () => {
      const buffer = Buffer.alloc(100);
      buffer[0] = 0x49; // 'I'
      buffer[1] = 0x41; // 'A' instead of 'D'
      buffer[2] = 0x33; // '3'
      const position = skipId3v2Tag(buffer, 0);

      expect(position).toBe(0);
    });

    it('should return original position when third byte is not 3', () => {
      const buffer = Buffer.alloc(100);
      buffer[0] = 0x49; // 'I'
      buffer[1] = 0x44; // 'D'
      buffer[2] = 0x32; // '2' instead of '3'
      const position = skipId3v2Tag(buffer, 0);

      expect(position).toBe(0);
    });

    it('should skip ID3v2 tag with zero size', () => {
      const tagHeader = createId3v2Tag(0);
      const buffer = Buffer.concat([tagHeader, Buffer.alloc(50)]);
      const position = skipId3v2Tag(buffer, 0);

      expect(position).toBe(10); // 10 bytes header + 0 size
    });

    it('should skip ID3v2 tag with small size', () => {
      const tagHeader = createId3v2Tag(50);
      const buffer = Buffer.concat([tagHeader, Buffer.alloc(100)]);
      const position = skipId3v2Tag(buffer, 0);

      expect(position).toBe(60); // 10 bytes header + 50 size
    });

    it('should skip ID3v2 tag with larger size', () => {
      const tagHeader = createId3v2Tag(500);
      const buffer = Buffer.concat([tagHeader, Buffer.alloc(600)]);
      const position = skipId3v2Tag(buffer, 0);

      expect(position).toBe(510); // 10 bytes header + 500 size
    });

    it('should skip ID3v2 tag at non-zero position', () => {
      const prefix = Buffer.alloc(20);
      prefix.fill(0x00);
      const tagHeader = createId3v2Tag(100);
      const buffer = Buffer.concat([prefix, tagHeader, Buffer.alloc(200)]);
      const position = skipId3v2Tag(buffer, 20);

      expect(position).toBe(130); // 20 (start) + 10 (header) + 100 (size)
    });

    it('should handle ID3v2 tag with different versions', () => {
      const tagHeaderV2 = createId3v2Tag(50, 2);
      const tagHeaderV3 = createId3v2Tag(50, 3);
      const tagHeaderV4 = createId3v2Tag(50, 4);

      const bufferV2 = Buffer.concat([tagHeaderV2, Buffer.alloc(100)]);
      const bufferV3 = Buffer.concat([tagHeaderV3, Buffer.alloc(100)]);
      const bufferV4 = Buffer.concat([tagHeaderV4, Buffer.alloc(100)]);

      expect(skipId3v2Tag(bufferV2, 0)).toBe(60);
      expect(skipId3v2Tag(bufferV3, 0)).toBe(60);
      expect(skipId3v2Tag(bufferV4, 0)).toBe(60);
    });

    it('should correctly parse synchsafe integer for maximum size', () => {
      // Maximum synchsafe integer is 0x0FFFFFFF (268435455)
      const maxSize = 0x0fffffff;
      const tagHeader = createId3v2Tag(maxSize);
      const buffer = Buffer.concat([tagHeader, Buffer.alloc(maxSize + 100)]);
      const position = skipId3v2Tag(buffer, 0);

      expect(position).toBe(10 + maxSize);
    });

    it('should return original position when ID3v2 tag is at end of buffer', () => {
      const buffer = Buffer.alloc(10);
      const tagHeader = createId3v2Tag(0);
      tagHeader.copy(buffer, 0);
      // Buffer is exactly 10 bytes, so position + 10 > file.length check fails
      const position = skipId3v2Tag(buffer, 0);

      // Should still work since position + 10 = 10, which is not > 10
      expect(position).toBe(10);
    });
  });

  describe('getMp3FrameCount', () => {
    let skipId3v2TagSpy: jest.SpyInstance;
    let getEndPositionSpy: jest.SpyInstance;
    let parseFrameHeaderSpy: jest.SpyInstance;
    let isValidFrameSpy: jest.SpyInstance;
    let calculateFrameLengthSpy: jest.SpyInstance;

    beforeEach(() => {
      skipId3v2TagSpy = jest.spyOn(analyzeService as any, 'skipId3v2Tag');
      getEndPositionSpy = jest.spyOn(analyzeService as any, 'getEndPosition');
      parseFrameHeaderSpy = jest.spyOn(analyzeService, 'parseFrameHeader');
      isValidFrameSpy = jest.spyOn(analyzeService, 'isValidFrame');
      calculateFrameLengthSpy = jest.spyOn(analyzeService, 'calculateFrameLength');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return 0 when no valid frames are found', async () => {
      const buffer = Buffer.alloc(20); // Small buffer to limit iterations
      skipId3v2TagSpy.mockReturnValue(0);
      getEndPositionSpy.mockReturnValue(20);
      parseFrameHeaderSpy.mockReturnValue({
        frameSync: 0x7ff,
        mpegVersion: 3,
        layer: 1,
        bitrateIndex: 5,
        sampleRateIndex: 1,
        padding: 0
      });
      isValidFrameSpy.mockReturnValue(false);

      const frameCount = await analyzeService.getMp3FrameCount(buffer);

      expect(frameCount).toBe(0);
      expect(skipId3v2TagSpy).toHaveBeenCalledWith(buffer, 0);
      expect(getEndPositionSpy).toHaveBeenCalledWith(buffer);
    });

    it('should count a single valid frame', async () => {
      const buffer = Buffer.alloc(200);
      const header: Mp3Header = {
        frameSync: 0x7ff,
        mpegVersion: 3,
        layer: 1,
        bitrateIndex: 5,
        sampleRateIndex: 1,
        padding: 0
      };

      skipId3v2TagSpy.mockReturnValue(0);
      getEndPositionSpy.mockReturnValue(200);
      parseFrameHeaderSpy.mockReturnValue(header);
      isValidFrameSpy.mockReturnValueOnce(true).mockReturnValue(false);
      calculateFrameLengthSpy.mockReturnValue(100);

      const frameCount = await analyzeService.getMp3FrameCount(buffer);

      expect(frameCount).toBe(1);
      expect(parseFrameHeaderSpy).toHaveBeenCalledWith(buffer, 0);
      expect(isValidFrameSpy).toHaveBeenCalledWith(header);
      expect(calculateFrameLengthSpy).toHaveBeenCalledWith(header);
    });

    it('should count multiple valid frames', async () => {
      const buffer = Buffer.alloc(350);
      const header: Mp3Header = {
        frameSync: 0x7ff,
        mpegVersion: 3,
        layer: 1,
        bitrateIndex: 5,
        sampleRateIndex: 1,
        padding: 0
      };

      skipId3v2TagSpy.mockReturnValue(0);
      getEndPositionSpy.mockReturnValue(350);
      parseFrameHeaderSpy.mockReturnValue(header);

      // Track how many times we've returned true (valid frames)
      let validFrameReturns = 0;
      isValidFrameSpy.mockImplementation(() => {
        if (validFrameReturns < 3) {
          validFrameReturns++;
          return true;
        }
        return false; // After 3 valid frames, all subsequent are invalid
      });

      calculateFrameLengthSpy.mockReturnValue(100);

      const result = await analyzeService.getMp3FrameCount(buffer);

      expect(result).toBe(3);
    });

    it('should skip ID3v2 tag at the start', async () => {
      const buffer = Buffer.alloc(200);
      const header: Mp3Header = {
        frameSync: 0x7ff,
        mpegVersion: 3,
        layer: 1,
        bitrateIndex: 5,
        sampleRateIndex: 1,
        padding: 0
      };

      skipId3v2TagSpy.mockReturnValue(10); // Skip 10 bytes for ID3v2 tag
      getEndPositionSpy.mockReturnValue(200);
      parseFrameHeaderSpy.mockReturnValue(header);
      isValidFrameSpy.mockReturnValueOnce(true).mockReturnValue(false);
      calculateFrameLengthSpy.mockReturnValue(100);

      const frameCount = await analyzeService.getMp3FrameCount(buffer);

      expect(frameCount).toBe(1);
      expect(parseFrameHeaderSpy).toHaveBeenCalledWith(buffer, 10);
    });

    it('should not count frames that end exactly at file boundary', async () => {
      const buffer = Buffer.alloc(200);
      const header: Mp3Header = {
        frameSync: 0x7ff,
        mpegVersion: 3,
        layer: 1,
        bitrateIndex: 5,
        sampleRateIndex: 1,
        padding: 0
      };

      skipId3v2TagSpy.mockReturnValue(0);
      getEndPositionSpy.mockReturnValue(200);
      parseFrameHeaderSpy.mockReturnValue(header);
      isValidFrameSpy.mockReturnValueOnce(true).mockReturnValue(false); // First valid, then invalid to stop loop
      calculateFrameLengthSpy.mockReturnValue(200); // Frame ends exactly at boundary

      const frameCount = await analyzeService.getMp3FrameCount(buffer);

      expect(frameCount).toBe(0); // Should not count incomplete frame
    });

    it('should not count frames that extend beyond file boundary', async () => {
      const buffer = Buffer.alloc(200);
      const header: Mp3Header = {
        frameSync: 0x7ff,
        mpegVersion: 3,
        layer: 1,
        bitrateIndex: 5,
        sampleRateIndex: 1,
        padding: 0
      };

      skipId3v2TagSpy.mockReturnValue(0);
      getEndPositionSpy.mockReturnValue(200);
      parseFrameHeaderSpy.mockReturnValue(header);
      isValidFrameSpy.mockReturnValueOnce(true).mockReturnValue(false); // First valid, then invalid to stop loop
      calculateFrameLengthSpy.mockReturnValue(250); // Frame extends beyond boundary

      const frameCount = await analyzeService.getMp3FrameCount(buffer);

      expect(frameCount).toBe(0); // Should not count incomplete frame
    });

    it('should advance position by 1 byte when frame is invalid', async () => {
      const buffer = Buffer.alloc(200);
      const invalidHeader: Mp3Header = {
        frameSync: 0x7fe, // Invalid
        mpegVersion: 3,
        layer: 1,
        bitrateIndex: 5,
        sampleRateIndex: 1,
        padding: 0
      };
      const validHeader: Mp3Header = {
        frameSync: 0x7ff,
        mpegVersion: 3,
        layer: 1,
        bitrateIndex: 5,
        sampleRateIndex: 1,
        padding: 0
      };

      skipId3v2TagSpy.mockReturnValue(0);
      getEndPositionSpy.mockReturnValue(200);
      parseFrameHeaderSpy
        .mockReturnValueOnce(invalidHeader)
        .mockReturnValueOnce(invalidHeader)
        .mockReturnValueOnce(validHeader);
      isValidFrameSpy
        .mockReturnValueOnce(false) // First invalid
        .mockReturnValueOnce(false) // Second invalid
        .mockReturnValueOnce(true); // Third valid
      calculateFrameLengthSpy.mockReturnValue(100);

      const frameCount = await analyzeService.getMp3FrameCount(buffer);

      expect(frameCount).toBe(1);
      expect(parseFrameHeaderSpy).toHaveBeenCalledWith(buffer, 0);
      expect(parseFrameHeaderSpy).toHaveBeenCalledWith(buffer, 1);
      expect(parseFrameHeaderSpy).toHaveBeenCalledWith(buffer, 2);
    });

    it('should stop when position is too close to end to read header', async () => {
      const buffer = Buffer.alloc(4);
      skipId3v2TagSpy.mockReturnValue(0);
      getEndPositionSpy.mockReturnValue(4);
      // With endPosition=4, the condition is: position < 4 - 4 = position < 0
      // Since position starts at 0, 0 < 0 is false, so loop won't execute

      const frameCount = await analyzeService.getMp3FrameCount(buffer);

      expect(frameCount).toBe(0);
      expect(parseFrameHeaderSpy).not.toHaveBeenCalled();
    });

    it('should handle multiple frames with different lengths', async () => {
      const buffer = Buffer.alloc(500);
      const header1: Mp3Header = {
        frameSync: 0x7ff,
        mpegVersion: 3,
        layer: 1,
        bitrateIndex: 5,
        sampleRateIndex: 1,
        padding: 0
      };
      const header2: Mp3Header = {
        frameSync: 0x7ff,
        mpegVersion: 3,
        layer: 1,
        bitrateIndex: 9,
        sampleRateIndex: 1,
        padding: 0
      };

      skipId3v2TagSpy.mockReturnValue(0);
      getEndPositionSpy.mockReturnValue(500);

      let parseCallCount = 0;
      parseFrameHeaderSpy.mockImplementation(() => {
        parseCallCount++;
        if (parseCallCount === 1) return header1;
        if (parseCallCount === 2) return header2;
        return header1; // Default for any additional calls
      });

      isValidFrameSpy.mockReturnValueOnce(true).mockReturnValueOnce(true).mockReturnValue(false);
      calculateFrameLengthSpy
        .mockReturnValueOnce(100) // First frame
        .mockReturnValueOnce(150); // Second frame

      const frameCount = await analyzeService.getMp3FrameCount(buffer);

      expect(frameCount).toBe(2);
      expect(parseFrameHeaderSpy).toHaveBeenCalledWith(buffer, 0);
      expect(parseFrameHeaderSpy).toHaveBeenCalledWith(buffer, 100);
    });

    it('should respect end position from getEndPosition', async () => {
      const buffer = Buffer.alloc(500);
      const header: Mp3Header = {
        frameSync: 0x7ff,
        mpegVersion: 3,
        layer: 1,
        bitrateIndex: 5,
        sampleRateIndex: 1,
        padding: 0
      };

      skipId3v2TagSpy.mockReturnValue(0);
      getEndPositionSpy.mockReturnValue(200); // End position before buffer end
      parseFrameHeaderSpy.mockReturnValue(header);
      isValidFrameSpy.mockReturnValueOnce(true).mockReturnValue(false); // First valid, then invalid to stop loop
      calculateFrameLengthSpy.mockReturnValue(100);

      const frameCount = await analyzeService.getMp3FrameCount(buffer);

      expect(frameCount).toBe(1);
      // Should stop before reaching position 200
    });
  });
});
