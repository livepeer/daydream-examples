import { useCallback, useEffect, useRef } from "react";

interface UseBackgroundStreamingOptions {
  onBackgroundFrame?: () => void;
  fps?: number;
  enabled?: boolean;
}

interface BackgroundStreamingHook {
  isBackgroundStreaming: boolean;
  startBackgroundStreaming: () => void;
  stopBackgroundStreaming: () => void;
}

export const useBackgroundStreaming = ({
  onBackgroundFrame,
  fps = 30,
  enabled = true,
}: UseBackgroundStreamingOptions): BackgroundStreamingHook => {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isStreamingRef = useRef(false);

  const startBackgroundStreaming = useCallback(() => {
    if (!enabled || isStreamingRef.current) return;

    isStreamingRef.current = true;
    const frameInterval = 1000 / fps;

    intervalRef.current = setInterval(() => {
      if (onBackgroundFrame) {
        onBackgroundFrame();
      }
    }, frameInterval);
  }, [enabled, fps, onBackgroundFrame]);

  const stopBackgroundStreaming = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    isStreamingRef.current = false;
  }, []);

  useEffect(() => {
    if (enabled) {
      startBackgroundStreaming();
    } else {
      stopBackgroundStreaming();
    }

    return () => {
      stopBackgroundStreaming();
    };
  }, [enabled, startBackgroundStreaming, stopBackgroundStreaming]);

  return {
    isBackgroundStreaming: isStreamingRef.current,
    startBackgroundStreaming,
    stopBackgroundStreaming,
  };
};
