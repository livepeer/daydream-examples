import { useCallback, useEffect, useRef } from "react";
import { STREAMING_CONFIG } from "../lib/streamingConfig";

interface UseBackgroundStreamingOptions {
  onBackgroundFrame?: () => void;
  fps?: number;
  enabled?: boolean;
  canvas?: HTMLCanvasElement | null;
  stream?: MediaStream | null;
}

interface BackgroundStreamingHook {
  isBackgroundStreaming: boolean;
  startBackgroundStreaming: () => void;
  stopBackgroundStreaming: () => void;
}

export const useBackgroundStreaming = ({
  onBackgroundFrame,
  fps = STREAMING_CONFIG.FPS,
  enabled = true,
  canvas,
  stream,
}: UseBackgroundStreamingOptions): BackgroundStreamingHook => {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isStreamingRef = useRef(false);

  const startBackgroundStreaming = useCallback(() => {
    if (!enabled || !canvas || !stream || isStreamingRef.current) return;

    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return;

    isStreamingRef.current = true;

    intervalRef.current = setInterval(() => {
      if (onBackgroundFrame) {
        onBackgroundFrame();
      } else {
        // Default background frame rendering
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const time = Date.now();
          const flickerValue = Math.floor((Math.sin(time * 0.01) + 1) * 127.5);
          ctx.fillStyle = `rgba(${flickerValue}, ${flickerValue}, ${flickerValue}, 0.01)`;
          ctx.fillRect(canvas.width - 1, canvas.height - 1, 1, 1);
        }
      }

      // Request frame if available (Chrome-specific optimization)
      if (
        "requestFrame" in videoTrack &&
        typeof (videoTrack as any).requestFrame === "function"
      ) {
        (videoTrack as any).requestFrame();
      }
    }, 1000 / fps);
  }, [enabled, canvas, stream, onBackgroundFrame, fps]);

  const stopBackgroundStreaming = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    isStreamingRef.current = false;
  }, []);

  const handleVisibilityChange = useCallback(() => {
    if (!enabled) return;

    if (document.hidden) {
      startBackgroundStreaming();
    } else {
      stopBackgroundStreaming();
    }
  }, [enabled, startBackgroundStreaming, stopBackgroundStreaming]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stopBackgroundStreaming();
    };
  }, [enabled, handleVisibilityChange, stopBackgroundStreaming]);

  useEffect(() => {
    return () => {
      stopBackgroundStreaming();
    };
  }, [stopBackgroundStreaming]);

  return {
    isBackgroundStreaming: isStreamingRef.current,
    startBackgroundStreaming,
    stopBackgroundStreaming,
  };
};
