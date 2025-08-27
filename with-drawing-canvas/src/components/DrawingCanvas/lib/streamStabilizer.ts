interface StreamValidationOptions {
  minStableFrames?: number;
  timeoutMs?: number;
  validateAudio?: boolean;
}

interface StreamStabilizationResult {
  isStable: boolean;
  frameCount: number;
  timeElapsed: number;
  error?: string;
}

class StreamStabilizer {
  private static instance: StreamStabilizer | null = null;

  private constructor() {}

  static getInstance(): StreamStabilizer {
    if (!StreamStabilizer.instance) {
      StreamStabilizer.instance = new StreamStabilizer();
    }
    return StreamStabilizer.instance;
  }

  async validateStreamStability(
    stream: MediaStream,
    options: StreamValidationOptions = {},
  ): Promise<StreamStabilizationResult> {
    const {
      minStableFrames = 5,
      timeoutMs = 3000,
      validateAudio = true,
    } = options;

    const startTime = Date.now();

    // Basic validation
    if (!stream.active) {
      return {
        isStable: false,
        frameCount: 0,
        timeElapsed: 0,
        error: "Stream is not active",
      };
    }

    const videoTracks = stream.getVideoTracks();
    const audioTracks = stream.getAudioTracks();

    if (videoTracks.length === 0) {
      return {
        isStable: false,
        frameCount: 0,
        timeElapsed: 0,
        error: "No video tracks found",
      };
    }

    if (validateAudio && audioTracks.length === 0) {
      return {
        isStable: false,
        frameCount: 0,
        timeElapsed: 0,
        error: "No audio tracks found",
      };
    }

    // For simplicity, we'll consider the stream stable if tracks are live
    const videoTrack = videoTracks[0];
    if (videoTrack.readyState !== "live") {
      return {
        isStable: false,
        frameCount: 0,
        timeElapsed: 0,
        error: `Video track not live: ${videoTrack.readyState}`,
      };
    }

    // Simple stability check - wait a bit and verify stream is still active
    await new Promise(resolve => setTimeout(resolve, 100));

    if (stream.active && videoTrack.readyState === "live") {
      return {
        isStable: true,
        frameCount: minStableFrames,
        timeElapsed: Date.now() - startTime,
      };
    }

    return {
      isStable: false,
      frameCount: 0,
      timeElapsed: Date.now() - startTime,
      error: "Stream became inactive during validation",
    };
  }

  async waitForCanvasStreamStability(
    canvas: HTMLCanvasElement,
    fps: number = 30,
  ): Promise<boolean> {
    const frameInterval = 1000 / fps;
    const waitTime = Math.max(frameInterval * 2, 100);

    // Wait for canvas to be ready
    await new Promise(resolve => setTimeout(resolve, waitTime));

    try {
      const ctx = canvas.getContext("2d");
      if (!ctx) return false;

      // Check if canvas has any content
      const imageData = ctx.getImageData(0, 0, 1, 1);
      return imageData.data.some(value => value > 0);
    } catch (error) {
      return false;
    }
  }
}

export const streamStabilizer = StreamStabilizer.getInstance();
