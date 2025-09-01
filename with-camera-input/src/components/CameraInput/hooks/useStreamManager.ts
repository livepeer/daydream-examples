import { useCallback, useEffect, useRef, useState } from "react";
import type { StreamSource, BackgroundOptions } from '../types';
import { streamOrchestrator } from '../utils/streamOrchestrator';

type InputMode = "camera" | "screenshare" | "none";

interface UseStreamManagerOptions {
  backgroundOptions?: BackgroundOptions;
  onStreamReady?: (stream: MediaStream) => void;
}

export const useStreamManager = ({
  backgroundOptions,
  onStreamReady,
}: UseStreamManagerOptions = {}) => {
  const [inputMode, setInputMode] = useState<InputMode>("none");
  const [isLoading, setIsLoading] = useState(false);
  const currentStreamRef = useRef<MediaStream | null>(null);

  const registerSource = useCallback((source: StreamSource) => {
    streamOrchestrator.setSource(source);
    const orchestratedStream = streamOrchestrator.getStream();
    
    if (orchestratedStream && onStreamReady) {
      onStreamReady(orchestratedStream);
    }
  }, [onStreamReady]);

  const switchToCamera = useCallback(() => {
    setInputMode("camera");
    setIsLoading(true);
  }, []);

  const switchToScreenShare = useCallback(() => {
    setInputMode("screenshare");
    setIsLoading(true);
  }, []);

  const stopStreaming = useCallback(() => {
    setInputMode("none");
    setIsLoading(false);
    streamOrchestrator.stop();
  }, []);

  const getOrchestrator = useCallback(() => {
    return streamOrchestrator;
  }, []);

  const getOutputCanvas = useCallback(() => {
    return streamOrchestrator.getStream();
  }, []);

  // Set background options on orchestrator
  useEffect(() => {
    if (backgroundOptions) {
      streamOrchestrator.setBackgroundOptions(backgroundOptions);
    }
  }, [backgroundOptions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      streamOrchestrator.destroy();
    };
  }, []);

  return {
    inputMode,
    isLoading,
    setIsLoading,
    registerSource,
    switchToCamera,
    switchToScreenShare,
    stopStreaming,
    getOrchestrator,
    getOutputCanvas,
    orchestratedStream: streamOrchestrator.getStream(),
  };
};
