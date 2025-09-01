import React, { useCallback, useEffect, useRef } from "react";
import { useCamera } from '../hooks/useCamera';
import { useStreamManager } from '../hooks/useStreamManager';
import type { CameraConstraints, BackgroundOptions } from '../types';
import { cn } from '../utils/cn';

interface CameraInputProps {
  constraints?: CameraConstraints;
  autoStart?: boolean;
  backgroundOptions?: BackgroundOptions;
  onStreamReady?: (stream: MediaStream) => void;
  onError?: (error: string) => void;
  className?: string;
  showControls?: boolean;
  style?: React.CSSProperties;
}

export const CameraInput: React.FC<CameraInputProps> = ({
  constraints,
  autoStart = false,
  backgroundOptions,
  onStreamReady,
  onError,
  className,
  showControls = true,
  style,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const { registerSource, orchestratedStream } = useStreamManager({
    backgroundOptions,
    onStreamReady,
  });

  const camera = useCamera({
    constraints,
    autoStart,
    onStreamReady: useCallback((stream: MediaStream) => {
      // Register camera stream with orchestrator
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        registerSource({
          kind: "video",
          element: videoRef.current,
          contentHint: "motion",
        });
      }
    }, [registerSource]),
    onError,
  });

  const handleStartCamera = useCallback(async () => {
    await camera.startCamera();
  }, [camera]);

  const handleStopCamera = useCallback(() => {
    camera.stopCamera();
  }, [camera]);

  return (
    <div className={cn("relative w-full h-full", className)} style={style}>
      {/* Hidden video element for stream orchestration */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ display: 'none' }}
      />

      {/* Permission state handling */}
      {camera.permissionState === "denied" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-4">
          <div className="text-lg font-semibold mb-2">Camera Access Denied</div>
          <div className="text-sm text-gray-300 text-center mb-4">
            Please allow camera access in your browser settings and refresh the page.
          </div>
          <button
            onClick={camera.requestPermission}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Request Permission
          </button>
        </div>
      )}

      {/* Loading state */}
      {camera.isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="flex items-center gap-2 text-white">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Starting camera...</span>
          </div>
        </div>
      )}

      {/* Error state */}
      {camera.error && !camera.isLoading && camera.permissionState !== "denied" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-4">
          <div className="text-lg font-semibold mb-2">Camera Error</div>
          <div className="text-sm text-gray-300 text-center mb-4">
            {camera.error}
          </div>
          <button
            onClick={handleStartCamera}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Controls */}
      {showControls && camera.permissionState !== "denied" && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
          {!camera.isActive ? (
            <button
              onClick={handleStartCamera}
              disabled={camera.isLoading}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-colors",
                "bg-blue-600 hover:bg-blue-700 text-white",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              )}
            >
              {camera.isLoading ? "Starting..." : "Start Camera"}
            </button>
          ) : (
            <button
              onClick={handleStopCamera}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-colors",
                "bg-red-600 hover:bg-red-700 text-white",
              )}
            >
              Stop Camera
            </button>
          )}
        </div>
      )}
    </div>
  );
};
