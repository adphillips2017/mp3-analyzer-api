/**
 * Shared MP3 parsing logic
 * Used by both AnalyzeService (for sync execution) and worker threads
 * This ensures a single source of truth for parsing logic
 */

import { BITRATES_V1_L3, SAMPLE_RATES_V1 } from '../constants/Mp3';
import { Mp3Header } from '../models/Mp3';
import {
  FRAME_SYNC_MASK,
  FRAME_SYNC_VALUE,
  FRAME_LENGTH_MULTIPLIER,
  ID3V1_IDENTIFIER,
  ID3V1_TAG_SIZE,
  ID3V2_HEADER_SIZE,
  ID3V2_IDENTIFIER,
  KBPS_TO_BPS,
  LAYER,
  MP3_FRAME_HEADER_SIZE,
  MPEG_VERSION
} from '../constants/Mp3Parsing';

/**
 * Analyze an MP3 file and return frame count
 * We assume the file is an MPEG Version 1 Audio Layer 3 (MP3).
 * - Skips ID3v2 tags at the start
 * - Excludes ID3v1 tags at the end
 * - Does not count frames that end exactly at the file boundary (considered incomplete)
 *
 * @param file - The MP3 file buffer
 * @returns Frame count (returns 0 if file is corrupted or invalid)
 * @throws Error if file buffer operations fail unexpectedly
 */
export function getMp3FrameCount(file: Buffer): number {
  try {
    let frameCount = 0;
    let position = 0;

    // Skip ID3v2 tag if present at the start of the file
    position = skipId3v2Tag(file, position);

    // Determine the end position (before ID3v1 tag if present)
    const endPosition = getEndPosition(file);

    // Keep going until we're too close to the end to read a header
    while (position < endPosition - MP3_FRAME_HEADER_SIZE) {
      // Try to parse a header at this position
      const header = parseFrameHeader(file, position);

      // Check if it's a valid MPEG v1 Layer III frame
      if (isValidFrame(header)) {
        // Calculate how long this frame is
        const frameLength = calculateFrameLength(header);
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
  } catch (error) {
    // Handle corrupted or invalid MP3 files
    // If parsing fails due to malformed data, return 0 frames
    // Re-throw unexpected errors (e.g., null/undefined buffer)
    if (error instanceof RangeError || error instanceof TypeError) {
      // Buffer access errors indicate corrupted/invalid file
      return 0;
    }
    // Re-throw other errors to be handled by caller
    throw error;
  }
}

/**
 * Skip ID3v2 tag if present at the given position
 * ID3v2 tags start with "ID3" followed by version, flags, and size
 * @param file - The MP3 file buffer
 * @param position - Starting position to check
 * @returns Position after the ID3v2 tag (or original position if no tag)
 */
function skipId3v2Tag(file: Buffer, position: number): number {
  // Check if we have enough bytes for an ID3v2 header
  if (position + ID3V2_HEADER_SIZE > file.length) {
    return position;
  }

  // Check for "ID3" identifier
  if (
    file[position] === ID3V2_IDENTIFIER.I &&
    file[position + 1] === ID3V2_IDENTIFIER.D &&
    file[position + 2] === ID3V2_IDENTIFIER.THREE
  ) {
    // Found ID3v2 tag
    // Read size from bytes 6-9 (synchsafe integer)
    const size =
      (file[position + 6] << 21) |
      (file[position + 7] << 14) |
      (file[position + 8] << 7) |
      file[position + 9];

    // ID3v2 header is 10 bytes, then the tag data
    // Some versions may have a footer, but we'll skip based on header size
    const tagEnd = position + ID3V2_HEADER_SIZE + size;

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
function getEndPosition(file: Buffer): number {
  // Check for ID3v1 tag at the end (last 128 bytes)
  if (file.length >= ID3V1_TAG_SIZE) {
    const id3v1Position = file.length - ID3V1_TAG_SIZE;
    if (
      file[id3v1Position] === ID3V1_IDENTIFIER.T &&
      file[id3v1Position + 1] === ID3V1_IDENTIFIER.A &&
      file[id3v1Position + 2] === ID3V1_IDENTIFIER.G
    ) {
      return id3v1Position;
    }
  }

  return file.length;
}

/**
 * Parse MP3 frame header from buffer at given offset
 * @param buffer - The MP3 file buffer
 * @param offset - Offset to read header from
 * @returns Parsed MP3 header
 */
export function parseFrameHeader(buffer: Buffer, offset: number): Mp3Header {
  // Check bounds before reading to prevent RangeError
  if (offset + 4 > buffer.length) {
    throw new RangeError(
      `Cannot read frame header: offset ${offset} + 4 exceeds buffer length ${buffer.length}`
    );
  }

  // Read 4 bytes as one big number
  // Big Endian means "read left to right, most significant byte first"
  const headerBytes = buffer.readUInt32BE(offset);

  // Now we need to extract specific bits from this 32-bit number
  // 11111111 11100011 00101100 00000000
  // [byte 1] [byte 2] [byte 3] [byte 4]

  // Frame sync: First 11 bits should ALL be 1s
  // We shift right 21 positions to get the top 11 bits
  const frameSync = (headerBytes >> 21) & FRAME_SYNC_MASK;

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

/**
 * Check if MP3 header represents a valid MPEG v1 Layer III frame
 * @param header - The MP3 header to validate
 * @returns True if header is valid
 */
export function isValidFrame(header: Mp3Header): boolean {
  // Frame sync must be all 1s
  if (header.frameSync !== FRAME_SYNC_VALUE) {
    return false;
  }

  // MPEG Version must be 3 (Version 1)
  // 0 = Version 2.5, 1 = reserved, 2 = Version 2, 3 = Version 1
  if (header.mpegVersion !== MPEG_VERSION.V1) {
    return false;
  }

  // Layer must be 1 (Layer III)
  // 0 = reserved, 1 = Layer III, 2 = Layer II, 3 = Layer I
  if (header.layer !== LAYER.LAYER_III) {
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

/**
 * Calculate frame length from MP3 header
 * @param header - The MP3 header
 * @returns Frame length in bytes
 */
export function calculateFrameLength(header: Mp3Header): number {
  // Get the actual bitrate value (in kbps)
  const bitrate = BITRATES_V1_L3[header.bitrateIndex];

  // Get the actual sample rate value (in Hz)
  const sampleRate = SAMPLE_RATES_V1[header.sampleRateIndex];

  // Convert bitrate from kbps to bps (bits per second)
  const bitrateInBps = bitrate * KBPS_TO_BPS;

  // The magic formula for MPEG v1 Layer III:
  // Frame Length = (144 * bitrate / sample_rate) + padding
  //
  // Why 144? It comes from:
  // - Each frame has 1152 samples
  // - 1152 samples / 8 bits per byte = 144
  const frameLength =
    Math.floor((FRAME_LENGTH_MULTIPLIER * bitrateInBps) / sampleRate) + header.padding;

  return frameLength;
}
