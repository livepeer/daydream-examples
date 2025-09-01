import React, { useCallback, useEffect, useRef } from "react";
import { cn } from '../utils/cn';

interface CameraPreviewProps {
  stream: MediaStream | null;
  isScreenShare?: boolean;
  className?: string;
  onVideoReady?: (video: HTMLVideoElement) => void;
  style?: React.CSSProperties;
}

export const CameraPreview: React.FC<CameraPreviewProps> = ({
  stream,
  isScreenShare = false,
  className,
  onVideoReady,
  style,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const setupVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (stream) {
      video.srcObject = stream;
      if (onVideoReady) {
        onVideoReady(video);
      }
    } else {
      video.srcObject = null;
    }
  }, [stream, onVideoReady]);

  useEffect(() => {
    setupVideo();
  }, [setupVideo]);

  return (
    <div className={cn("relative w-full h-full", className)} style={style}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={cn(
          "w-full h-full object-cover",
          !isScreenShare && "-scale-x-100", // Mirror camera but not screen share
        )}
      />
      
      {!stream && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-gray-400 text-sm font-medium">
            No stream available
          </div>
        </div>
      )}
    </div>
  );
};
