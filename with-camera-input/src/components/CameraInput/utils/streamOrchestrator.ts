import type { StreamSource, BackgroundOptions } from '../types';
import { createSilentAudioTrack } from './audioTrackManager';
import { streamComplexityManager } from './streamComplexityManager';
import { STREAMING_CONFIG } from './streamingConfig';
import { streamStabilizer } from './streamStabilizer';

class StreamOrchestrator {
  private outputCanvas: HTMLCanvasElement | null = null;
  private outputCtx: CanvasRenderingContext2D | null = null;
  private outputStream: MediaStream | null = null;
  private animationId: number | null = null;
  private currentSource: StreamSource | null = null;
  private pendingSource: StreamSource | null = null;
  private crossfadeStartMs: number | null = null;
  private crossfadeDurationMs = 200;
  private initialized = false;
  private backgroundTimer: ReturnType<typeof setInterval> | null = null;
  private backgroundOptions: BackgroundOptions | null = null;
  private visibilityHandler: (() => void) | null = null;

  private ensureInitialized() {
    if (this.initialized) return;
    if (typeof window === "undefined") return;

    const canvas = document.createElement("canvas");
    canvas.width = STREAMING_CONFIG.WIDTH;
    canvas.height = STREAMING_CONFIG.HEIGHT;
    canvas.style.display = "none";

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    this.outputCanvas = canvas;
    this.outputCtx = ctx;

    const stream = canvas.captureStream(STREAMING_CONFIG.FPS);

    const audioTrack = createSilentAudioTrack();
    stream.addTrack(audioTrack);

    // Normalize video track constraints/contentHint
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      try {
        if ((videoTrack as any).contentHint !== undefined) {
          (videoTrack as any).contentHint = "";
        }
        videoTrack
          .applyConstraints({
            width: { ideal: STREAMING_CONFIG.WIDTH },
            height: { ideal: STREAMING_CONFIG.HEIGHT },
            frameRate: { ideal: STREAMING_CONFIG.FPS },
          })
          .catch(() => {});
      } catch (_) {}
    }

    this.outputStream = stream;
    this.initialized = true;

    try {
      this.setBackgroundOptions({
        fps: STREAMING_CONFIG.FPS,
        enableComplexityManagement: true,
        complexityOptions: {
          targetComplexity: 0.3,
          complexityType: "adaptive",
          minComplexityThreshold: 0.15,
          maxIntensity: 0.2,
        },
      });
    } catch (_) {}
  }

  getStream(): MediaStream | null {
    this.ensureInitialized();
    return this.outputStream;
  }

  setSource(source: StreamSource) {
    this.ensureInitialized();
    this.pendingSource = source;
    this.crossfadeStartMs = null;

    const track = this.outputStream?.getVideoTracks()[0];
    if (track && source.contentHint !== undefined) {
      try {
        if ((track as any).contentHint !== undefined) {
          (track as any).contentHint = source.contentHint ?? "";
        }
      } catch (_) {}
    }

    if (!this.animationId) {
      this.start();
    }
  }

  setBackgroundOptions(options: BackgroundOptions | null) {
    this.backgroundOptions = options;
    this.updateBackgroundStreaming();
  }

  start() {
    if (this.animationId || !this.outputCanvas || !this.outputCtx) return;

    const draw = () => {
      if (!this.outputCanvas || !this.outputCtx) return;

      const ctx = this.outputCtx;
      const w = this.outputCanvas.width;
      const h = this.outputCanvas.height;

      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, w, h);

      const now =
        typeof performance !== "undefined" ? performance.now() : Date.now();
      if (this.pendingSource && this.isSourceReady(this.pendingSource)) {
        if (this.crossfadeStartMs === null) this.crossfadeStartMs = now;
      }

      const fading =
        this.pendingSource &&
        this.crossfadeStartMs !== null &&
        this.currentSource;
      if (fading) {
        const t = Math.min(
          1,
          (now - (this.crossfadeStartMs as number)) / this.crossfadeDurationMs,
        );
        this.blitSource(this.currentSource as StreamSource, 1 - t);
        this.blitSource(this.pendingSource as StreamSource, t);
        if (t >= 1) {
          this.currentSource = this.pendingSource;
          this.pendingSource = null;
          this.crossfadeStartMs = null;
        }
      } else if (this.pendingSource && !this.currentSource) {
        if (this.isSourceReady(this.pendingSource)) {
          this.blitSource(this.pendingSource, 1);
          this.currentSource = this.pendingSource;
          this.pendingSource = null;
          this.crossfadeStartMs = null;
        }
      } else if (this.currentSource) {
        this.blitSource(this.currentSource, 1);
      }

      ctx.fillStyle = "rgba(255, 0, 0, 0.01)";
      ctx.fillRect(w - 1, h - 1, 1, 1);

      const track = this.outputStream?.getVideoTracks()[0];
      if (track && typeof (track as any).requestFrame === "function") {
        try {
          (track as any).requestFrame();
        } catch (_) {}
      }

      this.animationId = requestAnimationFrame(draw);
    };

    try {
      if (this.outputCanvas) {
        streamStabilizer
          .waitForCanvasStreamStability(this.outputCanvas, STREAMING_CONFIG.FPS)
          .catch(() => {});
      }
    } catch (_) {}

    this.animationId = requestAnimationFrame(draw);
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.stopBackgroundStreaming();
  }

  destroy() {
    this.stop();
    
    if (this.visibilityHandler) {
      document.removeEventListener("visibilitychange", this.visibilityHandler);
      this.visibilityHandler = null;
    }

    if (this.outputStream) {
      this.outputStream.getTracks().forEach(track => track.stop());
      this.outputStream = null;
    }

    if (this.outputCanvas) {
      this.outputCanvas.remove();
      this.outputCanvas = null;
    }

    this.outputCtx = null;
    this.currentSource = null;
    this.pendingSource = null;
    this.initialized = false;
  }

  private startBackgroundStreaming() {
    if (!this.outputCanvas || !this.backgroundOptions || this.backgroundTimer)
      return;

    const fps = this.backgroundOptions.fps ?? STREAMING_CONFIG.FPS;

    if (this.backgroundOptions.enableComplexityManagement) {
      const canvasForAnalysis =
        this.currentSource?.kind === "canvas"
          ? (this.currentSource.element as HTMLCanvasElement)
          : this.outputCanvas;
      streamComplexityManager.startMonitoring(
        canvasForAnalysis,
        this.backgroundOptions.complexityOptions || {},
      );
    }

    this.backgroundTimer = setInterval(
      () => {
        if (this.backgroundOptions?.onBackgroundFrame) {
          try {
            this.backgroundOptions.onBackgroundFrame();
          } catch (_) {}
        }

        const track = this.outputStream?.getVideoTracks()[0];
        if (track && typeof (track as any).requestFrame === "function") {
          try {
            (track as any).requestFrame();
          } catch (_) {}
        }
      },
      Math.max(10, Math.floor(1000 / fps)),
    );
  }

  private stopBackgroundStreaming() {
    if (this.backgroundTimer) {
      clearInterval(this.backgroundTimer);
      this.backgroundTimer = null;
    }
    if (this.backgroundOptions?.enableComplexityManagement) {
      streamComplexityManager.stopMonitoring();
    }
  }

  private updateBackgroundStreaming() {
    if (this.visibilityHandler) {
      document.removeEventListener("visibilitychange", this.visibilityHandler);
      this.visibilityHandler = null;
    }

    if (!this.backgroundOptions) {
      this.stopBackgroundStreaming();
      return;
    }

    this.visibilityHandler = () => {
      if (!this.backgroundOptions) return;
      if (document.hidden) {
        this.startBackgroundStreaming();
      } else {
        this.stopBackgroundStreaming();
        try {
          this.start();

          if (this.currentSource?.kind === "video") {
            const v = this.currentSource.element as HTMLVideoElement;
            if (v.paused) {
              v.play().catch(() => {});
            }
          }

          const track = this.outputStream?.getVideoTracks()[0] as any;
          if (track && typeof track.requestFrame === "function") {
            let kicks = 0;
            const kick = () => {
              try {
                track.requestFrame();
              } catch (_) {}
              if (++kicks < 5) setTimeout(kick, 30);
            };
            kick();
          }
        } catch (_) {}
      }
    };

    document.addEventListener("visibilitychange", this.visibilityHandler);

    if (typeof document !== "undefined") {
      if (document.hidden) {
        this.startBackgroundStreaming();
      } else {
        this.stopBackgroundStreaming();
      }
    }
  }

  private isSourceReady(source: StreamSource): boolean {
    const el = source.element as HTMLCanvasElement | HTMLVideoElement;
    if (source.kind === "video") {
      const v = el as HTMLVideoElement;
      return (
        typeof v.readyState === "number" &&
        v.readyState >= 2 &&
        (v.videoWidth || 0) > 0 &&
        (v.videoHeight || 0) > 0
      );
    }
    const c = el as HTMLCanvasElement;
    return (c.width || 0) > 0 && (c.height || 0) > 0;
  }

  private blitSource(source: StreamSource, alpha: number) {
    if (!this.outputCtx || !this.outputCanvas) return;
    const ctx = this.outputCtx;
    const w = this.outputCanvas.width;
    const h = this.outputCanvas.height;

    const el = source.element as HTMLCanvasElement | HTMLVideoElement;
    const sw = (el as any).videoWidth ?? (el as HTMLCanvasElement).width;
    const sh = (el as any).videoHeight ?? (el as HTMLCanvasElement).height;
    if (!sw || !sh) return;

    const scale = Math.min(w / sw, h / sh);
    const dw = Math.floor(sw * scale);
    const dh = Math.floor(sh * scale);
    const dx = Math.floor((w - dw) / 2);
    const dy = Math.floor((h - dh) / 2);

    const prevAlpha = ctx.globalAlpha;
    try {
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.drawImage(el as any, dx, dy, dw, dh);
    } catch (_) {
    } finally {
      ctx.globalAlpha = prevAlpha;
    }
  }
}

export const streamOrchestrator = new StreamOrchestrator();

export { StreamOrchestrator };
