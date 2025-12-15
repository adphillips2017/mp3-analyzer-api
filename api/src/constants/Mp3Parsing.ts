/**
 * MP3 file parsing constants
 * These are technical constants related to MP3 file format specifications
 */

// ID3v2 tag identifier bytes ('ID3')
export const ID3V2_IDENTIFIER = {
  I: 0x49, // 'I'
  D: 0x44, // 'D'
  THREE: 0x33 // '3'
} as const;

// ID3v2 header size in bytes
export const ID3V2_HEADER_SIZE = 10;

// ID3v1 tag identifier bytes ('TAG')
export const ID3V1_IDENTIFIER = {
  T: 0x54, // 'T'
  A: 0x41, // 'A'
  G: 0x47 // 'G'
} as const;

// ID3v1 tag size in bytes (always 128 bytes at the end of file)
export const ID3V1_TAG_SIZE = 128;

// MP3 frame header size in bytes
export const MP3_FRAME_HEADER_SIZE = 4;

// Frame sync value (first 11 bits all set to 1)
// 0x7FF = 11111111111 in binary = 2047 in decimal
export const FRAME_SYNC_VALUE = 0x7ff;

// Frame sync mask (11 bits)
export const FRAME_SYNC_MASK = 0x7ff;

// MPEG version constants
export const MPEG_VERSION = {
  V2_5: 0,
  RESERVED: 1,
  V2: 2,
  V1: 3 // MPEG Version 1 (what we support)
} as const;

// Layer constants
export const LAYER = {
  RESERVED: 0,
  LAYER_III: 1, // Layer III (what we support)
  LAYER_II: 2,
  LAYER_I: 3
} as const;

// Frame length calculation constant
// Each MPEG-1 Layer III frame contains 1152 samples
// 1152 samples / 8 bits per byte = 144
export const FRAME_LENGTH_MULTIPLIER = 144;

// Samples per frame for MPEG-1 Layer III
export const SAMPLES_PER_FRAME = 1152;

// Bits per byte
export const BITS_PER_BYTE = 8;

// Bitrate conversion: kbps to bps
export const KBPS_TO_BPS = 1000;
