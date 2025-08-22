"use client";

import React, { useCallback, useEffect, useRef } from "react";
import type {
  FluidCanvasProps,
  FluidConfig,
  FluidPointer,
  FluidBuffers,
  FluidPrograms,
  WebGLExtensions,
  FluidRefs,
} from "./types";
import {
  baseVertexShader,
  displayShaderSource,
  splatShaderSource,
  advectionShaderSource,
  divergenceShaderSource,
  curlShaderSource,
  vorticityShaderSource,
  pressureShaderSource,
  gradientSubtractShaderSource,
  clearShaderSource,
} from "./shaders";
import { getWebGLContext, compileShader, createBlit } from "./webgl";
import { Material, Program } from "./webgl";
import { createFBO, createDoubleFBO, resizeDoubleFBO } from "./webgl";
import {
  defaultFluidConfig,
  getResolution,
  step,
  render,
  calcDeltaTime,
} from "./simulation";
import {
  scaleByPixelRatio,
  updatePointerDownData,
  updatePointerMoveData,
  updatePointerUpData,
  applyInputs,
} from "./input";
import { multipleSplats, generateColor } from "./utils";
import { useBackgroundStreaming } from "./hooks/useBackgroundStreaming";
import { createSilentAudioTrack } from "./utils/audioTrack";

export const FluidCanvas = ({
  onStreamReady,
  width = 512,
  height = 512,
  fps = 30,
  splatForce = 15000,
  curl = 30,
  velocityDissipation = 0.86,
  densityDissipation,
  glow = 2,
  selectedColor,
  backgroundColor,
  simResolution = 128,
  dyeResolution = 1024,
  enableBloom = true,
  bloomIntensity = 0.3,
  enableSunrays = true,
  sunraysWeight = 0.4,
  autoGenerateSplats = true,
  initialSplatCount = 10,
  enableBackgroundStreaming = true,
  className = "",
  style = {},
}: FluidCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationIdRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const streamCreatedRef = useRef(false);

  // Global variables
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const extRef = useRef<WebGLExtensions>({} as WebGLExtensions);
  const configRef = useRef<FluidConfig>({ ...defaultFluidConfig });

  const pointersRef = useRef<FluidPointer[]>([
    {
      id: -1,
      texcoordX: 0,
      texcoordY: 0,
      prevTexcoordX: 0,
      prevTexcoordY: 0,
      deltaX: 0,
      deltaY: 0,
      down: false,
      moved: false,
      color: [30, 0, 300],
      lastColorUpdate: 0,
    },
  ]);

  const buffersRef = useRef<FluidBuffers>({});
  const programsRef = useRef<FluidPrograms>({});
  const lastUpdateTimeRef = useRef(Date.now());
  const colorUpdateTimerRef = useRef(0.0);

  // Custom color generation function
  const generateCustomColor = useCallback(() => {
    if (selectedColor) {
      // Convert hex color to RGB array
      const hex = selectedColor.toLowerCase().replace("#", "");
      const r = (parseInt(hex.substring(0, 2), 16) / 255) * 0.15;
      const g = (parseInt(hex.substring(2, 4), 16) / 255) * 0.15;
      const b = (parseInt(hex.substring(4, 6), 16) / 255) * 0.15;
      return [r, g, b];
    } else {
      // Use default dynamic color generation
      return generateColor();
    }
  }, [selectedColor]);

  const refs: FluidRefs = {
    gl: glRef,
    ext: extRef,
    config: configRef,
    pointers: pointersRef,
    buffers: buffersRef,
    programs: programsRef,
    lastUpdateTime: lastUpdateTimeRef,
    colorUpdateTimer: colorUpdateTimerRef,
    generateColor: generateCustomColor,
  };

  const renderBackgroundFrame = useCallback(() => {
    const dt = calcDeltaTime(lastUpdateTimeRef);
    applyInputs(refs, width, height);
    if (!configRef.current.PAUSED) step(refs, dt);
    render(refs);
  }, [width, height]);

  const { isBackgroundStreaming } = useBackgroundStreaming({
    onBackgroundFrame: renderBackgroundFrame,
    fps,
    enabled: enableBackgroundStreaming,
  });

  function updateKeywords() {
    let displayKeywords = [];
    if (configRef.current.SHADING) displayKeywords.push("SHADING");
    if (configRef.current.BLOOM && enableBloom) displayKeywords.push("BLOOM");
    if (configRef.current.SUNRAYS && enableSunrays)
      displayKeywords.push("SUNRAYS");
    if (programsRef.current.displayMaterial) {
      programsRef.current.displayMaterial.setKeywords(displayKeywords);
    }
  }

  function initFramebuffers() {
    const gl = glRef.current!;
    const ext = extRef.current;

    let simRes = getResolution(gl, configRef.current.SIM_RESOLUTION);
    let dyeRes = getResolution(gl, configRef.current.DYE_RESOLUTION);

    const texType = ext.halfFloatTexType;
    const rgba = ext.formatRGBA;
    const rg = ext.formatRG;
    const r = ext.formatR;
    const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

    gl.disable(gl.BLEND);

    if (buffersRef.current.dye == null)
      buffersRef.current.dye = createDoubleFBO(
        gl,
        dyeRes.width,
        dyeRes.height,
        rgba.internalFormat,
        rgba.format,
        texType,
        filtering
      );
    else
      buffersRef.current.dye = resizeDoubleFBO(
        gl,
        buffersRef.current.dye,
        dyeRes.width,
        dyeRes.height,
        rgba.internalFormat,
        rgba.format,
        texType,
        filtering
      );

    if (buffersRef.current.velocity == null)
      buffersRef.current.velocity = createDoubleFBO(
        gl,
        simRes.width,
        simRes.height,
        rg.internalFormat,
        rg.format,
        texType,
        filtering
      );
    else
      buffersRef.current.velocity = resizeDoubleFBO(
        gl,
        buffersRef.current.velocity,
        simRes.width,
        simRes.height,
        rg.internalFormat,
        rg.format,
        texType,
        filtering
      );

    buffersRef.current.divergence = createFBO(
      gl,
      simRes.width,
      simRes.height,
      r.internalFormat,
      r.format,
      texType,
      gl.NEAREST
    );
    buffersRef.current.curl = createFBO(
      gl,
      simRes.width,
      simRes.height,
      r.internalFormat,
      r.format,
      texType,
      gl.NEAREST
    );
    buffersRef.current.pressure = createDoubleFBO(
      gl,
      simRes.width,
      simRes.height,
      r.internalFormat,
      r.format,
      texType,
      gl.NEAREST
    );
  }

  const initWebGL = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = getWebGLContext(canvas);
    if (!context) {
      return;
    }

    glRef.current = context.gl;
    extRef.current = context.ext;

    canvas.width = width;
    canvas.height = height;
    canvas.style.width = "100%";
    canvas.style.height = "100%";

    if (glRef.current) {
      glRef.current.viewport(0, 0, width, height);
    }

    const baseVertexShaderCompiled = compileShader(
      glRef.current!,
      glRef.current!.VERTEX_SHADER,
      baseVertexShader
    );

    const splatShaderCompiled = compileShader(
      glRef.current!,
      glRef.current!.FRAGMENT_SHADER,
      splatShaderSource
    );

    const advectionShaderCompiled = compileShader(
      glRef.current!,
      glRef.current!.FRAGMENT_SHADER,
      advectionShaderSource,
      extRef.current.supportLinearFiltering ? undefined : ["MANUAL_FILTERING"]
    );

    const divergenceShaderCompiled = compileShader(
      glRef.current!,
      glRef.current!.FRAGMENT_SHADER,
      divergenceShaderSource
    );

    const curlShaderCompiled = compileShader(
      glRef.current!,
      glRef.current!.FRAGMENT_SHADER,
      curlShaderSource
    );

    const vorticityShaderCompiled = compileShader(
      glRef.current!,
      glRef.current!.FRAGMENT_SHADER,
      vorticityShaderSource
    );

    const pressureShaderCompiled = compileShader(
      glRef.current!,
      glRef.current!.FRAGMENT_SHADER,
      pressureShaderSource
    );

    const gradientSubtractShaderCompiled = compileShader(
      glRef.current!,
      glRef.current!.FRAGMENT_SHADER,
      gradientSubtractShaderSource
    );

    const clearShaderCompiled = compileShader(
      glRef.current!,
      glRef.current!.FRAGMENT_SHADER,
      clearShaderSource
    );

    programsRef.current = {
      splat: new Program(
        glRef.current,
        baseVertexShaderCompiled,
        splatShaderCompiled
      ),
      advection: new Program(
        glRef.current,
        baseVertexShaderCompiled,
        advectionShaderCompiled
      ),
      divergence: new Program(
        glRef.current,
        baseVertexShaderCompiled,
        divergenceShaderCompiled
      ),
      curl: new Program(
        glRef.current,
        baseVertexShaderCompiled,
        curlShaderCompiled
      ),
      vorticity: new Program(
        glRef.current,
        baseVertexShaderCompiled,
        vorticityShaderCompiled
      ),
      pressure: new Program(
        glRef.current,
        baseVertexShaderCompiled,
        pressureShaderCompiled
      ),
      gradientSubtract: new Program(
        glRef.current,
        baseVertexShaderCompiled,
        gradientSubtractShaderCompiled
      ),
      clear: new Program(
        glRef.current,
        baseVertexShaderCompiled,
        clearShaderCompiled
      ),
    };

    programsRef.current.displayMaterial = new Material(
      glRef.current,
      baseVertexShaderCompiled!,
      displayShaderSource
    );
    updateKeywords();

    initFramebuffers();

    const blit = createBlit(glRef.current!);
    buffersRef.current.blit = blit;

    // Update config with props
    configRef.current.SIM_RESOLUTION = simResolution;
    configRef.current.DYE_RESOLUTION = dyeResolution;
    configRef.current.SPLAT_RADIUS = 1.5;
    configRef.current.SPLAT_FORCE = splatForce;
    configRef.current.CURL = curl;
    configRef.current.VELOCITY_DISSIPATION = velocityDissipation;
    configRef.current.DENSITY_DISSIPATION =
      densityDissipation || Math.max(0.1, 2.5 - glow);
    configRef.current.BLOOM = enableBloom;
    configRef.current.BLOOM_INTENSITY = bloomIntensity;
    configRef.current.SUNRAYS = enableSunrays;
    configRef.current.SUNRAYS_WEIGHT = sunraysWeight;

    if (backgroundColor) {
      configRef.current.BACK_COLOR = backgroundColor;
    }

    // Generate initial splats if enabled
    if (autoGenerateSplats) {
      setTimeout(() => {
        multipleSplats(initialSplatCount, refs, width, height);
      }, 100);
    }
  }, [
    width,
    height,
    simResolution,
    dyeResolution,
    splatForce,
    curl,
    velocityDissipation,
    densityDissipation,
    glow,
    enableBloom,
    bloomIntensity,
    enableSunrays,
    sunraysWeight,
    backgroundColor,
    autoGenerateSplats,
    initialSplatCount,
  ]);

  function update() {
    const dt = calcDeltaTime(lastUpdateTimeRef);
    applyInputs(refs, width, height);
    if (!configRef.current.PAUSED) step(refs, dt);
    render(refs);

    animationIdRef.current = requestAnimationFrame(update);
  }

  const getEventPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    if ("touches" in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }

    return {
      x: e.nativeEvent.offsetX,
      y: e.nativeEvent.offsetY,
    };
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!canvasRef.current) return;

      if ("touches" in e) {
        e.preventDefault();
      }

      const canvas = canvasRef.current;
      const pos = getEventPos(e);
      let posX = scaleByPixelRatio(pos.x);
      let posY = scaleByPixelRatio(pos.y);

      let pointer = pointersRef.current[0];
      if (!pointer.down) return;
      updatePointerMoveData(pointer, posX, posY, canvas, generateCustomColor);
    },
    [generateCustomColor, getEventPos]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!canvasRef.current) return;

      if ("touches" in e) {
        e.preventDefault();
      }

      const canvas = canvasRef.current;
      const pos = getEventPos(e);
      let posX = scaleByPixelRatio(pos.x);
      let posY = scaleByPixelRatio(pos.y);

      let pointer = pointersRef.current[0];
      updatePointerDownData(
        pointer,
        -1,
        posX,
        posY,
        canvas,
        generateCustomColor
      );
    },
    [generateCustomColor, getEventPos]
  );

  const handleMouseUp = useCallback(() => {
    updatePointerUpData(pointersRef.current[0]);
  }, []);

  const createStream = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || streamCreatedRef.current) return;

    if (!glRef.current) {
      requestAnimationFrame(async () => await createStream());
      return;
    }

    glRef.current.viewport(0, 0, canvas.width, canvas.height);

    const stream = canvas.captureStream(fps);

    const audioTrack = createSilentAudioTrack();
    stream.addTrack(audioTrack);

    streamRef.current = stream;
    streamCreatedRef.current = true;
    if (onStreamReady) {
      onStreamReady(stream);
    }
  }, [onStreamReady, fps]);

  useEffect(() => {
    initWebGL();

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = "100%";
      canvas.style.height = "100%";

      if (glRef.current) {
        glRef.current.viewport(0, 0, width, height);
      }
    }

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      }
    };
  }, [initWebGL, width, height]);

  useEffect(() => {
    if (
      glRef.current &&
      !animationIdRef.current &&
      !enableBackgroundStreaming
    ) {
      glRef.current.viewport(
        0,
        0,
        glRef.current.canvas.width,
        glRef.current.canvas.height
      );
      update();
    }

    if (!streamCreatedRef.current) {
      createStream();
    }

    return () => {
      if (animationIdRef.current && !enableBackgroundStreaming) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
    };
  }, [createStream, enableBackgroundStreaming]);

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

  useEffect(() => {
    const handleGlobalMouseUp = () => handleMouseUp();

    window.addEventListener("mouseup", handleGlobalMouseUp);
    window.addEventListener("touchend", handleGlobalMouseUp);

    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
      window.removeEventListener("touchend", handleGlobalMouseUp);
    };
  }, [handleMouseUp]);

  useEffect(() => {
    if (configRef.current) {
      configRef.current.SPLAT_FORCE = splatForce;
      configRef.current.CURL = curl;
      configRef.current.VELOCITY_DISSIPATION = velocityDissipation;
      configRef.current.DENSITY_DISSIPATION =
        densityDissipation || Math.max(0.1, 2.5 - glow);
    }
  }, [splatForce, curl, velocityDissipation, densityDissipation, glow]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`block w-full h-full cursor-crosshair ${className}`}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        touchAction: "none",
        WebkitUserSelect: "none",
        userSelect: "none",
        ...style,
      }}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchMove={handleMouseMove}
      onTouchEnd={handleMouseUp}
    />
  );
};
