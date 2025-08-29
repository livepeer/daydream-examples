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
  private pendingValidations = new Map<string, AbortController>();

  private constructor() {}

  static getInstance(): StreamStabilizer {
    if (!StreamStabilizer.instance) {
      StreamStabilizer.instance = new StreamStabilizer();
    }
    return StreamStabilizer.instance;
  }

  async validateStreamStability(
    stream: MediaStream,
    options: StreamValidationOptions = {}
  ): Promise<StreamStabilizationResult> {
    const {
      minStableFrames = 5,
      timeoutMs = 3000,
      validateAudio = true,
    } = options;

    const streamId = stream.id;

    if (this.pendingValidations.has(streamId)) {
      this.pendingValidations.get(streamId)?.abort();
    }

    const abortController = new AbortController();
    this.pendingValidations.set(streamId, abortController);

    try {
      const result = await this.performValidation(
        stream,
        minStableFrames,
        timeoutMs,
        validateAudio,
        abortController.signal
      );

      this.pendingValidations.delete(streamId);
      return result;
    } catch (error) {
      this.pendingValidations.delete(streamId);
      throw error;
    }
  }

  private async performValidation(
    stream: MediaStream,
    minStableFrames: number,
    timeoutMs: number,
    validateAudio: boolean,
    signal: AbortSignal
  ): Promise<StreamStabilizationResult> {
    const startTime = Date.now();
    let frameCount = 0;
    let lastFrameTime = 0;

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

    const videoTrack = videoTracks[0];
    if (videoTrack.readyState !== "live") {
      return {
        isStable: false,
        frameCount: 0,
        timeElapsed: 0,
        error: `Video track not live: ${videoTrack.readyState}`,
      };
    }

    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.srcObject = stream;

    return new Promise<StreamStabilizationResult>((resolve) => {
      const timeout = setTimeout(() => {
        cleanup();
        resolve({
          isStable: false,
          frameCount,
          timeElapsed: Date.now() - startTime,
          error: "Validation timeout",
        });
      }, timeoutMs);

      const cleanup = () => {
        clearTimeout(timeout);
        video.removeEventListener("timeupdate", onTimeUpdate);
        video.srcObject = null;
        video.remove();
      };

      const onTimeUpdate = () => {
        if (signal.aborted) {
          cleanup();
          resolve({
            isStable: false,
            frameCount,
            timeElapsed: Date.now() - startTime,
            error: "Validation aborted",
          });
          return;
        }

        const currentTime = video.currentTime;
        if (currentTime !== lastFrameTime) {
          frameCount++;
          lastFrameTime = currentTime;

          if (frameCount >= minStableFrames) {
            cleanup();
            resolve({
              isStable: true,
              frameCount,
              timeElapsed: Date.now() - startTime,
            });
          }
        }
      };

      video.addEventListener("timeupdate", onTimeUpdate);
      video.play().catch(() => {
        cleanup();
        resolve({
          isStable: false,
          frameCount: 0,
          timeElapsed: Date.now() - startTime,
          error: "Failed to play video for validation",
        });
      });
    });
  }

  async waitForCanvasStreamStability(
    canvas: HTMLCanvasElement,
    fps: number = 30
  ): Promise<boolean> {
    const frameInterval = 1000 / fps;
    const waitTime = Math.max(frameInterval * 2, 100);

    await new Promise((resolve) => setTimeout(resolve, waitTime));

    try {
      const ctx = canvas.getContext("2d");
      if (!ctx) return false;

      const imageData = ctx.getImageData(0, 0, 1, 1);
      return imageData.data.some((value) => value > 0);
    } catch (error) {
      return false;
    }
  }

  cancelAllValidations(): void {
    for (const [, controller] of this.pendingValidations) {
      controller.abort();
    }
    this.pendingValidations.clear();
  }

  cancelValidation(streamId: string): void {
    const controller = this.pendingValidations.get(streamId);
    if (controller) {
      controller.abort();
      this.pendingValidations.delete(streamId);
    }
  }
}

export const streamStabilizer = StreamStabilizer.getInstance();

export async function createStableCanvasStream(
  canvas: HTMLCanvasElement,
  fps: number = 30,
  options: StreamValidationOptions = {}
): Promise<{
  stream: MediaStream;
  validationResult: StreamStabilizationResult;
}> {
  await streamStabilizer.waitForCanvasStreamStability(canvas, fps);

  const stream = canvas.captureStream(fps);

  const validationResult = await streamStabilizer.validateStreamStability(
    stream,
    {
      minStableFrames: 3,
      timeoutMs: 2000,
      ...options,
    }
  );

  return { stream, validationResult };
}

export function logStreamValidation(
  result: StreamStabilizationResult,
  context: string
): void {
  // Development logging - only in browser console for now
  console.log(`[Stream Validation - ${context}]`, result);
}
