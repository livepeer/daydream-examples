import React, { useCallback, useEffect, useRef } from "react";
import { useScreenShare } from '../hooks/useScreenShare';
import { useStreamManager } from '../hooks/useStreamManager';
import type { ScreenShareConstraints, BackgroundOptions } from '../types';
import { cn } from '../utils/cn';

interface ScreenShareInputProps {
  constraints?: ScreenShareConstraints;
  backgroundOptions?: BackgroundOptions;
  onStreamReady?: (stream: MediaStream) => void;
  onError?: (error: string) => void;
  onStreamEnded?: () => void;
  className?: string;
  showControls?: boolean;
  style?: React.CSSProperties;
}

export const ScreenShareInput: React.FC<ScreenShareInputProps> = ({
  constraints,
  backgroundOptions,
  onStreamReady,
  onError,
  onStreamEnded,
  className,
  showControls = true,
  style,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const { registerSource, orchestratedStream } = useStreamManager({
    backgroundOptions,
    onStreamReady,
  });

  const screenShare = useScreenShare({
    constraints,
    onStreamReady: useCallback((stream: MediaStream) => {
      // Register screen share stream with orchestrator
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        registerSource({
          kind: "video",
          element: videoRef.current,
          contentHint: "detail", // Screen content usually benefits from detail hint
        });
      }
    }, [registerSource]),
    onError,
    onStreamEnded,
  });

  const handleStartScreenShare = useCallback(async () => {
    await screenShare.startScreenShare();
  }, [screenShare]);

  const handleStopScreenShare = useCallback(() => {
    screenShare.stopScreenShare();
  }, [screenShare]);

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
      {screenShare.permissionState === "denied" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-4">
          <div className="text-lg font-semibold mb-2">Screen Share Access Denied</div>
          <div className="text-sm text-gray-300 text-center mb-4">
            Please allow screen sharing access when prompted by your browser.
          </div>
          <button
            onClick={screenShare.requestPermission}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Request Permission
          </button>
        </div>
      )}

      {/* Loading state */}
      {screenShare.isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="flex items-center gap-2 text-white">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Starting screen share...</span>
          </div>
        </div>
      )}

      {/* Error state */}
      {screenShare.error && !screenShare.isLoading && screenShare.permissionState !== "denied" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-4">
          <div className="text-lg font-semibold mb-2">Screen Share Error</div>
          <div className="text-sm text-gray-300 text-center mb-4">
            {screenShare.error}
          </div>
          <button
            onClick={handleStartScreenShare}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Controls */}
      {showControls && screenShare.permissionState !== "denied" && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
          {!screenShare.isActive ? (
            <button
              onClick={handleStartScreenShare}
              disabled={screenShare.isLoading}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-colors",
                "bg-green-600 hover:bg-green-700 text-white",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              )}
            >
              {screenShare.isLoading ? "Starting..." : "Share Screen"}
            </button>
          ) : (
            <button
              onClick={handleStopScreenShare}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-colors",
                "bg-red-600 hover:bg-red-700 text-white",
              )}
            >
              Stop Sharing
            </button>
          )}
        </div>
      )}
    </div>
  );
};
