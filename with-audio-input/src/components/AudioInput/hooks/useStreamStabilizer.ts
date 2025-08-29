import { useCallback, useRef } from "react";
import { streamStabilizer } from "../utils/streamStabilizer";
import { createSilentAudioTrack } from "../utils/audioTrackManager";
import { STREAMING_CONFIG } from "../config/streamingConfig";

export interface UseStreamStabilizerOptions {
  onStreamReady?: (stream: MediaStream) => void;
  fps?: number;
  validateAudio?: boolean;
}

export function useStreamStabilizer(
  canvasRef: { current: HTMLCanvasElement | null },
  options: UseStreamStabilizerOptions = {}
) {
  const {
    onStreamReady,
    fps = STREAMING_CONFIG.FPS,
    validateAudio: _validateAudio = false,
  } = options;

  const streamRef = useRef<MediaStream | null>(null);
  const streamCreatedRef = useRef(false);

  const createStream = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || streamCreatedRef.current) return null;

    try {
      await streamStabilizer.waitForCanvasStreamStability(canvas, fps);

      const stream = canvas.captureStream(fps);

      const validationResult = await streamStabilizer.validateStreamStability(
        stream,
        {
          minStableFrames: 3,
          timeoutMs: 2000,
          validateAudio: false, // We'll add audio track separately
        }
      );

      // Add silent audio track for compatibility
      const audioTrack = createSilentAudioTrack();
      stream.addTrack(audioTrack);

      streamRef.current = stream;
      streamCreatedRef.current = true;

      if (onStreamReady && validationResult.isStable) {
        onStreamReady(stream);
      } else if (onStreamReady && !validationResult.isStable) {
        // Retry after a delay if stream isn't stable
        setTimeout(() => {
          if (streamRef.current && streamRef.current.active) {
            onStreamReady(streamRef.current);
          }
        }, 1000);
      }

      return stream;
    } catch (error) {
      console.error("Failed to create stable stream:", error);
      streamCreatedRef.current = false;
      return null;
    }
  }, [canvasRef, onStreamReady, fps]);

  const getStream = useCallback(() => {
    return streamRef.current;
  }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    streamCreatedRef.current = false;
  }, []);

  return {
    createStream,
    getStream,
    stopStream,
    streamRef,
  };
}
