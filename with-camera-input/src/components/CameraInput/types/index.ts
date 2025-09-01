// Core streaming types
export type SourceKind = "canvas" | "video";

export type StreamSource =
  | {
      kind: "canvas";
      element: HTMLCanvasElement;
      contentHint?: "detail" | "motion" | "";
    }
  | {
      kind: "video";
      element: HTMLVideoElement;
      contentHint?: "detail" | "motion" | "";
    };

export interface StreamValidationOptions {
  minStableFrames?: number;
  timeoutMs?: number;
  validateAudio?: boolean;
}

export interface StreamStabilizationResult {
  isStable: boolean;
  frameCount: number;
  timeElapsed: number;
  error?: string;
}

export interface ComplexityInjectionOptions {
  /** Target complexity level (0-1) */
  targetComplexity?: number;
  /** Type of complexity to inject */
  complexityType?: "noise" | "movement" | "dithering" | "adaptive";
  /** Enable complexity analysis */
  enableAnalysis?: boolean;
  /** Minimum complexity threshold before injection */
  minComplexityThreshold?: number;
  /** Maximum complexity injection intensity */
  maxIntensity?: number;
  /** Analysis sample interval in ms */
  analysisInterval?: number;
}

export interface ComplexityMetrics {
  spatialComplexity: number;
  temporalComplexity: number;
  overallComplexity: number;
  frameVariance: number;
  isLowComplexity: boolean;
}

export interface BackgroundOptions {
  fps?: number;
  enableComplexityManagement?: boolean;
  complexityOptions?: ComplexityInjectionOptions;
  onBackgroundFrame?: () => void;
}

// Camera and screen share specific types
export interface CameraConstraints {
  width?: { ideal?: number; min?: number; max?: number };
  height?: { ideal?: number; min?: number; max?: number };
  frameRate?: { ideal?: number; min?: number; max?: number };
  facingMode?: "user" | "environment";
  deviceId?: string;
}

export interface ScreenShareConstraints {
  width?: { ideal?: number; min?: number; max?: number };
  height?: { ideal?: number; min?: number; max?: number };
  frameRate?: { ideal?: number; min?: number; max?: number };
  cursor?: "always" | "motion" | "never";
  displaySurface?: "application" | "browser" | "monitor" | "window";
}

export interface MediaInputState {
  isActive: boolean;
  isLoading: boolean;
  stream: MediaStream | null;
  error: string | null;
  deviceId?: string;
}

export interface PermissionState {
  camera: "prompt" | "granted" | "denied";
  screenShare: "prompt" | "granted" | "denied";
}

// Input FPS tracking
export interface UseInputFPSOptions {
  stream: MediaStream | null;
  enabled?: boolean;
  updateInterval?: number;
}
