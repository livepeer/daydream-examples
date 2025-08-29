export const STREAMING_CONFIG = {
  WIDTH: 512,
  HEIGHT: 512,
  FPS: 30,
  // Bitrate settings for streams
  VIDEO_BITRATE: 2000000, // 2.0 Mbps
  AUDIO_BITRATE: 128000, // 128 kbps

  // Encoding consistency settings
  ENABLE_COMPLEXITY_INJECTION: true,
  TARGET_COMPLEXITY: 0.3,
  MIN_COMPLEXITY_THRESHOLD: 0.15,
  MAX_COMPLEXITY_INJECTION: 0.2,

  // Advanced encoding parameters for consistent quality
  KEYFRAME_INTERVAL: 2,
  MIN_QUANTIZER: 10,
  MAX_QUANTIZER: 51,
  RATE_CONTROL_MODE: "CBR",

  // Buffer settings for smoother encoding
  ENCODER_BUFFER_SIZE: 1000, // ms
  INITIAL_BUFFER_OCCUPANCY: 500, // ms
};

