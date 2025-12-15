export interface Mp3Header {
  frameSync: number;
  mpegVersion: number;
  layer: number;
  bitrateIndex: number;
  sampleRateIndex: number;
  padding: number;
}
