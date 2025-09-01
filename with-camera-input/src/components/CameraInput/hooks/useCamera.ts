import { useCallback, useEffect, useRef, useState } from "react";
import type { CameraConstraints, MediaInputState, PermissionState } from '../types';
import { STREAMING_CONFIG } from '../utils/streamingConfig';

interface UseCameraOptions {
  constraints?: CameraConstraints;
  autoStart?: boolean;
  onStreamReady?: (stream: MediaStream) => void;
  onError?: (error: string) => void;
}

export const useCamera = ({
  constraints,
  autoStart = false,
  onStreamReady,
  onError,
}: UseCameraOptions = {}) => {
  const [state, setState] = useState<MediaInputState>({
    isActive: false,
    isLoading: false,
    stream: null,
    error: null,
  });

  const [permissionState, setPermissionState] = useState<PermissionState["camera"]>("prompt");
  const streamRef = useRef<MediaStream | null>(null);

  const mergedConstraints = {
    ...STREAMING_CONFIG.DEFAULT_CAMERA_CONSTRAINTS,
    ...constraints,
  };

  const stopCamera = useCallback(() => {
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

  const startCamera = useCallback(async () => {
    setState((prev: MediaInputState) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Stop existing stream first
      stopCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: mergedConstraints,
      });

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
      const errorMessage = error instanceof Error ? error.message : "Failed to access camera";
      
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
  }, [mergedConstraints, stopCamera, onStreamReady, onError]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setPermissionState("granted");
      return true;
    } catch (error) {
      if (error instanceof Error && error.name === "NotAllowedError") {
        setPermissionState("denied");
      }
      return false;
    }
  }, []);

  const checkPermission = useCallback(async () => {
    try {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      setPermissionState(result.state as PermissionState["camera"]);
      
      result.addEventListener('change', () => {
        setPermissionState(result.state as PermissionState["camera"]);
      });
    } catch (error) {
      // Permissions API not supported, rely on getUserMedia
    }
  }, []);

  useEffect(() => {
    checkPermission();
    
    if (autoStart) {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, []);

  return {
    ...state,
    permissionState,
    startCamera,
    stopCamera,
    requestPermission,
  };
};
