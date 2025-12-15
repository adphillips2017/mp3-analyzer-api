// For MPEG Version 1, Layer III
// Index 0 means "free format" (variable), 15 means invalid
// Indices 1-14 give us these bitrates in kbps (kilobits per second)
export const BITRATES_V1_L3 = [
  0, // 0 - free format
  32, // 1
  40, // 2
  48, // 3
  56, // 4
  64, // 5
  80, // 6
  96, // 7
  112, // 8
  128, // 9
  160, // 10
  192, // 11
  224, // 12
  256, // 13
  320, // 14
  -1 // 15 - invalid
];

// For MPEG Version 1
// These are in Hz (samples per second)
export const SAMPLE_RATES_V1 = [
  44100, // 0
  48000, // 1
  32000, // 2
  -1 // 3 - reserved/invalid
];
