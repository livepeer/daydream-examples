import React, { useCallback, useEffect, useRef, useState } from "react";
import { useCamera } from '../hooks/useCamera';
import { useScreenShare } from '../hooks/useScreenShare';
import { useStreamManager } from '../hooks/useStreamManager';
import { CameraPreview } from './CameraPreview';
import type { CameraConstraints, ScreenShareConstraints, BackgroundOptions } from '../types';
import { cn } from '../utils/cn';

interface MultiInputPreviewProps {
  cameraConstraints?: CameraConstraints;
  screenShareConstraints?: ScreenShareConstraints;
  backgroundOptions?: BackgroundOptions;
  onStreamReady?: (stream: MediaStream) => void;
  onError?: (error: string) => void;
  className?: string;
  showControls?: boolean;
  autoStartCamera?: boolean;
  style?: React.CSSProperties;
}

export const MultiInputPreview: React.FC<MultiInputPreviewProps> = ({
  cameraConstraints,
  screenShareConstraints,
  backgroundOptions,
  onStreamReady,
  onError,
  className,
  showControls = true,
  autoStartCamera = true,
  style,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentMode, setCurrentMode] = useState<"camera" | "screenshare" | "none">("none");

  const { 
    registerSource, 
    orchestratedStream,
    isLoading: switchingMode,
    setIsLoading: setSwitchingMode
  } = useStreamManager({
    backgroundOptions,
    onStreamReady,
  });

  const camera = useCamera({
    constraints: cameraConstraints,
    autoStart: autoStartCamera,
    onStreamReady: useCallback((stream: MediaStream) => {
      if (videoRef.current && currentMode === "camera") {
        videoRef.current.srcObject = stream;
        registerSource({
          kind: "video",
          element: videoRef.current,
          contentHint: "motion",
        });
        setSwitchingMode(false);
      }
    }, [registerSource, currentMode, setSwitchingMode]),
    onError,
  });

  const screenShare = useScreenShare({
    constraints: screenShareConstraints,
    onStreamReady: useCallback((stream: MediaStream) => {
      if (videoRef.current && currentMode === "screenshare") {
        videoRef.current.srcObject = stream;
        registerSource({
          kind: "video",
          element: videoRef.current,
          contentHint: "detail",
        });
        setSwitchingMode(false);
      }
    }, [registerSource, currentMode, setSwitchingMode]),
    onError,
    onStreamEnded: useCallback(() => {
      // When screen share ends, switch back to camera
      setCurrentMode("camera");
      setSwitchingMode(true);
      camera.startCamera();
    }, [camera, setSwitchingMode]),
  });

  const switchToCamera = useCallback(async () => {
    if (currentMode === "camera") return;
    
    setSwitchingMode(true);
    setCurrentMode("camera");
    
    // Stop screen share first
    screenShare.stopScreenShare();
    
    // Start camera
    await camera.startCamera();
  }, [currentMode, camera, screenShare, setSwitchingMode]);

  const switchToScreenShare = useCallback(async () => {
    if (currentMode === "screenshare") return;
    
    setSwitchingMode(true);
    setCurrentMode("screenshare");
    
    // Stop camera first
    camera.stopCamera();
    
    // Start screen share
    await screenShare.startScreenShare();
  }, [currentMode, camera, screenShare, setSwitchingMode]);

  // Initialize with camera if autoStart is enabled
  useEffect(() => {
    if (autoStartCamera && currentMode === "none") {
      setCurrentMode("camera");
    }
  }, [autoStartCamera, currentMode]);

  const currentStream = currentMode === "camera" ? camera.stream : screenShare.stream;
  const isLoading = camera.isLoading || screenShare.isLoading || switchingMode;
  const hasError = camera.error || screenShare.error;
  const isActive = camera.isActive || screenShare.isActive;

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

      {/* Main preview */}
      <CameraPreview
        stream={currentStream}
        isScreenShare={currentMode === "screenshare"}
        className="w-full h-full"
      />

      {/* Mode switching indicator */}
      {switchingMode && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
          <div className="flex items-center gap-2 bg-black/80 text-white px-3 py-2 rounded-lg backdrop-blur-sm">
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-medium">
              Switching to {currentMode === "camera" ? "camera" : "screen share"}...
            </span>
          </div>
        </div>
      )}

      {/* Permission denied states */}
      {camera.permissionState === "denied" && currentMode === "camera" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-4">
          <div className="text-lg font-semibold mb-2">Camera Access Denied</div>
          <div className="text-sm text-gray-300 text-center mb-4">
            Please allow camera access in your browser settings.
          </div>
          <div className="flex gap-2">
            <button
              onClick={camera.requestPermission}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Request Camera
            </button>
            <button
              onClick={switchToScreenShare}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              Share Screen Instead
            </button>
          </div>
        </div>
      )}

      {screenShare.permissionState === "denied" && currentMode === "screenshare" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-4">
          <div className="text-lg font-semibold mb-2">Screen Share Access Denied</div>
          <div className="text-sm text-gray-300 text-center mb-4">
            Please allow screen sharing when prompted by your browser.
          </div>
          <div className="flex gap-2">
            <button
              onClick={screenShare.requestPermission}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              Request Screen Share
            </button>
            <button
              onClick={switchToCamera}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Use Camera Instead
            </button>
          </div>
        </div>
      )}

      {/* Error states */}
      {hasError && !isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-4">
          <div className="text-lg font-semibold mb-2">
            {currentMode === "camera" ? "Camera" : "Screen Share"} Error
          </div>
          <div className="text-sm text-gray-300 text-center mb-4">
            {camera.error || screenShare.error}
          </div>
          <button
            onClick={currentMode === "camera" ? switchToCamera : switchToScreenShare}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Controls */}
      {showControls && isActive && !hasError && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="flex gap-2">
            <button
              onClick={switchToCamera}
              disabled={isLoading || currentMode === "camera"}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-colors",
                currentMode === "camera" 
                  ? "bg-blue-600 text-white"
                  : "bg-gray-600 hover:bg-blue-600 text-white",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              )}
            >
              Camera
            </button>
            <button
              onClick={switchToScreenShare}
              disabled={isLoading || currentMode === "screenshare"}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-colors",
                currentMode === "screenshare" 
                  ? "bg-green-600 text-white"
                  : "bg-gray-600 hover:bg-green-600 text-white",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              )}
            >
              Share Screen
            </button>
          </div>
        </div>
      )}

      {/* Start prompt when no input is active */}
      {!isActive && !isLoading && !hasError && showControls && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-4">
          <div className="text-lg font-semibold mb-4">Choose Input Source</div>
          <div className="flex gap-2">
            <button
              onClick={switchToCamera}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium"
            >
              Start Camera
            </button>
            <button
              onClick={switchToScreenShare}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors font-medium"
            >
              Share Screen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
