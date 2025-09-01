import { useCallback, useEffect, useRef, useState } from "react";
import type { ScreenShareConstraints, MediaInputState, PermissionState } from '../types';
import { STREAMING_CONFIG } from '../utils/streamingConfig';

interface UseScreenShareOptions {
  constraints?: ScreenShareConstraints;
  onStreamReady?: (stream: MediaStream) => void;
  onError?: (error: string) => void;
  onStreamEnded?: () => void;
}

export const useScreenShare = ({
  constraints,
  onStreamReady,
  onError,
  onStreamEnded,
}: UseScreenShareOptions = {}) => {
  const [state, setState] = useState<MediaInputState>({
    isActive: false,
    isLoading: false,
    stream: null,
    error: null,
  });

  const [permissionState, setPermissionState] = useState<PermissionState["screenShare"]>("prompt");
  const streamRef = useRef<MediaStream | null>(null);

  const mergedConstraints = {
    ...STREAMING_CONFIG.DEFAULT_SCREENSHARE_CONSTRAINTS,
    ...constraints,
  };

  const stopScreenShare = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setState((prev: MediaInputState) => ({
      ...prev,
      isActive: false,
      stream: null,
      error: null,
    }));
  }, []);

  const startScreenShare = useCallback(async () => {
    setState((prev: MediaInputState) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Stop existing stream first
      stopScreenShare();

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: mergedConstraints,
      });

      // Listen for the user ending the screen share
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.addEventListener('ended', () => {
          stopScreenShare();
          if (onStreamEnded) {
            onStreamEnded();
          }
        });
      }

      streamRef.current = stream;
      setPermissionState("granted");
      
      setState({
        isActive: true,
        isLoading: false,
        stream,
        error: null,
      });

      if (onStreamReady) {
        onStreamReady(stream);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to access screen share";
      
      if (error instanceof Error && error.name === "NotAllowedError") {
        setPermissionState("denied");
      }

      setState((prev: MediaInputState) => ({
        ...prev,
        isActive: false,
        isLoading: false,
        error: errorMessage,
      }));

      if (onError) {
        onError(errorMessage);
      }
    }
  }, [mergedConstraints, stopScreenShare, onStreamReady, onError, onStreamEnded]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      stream.getTracks().forEach(track => track.stop()); // Stop immediately, just checking permission
      setPermissionState("granted");
      return true;
    } catch (error) {
      if (error instanceof Error && error.name === "NotAllowedError") {
        setPermissionState("denied");
      }
      return false;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopScreenShare();
    };
  }, [stopScreenShare]);

  return {
    ...state,
    permissionState,
    startScreenShare,
    stopScreenShare,
    requestPermission,
  };
};
