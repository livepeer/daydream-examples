export interface FluidCanvasProps {
  /**
   * Callback when the MediaStream is ready for consumption
   */
  onStreamReady?: (stream: MediaStream) => void;

  /**
   * Canvas dimensions
   */
  width?: number;
  height?: number;

  /**
   * Frames per second for the stream
   */
  fps?: number;

  /**
   * Fluid simulation parameters
   */
  splatForce?: number;
  curl?: number;
  velocityDissipation?: number;
  densityDissipation?: number;

  /**
   * Visual parameters
   */
  glow?: number;
  selectedColor?: string;
  backgroundColor?: { r: number; g: number; b: number };

  /**
   * Simulation settings
   */
  simResolution?: number;
  dyeResolution?: number;

  /**
   * Visual effects
   */
  enableBloom?: boolean;
  bloomIntensity?: number;
  enableSunrays?: boolean;
  sunraysWeight?: number;

  /**
   * Interaction settings
   */
  autoGenerateSplats?: boolean;
  initialSplatCount?: number;

  /**
   * Performance settings
   */
  enableBackgroundStreaming?: boolean;

  /**
   * CSS class name for the canvas element
   */
  className?: string;

  /**
   * CSS styles for the canvas element
   */
  style?: React.CSSProperties;
}

export interface FluidConfig {
  SIM_RESOLUTION: number;
  DYE_RESOLUTION: number;
  CAPTURE_RESOLUTION: number;
  DENSITY_DISSIPATION: number;
  VELOCITY_DISSIPATION: number;
  PRESSURE: number;
  PRESSURE_ITERATIONS: number;
  CURL: number;
  SPLAT_RADIUS: number;
  SPLAT_FORCE: number;
  SHADING: boolean;
  COLORFUL: boolean;
  COLOR_UPDATE_SPEED: number;
  PAUSED: boolean;
  BACK_COLOR: { r: number; g: number; b: number };
  TRANSPARENT: boolean;
  BLOOM: boolean;
  BLOOM_ITERATIONS: number;
  BLOOM_RESOLUTION: number;
  BLOOM_INTENSITY: number;
  BLOOM_THRESHOLD: number;
  BLOOM_SOFT_KNEE: number;
  SUNRAYS: boolean;
  SUNRAYS_RESOLUTION: number;
  SUNRAYS_WEIGHT: number;
}

export interface WebGLExtensions {
  formatRGBA: any;
  formatRG: any;
  formatR: any;
  halfFloatTexType: any;
  supportLinearFiltering: any;
}

export interface FluidPointer {
  id: number;
  texcoordX: number;
  texcoordY: number;
  prevTexcoordX: number;
  prevTexcoordY: number;
  deltaX: number;
  deltaY: number;
  down: boolean;
  moved: boolean;
  color: number[];
  lastColorUpdate: number;
}

export interface FBO {
  texture: WebGLTexture;
  fbo: WebGLFramebuffer;
  width: number;
  height: number;
  texelSizeX: number;
  texelSizeY: number;
  attach: (id: number) => number;
}

export interface DoubleFBO {
  width: number;
  height: number;
  texelSizeX: number;
  texelSizeY: number;
  read: FBO;
  write: FBO;
  swap: () => void;
}

export interface FluidBuffers {
  dye?: DoubleFBO;
  velocity?: DoubleFBO;
  divergence?: FBO;
  curl?: FBO;
  pressure?: DoubleFBO;
  bloom?: FBO;
  bloomFramebuffers?: FBO[];
  sunrays?: FBO;
  sunraysTemp?: FBO;
  blit?: (target?: any, clear?: boolean) => void;
}

export interface FluidPrograms {
  splat?: any;
  advection?: any;
  divergence?: any;
  curl?: any;
  vorticity?: any;
  pressure?: any;
  gradientSubtract?: any;
  clear?: any;
  bloomPrefilter?: any;
  bloomBlur?: any;
  bloomFinal?: any;
  sunraysMask?: any;
  sunrays?: any;
  displayMaterial?: any;
}

export interface FluidRefs {
  gl: React.MutableRefObject<WebGLRenderingContext | null>;
  ext: React.MutableRefObject<WebGLExtensions>;
  config: React.MutableRefObject<FluidConfig>;
  pointers: React.MutableRefObject<FluidPointer[]>;
  buffers: React.MutableRefObject<FluidBuffers>;
  programs: React.MutableRefObject<FluidPrograms>;
  lastUpdateTime: React.MutableRefObject<number>;
  colorUpdateTimer: React.MutableRefObject<number>;
  generateColor: () => number[];
}
