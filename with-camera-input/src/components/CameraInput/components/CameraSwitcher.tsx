import React, { useCallback, useEffect, useRef, useState } from "react";
import { useCamera } from "../hooks/useCamera";
import { useScreenShare } from "../hooks/useScreenShare";
import { useStreamManager } from "../hooks/useStreamManager";
import { CameraPreview } from "./CameraPreview";
import type {
  CameraConstraints,
  ScreenShareConstraints,
  BackgroundOptions,
} from "../types";
import { cn } from "../utils/cn";

interface CameraSwitcherProps {
  cameraConstraints?: CameraConstraints;
  screenShareConstraints?: ScreenShareConstraints;
  backgroundOptions?: BackgroundOptions;
  onStreamReady?: (stream: MediaStream) => void;
  onError?: (error: string) => void;
  onModeChange?: (mode: "camera" | "screenshare") => void;
  className?: string;
  buttonClassName?: string;
  showSwitchButton?: boolean;
  autoStartCamera?: boolean;
  style?: React.CSSProperties;
}

/**
 * CameraSwitcher - A component that allows seamless switching between camera and screen share
 * Similar to the original implementation but as a standalone, composable component
 */
export const CameraSwitcher: React.FC<CameraSwitcherProps> = ({
  cameraConstraints,
  screenShareConstraints,
  backgroundOptions,
  onStreamReady,
  onError,
  onModeChange,
  className,
  buttonClassName,
  showSwitchButton = true,
  autoStartCamera = true,
  style,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentMode, setCurrentMode] = useState<"camera" | "screenshare">(
    "camera"
  );
  const [isTransitioning, setIsTransitioning] = useState(false);

  const {
    registerSource,
    orchestratedStream,
    setIsLoading: setSwitchingMode,
  } = useStreamManager({
    backgroundOptions,
    onStreamReady,
  });

  const camera = useCamera({
    constraints: cameraConstraints,
    autoStart: autoStartCamera,
    onStreamReady: useCallback(
      (stream: MediaStream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          registerSource({
            kind: "video",
            element: videoRef.current,
            contentHint: "motion",
          });
        }
        // Always clear transitioning state when camera stream is ready
        setIsTransitioning(false);
        setSwitchingMode(false);
      },
      [registerSource, setSwitchingMode]
    ),
    onError,
  });

  const screenShare = useScreenShare({
    constraints: screenShareConstraints,
    onStreamReady: useCallback(
      (stream: MediaStream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          registerSource({
            kind: "video",
            element: videoRef.current,
            contentHint: "detail",
          });
        }
        // Always clear transitioning state when screen share stream is ready
        setIsTransitioning(false);
        setSwitchingMode(false);
      },
      [registerSource, setSwitchingMode]
    ),
    onError,
    onStreamEnded: useCallback(() => {
      // When screen share ends, switch back to camera
      setCurrentMode("camera");
      setIsTransitioning(true);
      setSwitchingMode(true);
      camera.startCamera();
      if (onModeChange) {
        onModeChange("camera");
      }
    }, [camera, setSwitchingMode, onModeChange]),
  });

  const switchToCamera = useCallback(async () => {
    if (currentMode === "camera" || isTransitioning) return;

    setIsTransitioning(true);
    setSwitchingMode(true);
    setCurrentMode("camera");

    try {
      // Stop screen share first
      screenShare.stopScreenShare();

      // Start camera
      await camera.startCamera();

      if (onModeChange) {
        onModeChange("camera");
      }
    } catch (error) {
      // If camera fails, clear transitioning state
      console.error("Failed to switch to camera:", error);
      setIsTransitioning(false);
      setSwitchingMode(false);
    }
  }, [
    currentMode,
    isTransitioning,
    camera,
    screenShare,
    setSwitchingMode,
    onModeChange,
  ]);

  const switchToScreenShare = useCallback(async () => {
    if (currentMode === "screenshare" || isTransitioning) return;

    setIsTransitioning(true);
    setSwitchingMode(true);
    setCurrentMode("screenshare");

    try {
      // Stop camera first
      camera.stopCamera();

      // Start screen share
      await screenShare.startScreenShare();

      if (onModeChange) {
        onModeChange("screenshare");
      }
    } catch (error) {
      // If screen share fails, clear transitioning state and revert to camera
      console.error("Failed to switch to screen share:", error);
      setIsTransitioning(false);
      setSwitchingMode(false);
      setCurrentMode("camera");
      camera.startCamera();
    }
  }, [
    currentMode,
    isTransitioning,
    camera,
    screenShare,
    setSwitchingMode,
    onModeChange,
  ]);

  const currentStream =
    currentMode === "camera" ? camera.stream : screenShare.stream;
  const isLoading =
    camera.isLoading || screenShare.isLoading || isTransitioning;
  const currentError =
    currentMode === "camera" ? camera.error : screenShare.error;
  const isActive = camera.isActive || screenShare.isActive;

  return (
    <div className={cn("relative w-full h-full", className)} style={style}>
      {/* Hidden video element for stream orchestration */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ display: "none" }}
      />

      {/* Main preview */}
      <CameraPreview
        stream={currentStream}
        isScreenShare={currentMode === "screenshare"}
        className="w-full h-full"
      />

      {/* Loading/Transition state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-white">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span className="font-medium">
              {isTransitioning
                ? `Switching to ${
                    currentMode === "camera" ? "camera" : "screen share"
                  }...`
                : `Starting ${
                    currentMode === "camera" ? "camera" : "screen share"
                  }...`}
            </span>
          </div>
        </div>
      )}

      {/* Error states */}
      {currentError && !isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-4">
          <div className="text-lg font-semibold mb-2">
            {currentMode === "camera" ? "Camera" : "Screen Share"} Error
          </div>
          <div className="text-sm text-gray-300 text-center mb-4">
            {currentError}
          </div>
          <button
            onClick={
              currentMode === "camera" ? switchToCamera : switchToScreenShare
            }
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Switch button */}
      {showSwitchButton && isActive && !isLoading && !currentError && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
          {currentMode === "camera" ? (
            <button
              onClick={switchToScreenShare}
              disabled={isTransitioning}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-colors",
                "bg-black/60 hover:bg-black/80 text-white",
                "backdrop-blur-sm border border-gray-500/50",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                buttonClassName
              )}
            >
              Share Screen
            </button>
          ) : (
            <button
              onClick={switchToCamera}
              disabled={isTransitioning}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-colors",
                "bg-black/60 hover:bg-black/80 text-white",
                "backdrop-blur-sm border border-gray-500/50",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                buttonClassName
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
