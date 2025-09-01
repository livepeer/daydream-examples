import { useCallback, useEffect, useRef, useState } from "react";
import type { UseInputFPSOptions } from '../types';

export const useInputFPS = ({
  stream,
  enabled = true,
  updateInterval = 1000,
}: UseInputFPSOptions) => {
  const [fps, setFps] = useState<number>(0);
  const frameCountRef = useRef<number>(0);
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameDataRef = useRef<string>("");

  const trackFrames = useCallback(() => {
    if (!videoRef.current || !contextRef.current) return;

    const video = videoRef.current;
    const context = contextRef.current;
    const canvas = canvasRef.current;

    if (!canvas) return;

    // Draw current video frame to canvas
    if (video.readyState >= 2) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get image data to detect frame changes
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      // Calculate a hash of the frame data to detect meaningful changes
      let hash = 0;
      const step = Math.max(1, Math.floor(imageData.data.length / 1000)); // Sample every nth pixel
      for (let i = 0; i < imageData.data.length; i += step * 4) {
        hash = ((hash << 5) - hash + imageData.data[i]) & 0xffffffff; // Only use R channel for performance
      }
      const frameData = hash.toString();

      // Check if frame has changed
      if (frameData !== lastFrameDataRef.current) {
        frameCountRef.current++;
        lastFrameDataRef.current = frameData;
      }
    }

    animationFrameRef.current = requestAnimationFrame(trackFrames);
  }, []);

  const calculateFPS = useCallback(() => {
    const now = Date.now();
    const timeDiff = now - lastUpdateTimeRef.current;

    if (timeDiff >= updateInterval) {
      const currentFPS = (frameCountRef.current * 1000) / timeDiff;
      setFps(Math.round(currentFPS * 10) / 10); // Round to 1 decimal place

      // Reset counters
      frameCountRef.current = 0;
      lastUpdateTimeRef.current = now;
    }
  }, [updateInterval]);

  const setupVideoTracking = useCallback(() => {
    if (!stream || !enabled) {
      setFps(0);
      return;
    }

    const videoTracks = stream.getVideoTracks();
    if (videoTracks.length === 0) {
      setFps(0);
      return;
    }

    // Create hidden video element to track frames
    if (!videoRef.current) {
      videoRef.current = document.createElement("video");
      videoRef.current.style.display = "none";
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;
      document.body.appendChild(videoRef.current);
    }

    // Create hidden canvas for frame analysis
    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
      canvasRef.current.width = 32;
      canvasRef.current.height = 32;
      canvasRef.current.style.display = "none";
      contextRef.current = canvasRef.current.getContext("2d");
      document.body.appendChild(canvasRef.current);
    }

    const video = videoRef.current;
    video.srcObject = stream;

    video.onloadedmetadata = () => {
      video.play();
      trackFrames();
    };

    // Set up FPS calculation interval
    intervalRef.current = setInterval(calculateFPS, 100);
  }, [stream, enabled, trackFrames, calculateFPS]);

  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
      if (document.body.contains(videoRef.current)) {
        document.body.removeChild(videoRef.current);
      }
      videoRef.current = null;
    }

    if (canvasRef.current && document.body.contains(canvasRef.current)) {
      document.body.removeChild(canvasRef.current);
      canvasRef.current = null;
      contextRef.current = null;
    }

    frameCountRef.current = 0;
    lastFrameDataRef.current = "";
    setFps(0);
  }, []);

  useEffect(() => {
    if (enabled && stream) {
      setupVideoTracking();
    } else {
      cleanup();
    }

    return cleanup;
  }, [stream, enabled, setupVideoTracking, cleanup]);

  return fps;
};
