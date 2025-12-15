/**
 *
 * Mp3 File Structure:
 *
 *  - Made up of individual frames
 *  - Each frame has its own header and data block
 *  - Header includes:
 *    - Frame sync: first 11 bits, all 1's
 *    - mp3 version
 *    - layer
 *    - error protection
 *    - bitrate
 *    - frequency
 *    - padding bits
 *    - etc.
 *
 *    https://en.wikipedia.org/wiki/MP3#File_structure
 *
 */

import { BITRATES_V1_L3, Mp3Header, SAMPLE_RATES_V1 } from '../models/Mp3';

class AnalyzeService {
  /**
   * Analyze an MP3 file and return frame count
   * We assume the file is an MPEG Version 1 Audio Layer 3 (MP3).
   * - Skips ID3v2 tags at the start
   * - Excludes ID3v1 tags at the end
   * - Does not count frames that end exactly at the file boundary (considered incomplete)
   * @param file - The MP3 file
   * @returns Frame count
   */
  getMp3FrameCount(file: Buffer): number {
    let frameCount = 0;
    let position = 0;

    // Skip ID3v2 tag if present at the start of the file
    position = this.skipId3v2Tag(file, position);

    // Determine the end position (before ID3v1 tag if present)
    const endPosition = this.getEndPosition(file);

    // Keep going until we're too close to the end to read a header
    while (position < endPosition - 4) {
      // Try to parse a header at this position
      const header = this.parseFrameHeader(file, position);

      // Check if it's a valid MPEG v1 Layer III frame
      if (this.isValidFrame(header)) {
        // Calculate how long this frame is
        const frameLength = this.calculateFrameLength(header);
        const nextPosition = position + frameLength;

        // Key fix: Don't count frames that end exactly at or extend beyond the file boundary
        // MediaInfo considers these incomplete. This fixes the off-by-one issue.
        if (nextPosition >= endPosition) {
          break;
        }

        // It's valid! Count it
        frameCount++;

        // Jump ahead to where the next frame should start
        position = nextPosition;
      } else {
        // Not a valid frame, move forward 1 byte and keep searching
        position++;
      }
    }

    return frameCount;
  }

  /**
   * Skip ID3v2 tag if present at the given position
   * ID3v2 tags start with "ID3" followed by version, flags, and size
   * @param file - The MP3 file buffer
   * @param position - Starting position to check
   * @returns Position after the ID3v2 tag (or original position if no tag)
   */
  private skipId3v2Tag(file: Buffer, position: number): number {
    // Check if we have enough bytes for an ID3v2 header (at least 10 bytes)
    if (position + 10 > file.length) {
      return position;
    }

    // Check for "ID3" identifier
    if (file[position] === 0x49 && file[position + 1] === 0x44 && file[position + 2] === 0x33) {
      // Found ID3v2 tag
      // Read size from bytes 6-9 (synchsafe integer)
      const size =
        (file[position + 6] << 21) |
        (file[position + 7] << 14) |
        (file[position + 8] << 7) |
        file[position + 9];

      // ID3v2 header is 10 bytes, then the tag data
      // Some versions may have a footer, but we'll skip based on header size
      const tagEnd = position + 10 + size;

      return tagEnd;
    }

    return position;
  }

  /**
   * Get the end position for frame parsing (before ID3v1 tag if present)
   * ID3v1 tags are 128 bytes at the end of the file
   * @param file - The MP3 file buffer
   * @returns End position for frame parsing
   */
  private getEndPosition(file: Buffer): number {
    // Check for ID3v1 tag at the end (last 128 bytes)
    if (file.length >= 128) {
      const id3v1Position = file.length - 128;
      if (
        file[id3v1Position] === 0x54 &&     // 'T'
        file[id3v1Position + 1] === 0x41 && // 'A'
        file[id3v1Position + 2] === 0x47    // 'G'
      ) {
        return id3v1Position;
      }
    }

    return file.length;
  }

  parseFrameHeader(buffer: Buffer, offset: number): Mp3Header {
    // Read 4 bytes as one big number
    // Big Endian means "read left to right, most significant byte first"
    const headerBytes = buffer.readUInt32BE(offset);

    // Now we need to extract specific bits from this 32-bit number
    // 11111111 11100011 00101100 00000000
    // [byte 1] [byte 2] [byte 3] [byte 4]

    // Frame sync: First 11 bits should ALL be 1s
    // We shift right 21 positions to get the top 11 bits
    const frameSync = (headerBytes >> 21) & 0x7ff; // 0x7FF = 11111111111 in binary

    // MPEG Version: Next 2 bits (bits 20-19)
    const mpegVersion = (headerBytes >> 19) & 0x03; // 0x03 = 11 in binary (2 bits)

    // Layer: Next 2 bits (bits 18-17)
    const layer = (headerBytes >> 17) & 0x03;

    // Bitrate Index: Next 4 bits (bits 15-12)
    const bitrateIndex = (headerBytes >> 12) & 0x0f; // 0x0F = 1111 in binary (4 bits)

    // Sample Rate Index: Next 2 bits (bits 11-10)
    const sampleRateIndex = (headerBytes >> 10) & 0x03;

    // Padding: Next 1 bit (bit 9)
    const padding = (headerBytes >> 9) & 0x01;

    return {
      frameSync,
      mpegVersion,
      layer,
      bitrateIndex,
      sampleRateIndex,
      padding
    };
  }

  isValidFrame(header: Mp3Header): boolean {
    // Frame sync must be all 1s (0x7FF = 2047 in decimal)
    if (header.frameSync !== 0x7ff) {
      return false;
    }

    // MPEG Version must be 3 (Version 1)
    // 0 = Version 2.5, 1 = reserved, 2 = Version 2, 3 = Version 1
    if (header.mpegVersion !== 3) {
      return false;
    }

    // Layer must be 1 (Layer III)
    // 0 = reserved, 1 = Layer III, 2 = Layer II, 3 = Layer I
    if (header.layer !== 1) {
      return false;
    }

    // Bitrate index can't be 0 (free format) or 15 (invalid)
    if (header.bitrateIndex === 0 || header.bitrateIndex === 15) {
      return false;
    }

    // Sample rate index can't be 3 (reserved)
    if (header.sampleRateIndex === 3) {
      return false;
    }

    return true;
  }

  calculateFrameLength(header: Mp3Header): number {
    // Get the actual bitrate value (in kbps)
    const bitrate = BITRATES_V1_L3[header.bitrateIndex];

    // Get the actual sample rate value (in Hz)
    const sampleRate = SAMPLE_RATES_V1[header.sampleRateIndex];

    // Convert bitrate from kbps to bps (bits per second)
    const bitrateInBps = bitrate * 1000;

    // The magic formula for MPEG v1 Layer III:
    // Frame Length = (144 * bitrate / sample_rate) + padding
    //
    // Why 144? It comes from:
    // - Each frame has 1152 samples
    // - 1152 samples / 8 bits per byte = 144
    const frameLength = Math.floor((144 * bitrateInBps) / sampleRate) + header.padding;

    return frameLength;
  }
}

export default new AnalyzeService();
