import React, { useCallback, useEffect, useRef, useState } from "react";
import { ColorPalette } from "./ColorPalette";
import { BrushControls } from "./BrushControls";
import { ToolSelector, type DrawingTool } from "./ToolSelector";
import { useBackgroundStreaming } from "../hooks/useBackgroundStreaming";
import { STREAMING_CONFIG } from "../lib/streamingConfig";
import { createSilentAudioTrack } from "../lib/audioTrackManager";
import { streamStabilizer } from "../lib/streamStabilizer";

export interface DrawingCanvasProps {
  /**
   * Callback when the canvas stream is ready
   */
  onStreamReady?: (stream: MediaStream) => void;

  /**
   * Canvas dimensions (default: 512x512)
   */
  width?: number;
  height?: number;

  /**
   * Frame rate for the stream (default: 30)
   */
  fps?: number;

  /**
   * Initial brush size (default: 20)
   */
  initialBrushSize?: number;

  /**
   * Initial selected color (default: #000000)
   */
  initialColor?: string;

  /**
   * Custom color palette
   */
  customColors?: Array<{ name: string; value: string }>;

  /**
   * Enable/disable streaming features (default: true)
   */
  enableStreaming?: boolean;

  /**
   * Enable/disable background streaming when tab is hidden (default: true)
   */
  enableBackgroundStreaming?: boolean;

  /**
   * Custom styles for the container
   */
  className?: string;

  /**
   * Canvas styles
   */
  canvasClassName?: string;

  /**
   * Callback when drawing starts
   */
  onDrawingStart?: () => void;

  /**
   * Callback when drawing ends
   */
  onDrawingEnd?: () => void;

  /**
   * Callback when canvas is cleared
   */
  onClear?: () => void;

  /**
   * Callback when undo is performed
   */
  onUndo?: () => void;

  /**
   * Maximum history size for undo (default: 20)
   */
  maxHistorySize?: number;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  onStreamReady,
  width = STREAMING_CONFIG.WIDTH,
  height = STREAMING_CONFIG.HEIGHT,
  fps = STREAMING_CONFIG.FPS,
  initialBrushSize = 20,
  initialColor = "#000000",
  customColors,
  enableStreaming = true,
  enableBackgroundStreaming = true,
  className = "",
  canvasClassName = "",
  onDrawingStart,
  onDrawingEnd,
  onClear,
  onUndo,
  maxHistorySize = 20,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const streamCreatedRef = useRef(false);
  const fadingEnabledRef = useRef(false);
  const fadeAnimationRef = useRef<number | null>(null);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const savedCanvasStateRef = useRef<string | null>(null);
  const isRestoringRef = useRef(false);

  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(
    null
  );
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const [brushSize, setBrushSize] = useState(initialBrushSize);
  const [selectedColor, setSelectedColor] = useState(initialColor);
  const [fadingEnabled, setFadingEnabled] = useState(false);
  const [selectedTool, setSelectedTool] = useState<DrawingTool>("brush");
  const [canUndo, setCanUndo] = useState(false);

  // Background frame rendering for stream stability
  const renderBackgroundFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Keep-alive pixel to ensure stream stays active
    const time = Date.now();
    const pixelColor =
      time % 2 === 0 ? "rgba(255, 0, 0, 0.01)" : "rgba(0, 255, 0, 0.01)";
    ctx.fillStyle = pixelColor;
    ctx.fillRect(canvas.width - 1, canvas.height - 1, 1, 1);
  }, []);

  const { isBackgroundStreaming } = useBackgroundStreaming({
    onBackgroundFrame: renderBackgroundFrame,
    fps,
    enabled: enableStreaming && enableBackgroundStreaming,
    canvas: canvasRef.current,
    stream: streamRef.current,
  });

  useEffect(() => {
    fadingEnabledRef.current = fadingEnabled;
  }, [fadingEnabled]);

  const startFadeAnimation = useCallback(() => {
    if (!fadingEnabledRef.current || fadeAnimationRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const fadeFrame = () => {
      if (!fadingEnabledRef.current || !isDrawingRef.current) {
        fadeAnimationRef.current = null;
        return;
      }

      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      fadeAnimationRef.current = requestAnimationFrame(fadeFrame);
    };

    fadeAnimationRef.current = requestAnimationFrame(fadeFrame);
  }, []);

  const stopFadeAnimation = useCallback(() => {
    if (fadeAnimationRef.current) {
      cancelAnimationFrame(fadeAnimationRef.current);
      fadeAnimationRef.current = null;
    }
  }, []);

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || isRestoringRef.current) return;

    const dataURL = canvas.toDataURL();
    historyRef.current = historyRef.current.slice(
      0,
      historyIndexRef.current + 1
    );
    historyRef.current.push(dataURL);
    historyIndexRef.current = historyRef.current.length - 1;

    if (historyRef.current.length > maxHistorySize) {
      historyRef.current = historyRef.current.slice(1);
      historyIndexRef.current = historyRef.current.length - 1;
    }

    savedCanvasStateRef.current = dataURL;
    setCanUndo(historyIndexRef.current > 0);
  }, [maxHistorySize]);

  const undo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || historyIndexRef.current <= 0) return;

    historyIndexRef.current--;
    const previousState = historyRef.current[historyIndexRef.current];

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      onUndo?.();
    };
    img.src = previousState;

    setCanUndo(historyIndexRef.current > 0);
  }, [onUndo]);

  const floodFill = useCallback(
    (startX: number, startY: number, fillColor: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
          ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16),
            }
          : { r: 0, g: 0, b: 0 };
      };

      const fillRgb = hexToRgb(fillColor);
      const startIndex = (startY * canvas.width + startX) * 4;
      const targetR = data[startIndex];
      const targetG = data[startIndex + 1];
      const targetB = data[startIndex + 2];

      if (
        targetR === fillRgb.r &&
        targetG === fillRgb.g &&
        targetB === fillRgb.b
      ) {
        return;
      }

      const stack = [[startX, startY]];

      while (stack.length > 0) {
        const [x, y] = stack.pop()!;

        if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) continue;

        const index = (y * canvas.width + x) * 4;

        if (
          data[index] !== targetR ||
          data[index + 1] !== targetG ||
          data[index + 2] !== targetB
        )
          continue;

        data[index] = fillRgb.r;
        data[index + 1] = fillRgb.g;
        data[index + 2] = fillRgb.b;
        data[index + 3] = 255;

        stack.push([x + 1, y]);
        stack.push([x - 1, y]);
        stack.push([x, y + 1]);
        stack.push([x, y - 1]);
      }

      ctx.putImageData(imageData, 0, 0);
      setSelectedTool("brush");
      saveToHistory();
    },
    [saveToHistory]
  );

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    savedCanvasStateRef.current = null;
    saveToHistory();
    onClear?.();
  }, [saveToHistory, onClear]);

  const createStream = useCallback(async () => {
    if (!enableStreaming) return;

    const canvas = canvasRef.current;
    if (!canvas || streamCreatedRef.current) {
      return;
    }

    // Wait for canvas to stabilize before creating stream
    await streamStabilizer.waitForCanvasStreamStability(canvas, fps);

    const stream = canvas.captureStream(fps);

    // Validate stream stability
    try {
      await streamStabilizer.validateStreamStability(stream, {
        minStableFrames: 3,
        timeoutMs: 2000,
        validateAudio: false,
      });
    } catch (error) {
      console.warn("Stream validation warning:", error);
    }

    // Add silent audio track for compatibility
    const audioTrack = createSilentAudioTrack();
    stream.addTrack(audioTrack);

    streamRef.current = stream;
    streamCreatedRef.current = true;

    onStreamReady?.(stream);
  }, [onStreamReady, fps, enableStreaming]);

  const restoreCanvasState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !savedCanvasStateRef.current) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    isRestoringRef.current = true;
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      isRestoringRef.current = false;
    };
    img.src = savedCanvasStateRef.current;
  }, []);

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const previewCanvas = previewCanvasRef.current;
    if (!canvas) {
      return;
    }

    canvas.width = width;
    canvas.height = height;

    if (previewCanvas) {
      previewCanvas.width = width;
      previewCanvas.height = height;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (savedCanvasStateRef.current) {
      restoreCanvasState();
    } else {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = selectedColor;
    ctx.lineWidth = brushSize;

    if (!streamCreatedRef.current && enableStreaming) {
      createStream();
      if (!savedCanvasStateRef.current) {
        setTimeout(() => saveToHistory(), 100);
      }
    }
  }, [
    createStream,
    saveToHistory,
    restoreCanvasState,
    selectedColor,
    brushSize,
    width,
    height,
    enableStreaming,
  ]);

  useEffect(() => {
    setupCanvas();
  }, [setupCanvas]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = selectedColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [selectedColor, brushSize]);

  useEffect(() => {
    if (!fadingEnabled) {
      stopFadeAnimation();
    }

    return () => {
      stopFadeAnimation();
    };
  }, [fadingEnabled, stopFadeAnimation]);

  // Touch event prevention
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const preventDefaultTouch = (e: TouchEvent) => {
      e.preventDefault();
    };

    const preventDefaultWheel = (e: WheelEvent) => {
      e.preventDefault();
    };

    canvas.addEventListener("touchstart", preventDefaultTouch, {
      passive: false,
    });
    canvas.addEventListener("touchmove", preventDefaultTouch, {
      passive: false,
    });
    canvas.addEventListener("touchend", preventDefaultTouch, {
      passive: false,
    });
    canvas.addEventListener("wheel", preventDefaultWheel, { passive: false });

    return () => {
      canvas.removeEventListener("touchstart", preventDefaultTouch);
      canvas.removeEventListener("touchmove", preventDefaultTouch);
      canvas.removeEventListener("touchend", preventDefaultTouch);
      canvas.removeEventListener("wheel", preventDefaultWheel);
    };
  }, []);

  const getEventPos = useCallback(
    (
      e:
        | React.MouseEvent<HTMLCanvasElement>
        | React.TouchEvent<HTMLCanvasElement>
    ) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      if ("touches" in e) {
        const touch = e.touches[0] || e.changedTouches[0];
        return {
          x: (touch.clientX - rect.left) * scaleX,
          y: (touch.clientY - rect.top) * scaleY,
        };
      }

      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    []
  );

  const drawLine = useCallback(
    (
      startX: number,
      startY: number,
      endX: number,
      endY: number,
      isPreview = false
    ) => {
      const canvas = isPreview ? previewCanvasRef.current : canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    },
    []
  );

  const drawCircle = useCallback(
    (
      centerX: number,
      centerY: number,
      endX: number,
      endY: number,
      isPreview = false
    ) => {
      const canvas = isPreview ? previewCanvasRef.current : canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const radius = Math.sqrt((endX - centerX) ** 2 + (endY - centerY) ** 2);

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.stroke();
    },
    []
  );

  const clearPreview = useCallback(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const startDrawing = useCallback(
    (
      e:
        | React.MouseEvent<HTMLCanvasElement>
        | React.TouchEvent<HTMLCanvasElement>
    ) => {
      if ("touches" in e) {
        e.preventDefault();
      }

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      isDrawingRef.current = true;
      const pos = getEventPos(e);

      if (selectedTool === "brush") {
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);

        if (fadingEnabledRef.current) {
          startFadeAnimation();
        }
      } else if (selectedTool === "line" || selectedTool === "circle") {
        setStartPos(pos);

        const previewCanvas = previewCanvasRef.current;
        if (previewCanvas) {
          const previewCtx = previewCanvas.getContext("2d");
          if (previewCtx) {
            previewCtx.strokeStyle = selectedColor;
            previewCtx.lineWidth = brushSize;
            previewCtx.lineCap = "round";
            previewCtx.lineJoin = "round";
          }
        }
      }

      onDrawingStart?.();
    },
    [
      getEventPos,
      startFadeAnimation,
      selectedTool,
      selectedColor,
      brushSize,
      onDrawingStart,
    ]
  );

  const draw = useCallback(
    (
      e:
        | React.MouseEvent<HTMLCanvasElement>
        | React.TouchEvent<HTMLCanvasElement>
    ) => {
      if (!isDrawingRef.current) return;

      if ("touches" in e) {
        e.preventDefault();
      }

      const pos = getEventPos(e);

      if (selectedTool === "brush") {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      } else if (
        (selectedTool === "line" || selectedTool === "circle") &&
        startPos
      ) {
        clearPreview();

        const previewCanvas = previewCanvasRef.current;
        if (!previewCanvas) return;

        const previewCtx = previewCanvas.getContext("2d");
        if (!previewCtx) return;

        previewCtx.strokeStyle = selectedColor;
        previewCtx.lineWidth = brushSize;
        previewCtx.lineCap = "round";
        previewCtx.lineJoin = "round";

        if (selectedTool === "line") {
          drawLine(startPos.x, startPos.y, pos.x, pos.y, true);
        } else if (selectedTool === "circle") {
          drawCircle(startPos.x, startPos.y, pos.x, pos.y, true);
        }
      }
    },
    [
      getEventPos,
      selectedTool,
      startPos,
      clearPreview,
      drawLine,
      drawCircle,
      selectedColor,
      brushSize,
    ]
  );

  const stopDrawing = useCallback(
    (
      e?:
        | React.MouseEvent<HTMLCanvasElement>
        | React.TouchEvent<HTMLCanvasElement>
    ) => {
      if (isDrawingRef.current) {
        isDrawingRef.current = false;

        if (
          (selectedTool === "line" || selectedTool === "circle") &&
          startPos &&
          e
        ) {
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.strokeStyle = selectedColor;
              ctx.lineWidth = brushSize;
              ctx.lineCap = "round";
              ctx.lineJoin = "round";

              const pos = getEventPos(e);

              if (selectedTool === "line") {
                drawLine(startPos.x, startPos.y, pos.x, pos.y);
              } else if (selectedTool === "circle") {
                drawCircle(startPos.x, startPos.y, pos.x, pos.y);
              }
            }
          }

          clearPreview();
          setStartPos(null);
        }

        stopFadeAnimation();
        saveToHistory();
        onDrawingEnd?.();
      }
    },
    [
      saveToHistory,
      stopFadeAnimation,
      selectedTool,
      startPos,
      selectedColor,
      brushSize,
      getEventPos,
      drawLine,
      drawCircle,
      clearPreview,
      onDrawingEnd,
    ]
  );

  const handleCanvasClick = useCallback(
    (
      e:
        | React.MouseEvent<HTMLCanvasElement>
        | React.TouchEvent<HTMLCanvasElement>
    ) => {
      if (selectedTool === "fill") {
        if ("touches" in e) {
          e.preventDefault();
        }

        const pos = getEventPos(e);
        floodFill(Math.floor(pos.x), Math.floor(pos.y), selectedColor);
      }
    },
    [selectedTool, getEventPos, floodFill, selectedColor]
  );

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="w-full">
        <div
          className="w-full aspect-square border border-gray-300 rounded-t-lg overflow-hidden flex items-center justify-center relative bg-white"
          style={{
            touchAction: "none",
            WebkitUserSelect: "none",
            userSelect: "none",
          }}
        >
          <canvas
            ref={canvasRef}
            className={`block w-full h-full ${
              selectedTool === "brush" ||
              selectedTool === "line" ||
              selectedTool === "circle"
                ? "cursor-crosshair"
                : "cursor-pointer"
            } ${canvasClassName}`}
            style={{
              touchAction: "none",
              WebkitUserSelect: "none",
              userSelect: "none",
            }}
            onMouseDown={
              selectedTool === "brush" ||
              selectedTool === "line" ||
              selectedTool === "circle"
                ? startDrawing
                : undefined
            }
            onMouseMove={
              selectedTool === "brush" ||
              selectedTool === "line" ||
              selectedTool === "circle"
                ? draw
                : undefined
            }
            onMouseUp={
              selectedTool === "brush" ||
              selectedTool === "line" ||
              selectedTool === "circle"
                ? stopDrawing
                : undefined
            }
            onMouseLeave={
              selectedTool === "brush" ||
              selectedTool === "line" ||
              selectedTool === "circle"
                ? stopDrawing
                : undefined
            }
            onTouchStart={
              selectedTool === "brush" ||
              selectedTool === "line" ||
              selectedTool === "circle"
                ? startDrawing
                : selectedTool === "fill"
                ? handleCanvasClick
                : undefined
            }
            onTouchMove={
              selectedTool === "brush" ||
              selectedTool === "line" ||
              selectedTool === "circle"
                ? draw
                : undefined
            }
            onTouchEnd={
              selectedTool === "brush" ||
              selectedTool === "line" ||
              selectedTool === "circle"
                ? stopDrawing
                : undefined
            }
            onClick={selectedTool === "fill" ? handleCanvasClick : undefined}
          />
          {/* Preview canvas for shape tools */}
          <canvas
            ref={previewCanvasRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
            style={{
              width: "100%",
              height: "100%",
              touchAction: "none",
            }}
          />
        </div>

        <ToolSelector
          selectedTool={selectedTool}
          onToolChange={setSelectedTool}
        />
      </div>

      <BrushControls
        brushSize={brushSize}
        onBrushSizeChange={setBrushSize}
        fadingEnabled={fadingEnabled}
        onFadingToggle={setFadingEnabled}
        canUndo={canUndo}
        onUndo={undo}
        onClear={clearCanvas}
      />

      <ColorPalette
        selectedColor={selectedColor}
        onColorChange={setSelectedColor}
        colors={customColors}
      />
    </div>
  );
};
