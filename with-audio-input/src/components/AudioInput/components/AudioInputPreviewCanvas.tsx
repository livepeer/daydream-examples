import { useRef, useEffect, useState, useCallback } from "react";
import { useAudioInputContext } from "./AudioInput";
import type { AudioLevels } from "../hooks/useAudioEngine";
import { useChromeBlobScene } from "../hooks/useChromeBlobScene";
import { useStreamStabilizer } from "../hooks/useStreamStabilizer";
import { useBackgroundStreaming } from "../hooks/useBackgroundStreaming";
import { cn } from "../utils/cn";

export interface AudioInputPreviewCanvasProps {
  className?: string;
  width?: number;
  height?: number;
  enableStreaming?: boolean;
  enableBackground?: boolean;
  chromeEnvPath?: string;
  showLoadingState?: boolean;
  audioReactivityMultiplier?: number;
  onSceneReady?: () => void;
  renderMode?: "chrome-blob" | "custom";
  customRender?: (
    ctx: CanvasRenderingContext2D,
    audioLevels: AudioLevels
  ) => void;
}

export function AudioInputPreviewCanvas({
  className,
  width = 512,
  height = 512,
  enableStreaming = true,
  enableBackground = true,
  chromeEnvPath,
  showLoadingState = true,
  audioReactivityMultiplier = 1.0,
  onSceneReady,
  renderMode = "chrome-blob",
  customRender,
}: AudioInputPreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationIdRef = useRef<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [chromeBlobFailed, setChromeBlobFailed] = useState(false);

  const {
    isListening,
    isDemoPlaying,
    audioLevels,
    analyzeAudio,
    audioReactivity,
    setStream,
  } = useAudioInputContext();

  const scene = useChromeBlobScene(canvasRef, {
    width,
    height,
    audioReactivity: audioReactivity * audioReactivityMultiplier,
    onSceneReady: () => {
      setIsInitialized(true);
      setChromeBlobFailed(false);
      onSceneReady?.();
    },
    chromeEnvPath,
  });

  const streamStabilizer = useStreamStabilizer(canvasRef, {
    onStreamReady: (stream) => {
      setStream(stream);
    },
  });

  useBackgroundStreaming({
    onBackgroundFrame: () => {
      if (renderMode === "chrome-blob") {
        handleRenderFrame();
      } else if (renderMode === "custom" && customRender && canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        if (ctx) {
          customRender(ctx, audioLevels);
        }
      }
    },
    fps: 30,
    enabled: enableBackground && enableStreaming && isInitialized,
    canvas: canvasRef.current,
    stream: streamStabilizer.streamRef.current,
  });

  // Fallback visualizer for when Chrome Blob fails
  const fallbackRender = useCallback(
    (ctx: CanvasRenderingContext2D, levels: AudioLevels) => {
      // Clear with light background
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      const centerX = ctx.canvas.width / 2;
      const centerY = ctx.canvas.height / 2;
      const maxRadius = Math.min(centerX, centerY) * 0.8;

      // Draw audio-reactive circles
      const colors = ["#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444"];
      const levelValues = [levels.low, levels.mid, levels.high, levels.overall];

      levelValues.forEach((level, index) => {
        const radius = maxRadius * (0.2 + level * 0.6) * (1 - index * 0.15);

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = colors[index];
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = colors[index] + "30";
        ctx.fill();
      });
    },
    []
  );

  const handleRenderFrame = useCallback(() => {
    try {
      if (renderMode === "chrome-blob" && !chromeBlobFailed) {
        if (isListening || isDemoPlaying) {
          const levels = analyzeAudio();
          if (levels) {
            scene.updateParametersFromAudio(levels);
          }
        }
        scene.renderFrame();
      } else if (canvasRef.current) {
        // Use fallback or custom renderer
        const ctx = canvasRef.current.getContext("2d");
        if (ctx) {
          const levels =
            isListening || isDemoPlaying
              ? analyzeAudio()
              : { low: 0, mid: 0, high: 0, overall: 0 };
          if (customRender) {
            customRender(ctx, levels || audioLevels);
          } else {
            fallbackRender(ctx, levels || audioLevels);
          }
        }
      }
    } catch (error) {
      console.error("Error in handleRenderFrame:", error);
      if (renderMode === "chrome-blob") {
        setChromeBlobFailed(true);
      }
    }
  }, [
    isListening,
    isDemoPlaying,
    analyzeAudio,
    scene,
    renderMode,
    chromeBlobFailed,
    customRender,
    audioLevels,
    fallbackRender,
  ]);

  const animate = useCallback(() => {
    if (!isInitialized) return;

    handleRenderFrame();
    animationIdRef.current = requestAnimationFrame(animate);
  }, [isInitialized, handleRenderFrame]);

  // Initialize scene
  useEffect(() => {
    if (
      renderMode === "chrome-blob" &&
      scene.isLoaded &&
      !scene.sceneReady &&
      !chromeBlobFailed
    ) {
      try {
        scene.setupScene();
      } catch (error) {
        console.error("Failed to setup Chrome Blob scene:", error);
        setChromeBlobFailed(true);
        setIsInitialized(true); // Initialize anyway for fallback
      }
    } else if (renderMode !== "chrome-blob") {
      setIsInitialized(true); // For custom renderers
    }
  }, [
    scene.isLoaded,
    scene.sceneReady,
    scene.setupScene,
    renderMode,
    chromeBlobFailed,
  ]);

  // Reset initialization when render mode changes
  useEffect(() => {
    if (renderMode !== "chrome-blob") {
      setIsInitialized(true);
      setChromeBlobFailed(false);
    } else {
      setChromeBlobFailed(false);
    }

    // Clear canvas when switching modes
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  }, [renderMode]);

  // Create stream when scene is ready
  useEffect(() => {
    if (
      enableStreaming &&
      isInitialized &&
      !streamStabilizer.streamRef.current
    ) {
      streamStabilizer.createStream();
    }
  }, [enableStreaming, isInitialized, streamStabilizer]);

  // Animation loop
  useEffect(() => {
    if (isInitialized) {
      animationIdRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
    };
  }, [isInitialized, animate]);

  // Reset audio parameters when audio stops
  useEffect(() => {
    if (
      !isListening &&
      !isDemoPlaying &&
      renderMode === "chrome-blob" &&
      scene.sceneReady
    ) {
      scene.resetParameters();
    }
  }, [isListening, isDemoPlaying, renderMode, scene.sceneReady]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
      // Only cleanup if we're unmounting, not on re-renders
      if (scene && typeof scene.cleanup === "function") {
        scene.cleanup();
      }
      if (
        streamStabilizer &&
        typeof streamStabilizer.stopStream === "function"
      ) {
        streamStabilizer.stopStream();
      }
    };
  }, []); // Empty dependency array to only run on unmount

  if (
    !scene.isLoaded &&
    showLoadingState &&
    renderMode === "chrome-blob" &&
    !chromeBlobFailed
  ) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-white rounded-lg",
          className
        )}
        style={{ width, height }}
      >
        <div className="text-slate-400">Loading Chrome Blob...</div>
      </div>
    );
  }

  return (
    <div
      className={cn("rounded-lg overflow-hidden bg-white", className)}
      style={{ width, height }}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="block w-full h-full"
        style={{
          maxWidth: "100%",
          maxHeight: "100%",
          objectFit: "contain",
          transform: "scaleX(-1)", // Mirror effect
        }}
      />
    </div>
  );
}
