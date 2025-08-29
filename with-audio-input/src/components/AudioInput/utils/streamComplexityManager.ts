interface ComplexityInjectionOptions {
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

interface ComplexityMetrics {
  spatialComplexity: number;
  temporalComplexity: number;
  overallComplexity: number;
  frameVariance: number;
  isLowComplexity: boolean;
}

class StreamComplexityManager {
  private static instance: StreamComplexityManager | null = null;
  // private _analysisCanvas: HTMLCanvasElement | null = null;
  // private _analysisCtx: CanvasRenderingContext2D | null = null;
  private previousFrameData: ImageData | null = null;
  private complexityHistory: number[] = [];
  private maxHistorySize = 30;
  private isAnalyzing = false;
  private analysisInterval: number | null = null;

  private constructor() {}

  static getInstance(): StreamComplexityManager {
    if (!StreamComplexityManager.instance) {
      StreamComplexityManager.instance = new StreamComplexityManager();
    }
    return StreamComplexityManager.instance;
  }

  /**
   * Inject complexity into a canvas to maintain consistent encoding load
   */
  injectComplexity(
    canvas: HTMLCanvasElement,
    options: ComplexityInjectionOptions = {}
  ): void {
    const {
      targetComplexity = 0.3,
      complexityType = "adaptive",
      maxIntensity = 0.15,
    } = options;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Get current complexity metrics
    const metrics = this.analyzeFrameComplexity(canvas);

    if (metrics.isLowComplexity) {
      const injectionIntensity = Math.min(
        (targetComplexity - metrics.overallComplexity) * 2,
        maxIntensity
      );

      if (injectionIntensity > 0.01) {
        this.applyComplexityInjection(
          ctx,
          canvas,
          complexityType,
          injectionIntensity
        );
      }
    }
  }

  /**
   * Analyze frame complexity to determine if injection is needed
   */
  analyzeFrameComplexity(canvas: HTMLCanvasElement): ComplexityMetrics {
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return {
        spatialComplexity: 0,
        temporalComplexity: 0,
        overallComplexity: 0,
        frameVariance: 0,
        isLowComplexity: true,
      };
    }

    const sampleSize = 128;
    const scale = Math.min(canvas.width, canvas.height) / sampleSize;
    const sampleWidth = Math.floor(canvas.width / scale);
    const sampleHeight = Math.floor(canvas.height / scale);

    const imageData = ctx.getImageData(0, 0, sampleWidth, sampleHeight);
    const spatialComplexity = this.calculateSpatialComplexity(imageData);

    const temporalComplexity = this.calculateTemporalComplexity(imageData);

    const frameVariance = this.calculateFrameVariance(imageData);

    const overallComplexity = (spatialComplexity + temporalComplexity) / 2;

    this.complexityHistory.push(overallComplexity);
    if (this.complexityHistory.length > this.maxHistorySize) {
      this.complexityHistory.shift();
    }

    const isLowComplexity = overallComplexity < 0.2;

    this.previousFrameData = imageData;

    return {
      spatialComplexity,
      temporalComplexity,
      overallComplexity,
      frameVariance,
      isLowComplexity,
    };
  }

  private applyComplexityInjection(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    type: string,
    intensity: number
  ): void {
    const width = canvas.width;
    const height = canvas.height;

    switch (type) {
      case "noise":
        this.injectNoise(ctx, width, height, intensity);
        break;
      case "movement":
        this.injectMovement(ctx, width, height, intensity);
        break;
      case "dithering":
        this.injectDithering(ctx, width, height, intensity);
        break;
      case "adaptive":
        this.injectNoise(ctx, width, height, intensity * 0.3);
        this.injectMovement(ctx, width, height, intensity * 0.4);
        this.injectDithering(ctx, width, height, intensity * 0.3);
        break;
    }
  }

  /**
   * Inject subtle noise for complexity
   */
  private injectNoise(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    intensity: number
  ): void {
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    const time = Date.now() * 0.001;

    for (let i = 0; i < data.length; i += 4) {
      const x = (i / 4) % width;
      const y = Math.floor(i / 4 / width);

      const noise = this.smoothNoise(x * 0.1, y * 0.1, time) * intensity * 255;

      data[i] = noise;
      data[i + 1] = noise;
      data[i + 2] = noise;
      data[i + 3] = Math.floor(intensity * 50);
    }

    ctx.globalCompositeOperation = "overlay";
    ctx.putImageData(imageData, 0, 0);
    ctx.globalCompositeOperation = "source-over";
  }

  /**
   * Inject subtle movement patterns
   */
  private injectMovement(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    intensity: number
  ): void {
    const time = Date.now() * 0.002;
    const numDots = Math.floor(intensity * 20) + 2;

    ctx.save();
    ctx.globalAlpha = intensity * 0.3;
    ctx.globalCompositeOperation = "overlay";

    for (let i = 0; i < numDots; i++) {
      const angle = time + (i * Math.PI * 2) / numDots;
      const radius = Math.min(width, height) * 0.1;
      const x = width / 2 + Math.cos(angle) * radius;
      const y = height / 2 + Math.sin(angle) * radius;

      const dotSize = intensity * 3 + 1;

      ctx.beginPath();
      ctx.arc(x, y, dotSize, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(128, 128, 128, ${intensity})`;
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Inject spatial dithering for encoding complexity
   */
  private injectDithering(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    intensity: number
  ): void {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      if (Math.random() < intensity * 0.1) {
        const dither = (Math.random() - 0.5) * intensity * 20;
        data[i] = Math.max(0, Math.min(255, data[i] + dither));
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + dither));
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + dither));
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  private calculateSpatialComplexity(imageData: ImageData): number {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    let edgeSum = 0;
    let pixelCount = 0;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const i = (y * width + x) * 4;

        const center = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const right = (data[i + 4] + data[i + 5] + data[i + 6]) / 3;
        const bottom =
          (data[i + width * 4] +
            data[i + width * 4 + 1] +
            data[i + width * 4 + 2]) /
          3;

        const gradientX = Math.abs(right - center);
        const gradientY = Math.abs(bottom - center);
        const gradient = Math.sqrt(
          gradientX * gradientX + gradientY * gradientY
        );

        edgeSum += gradient;
        pixelCount++;
      }
    }

    return pixelCount > 0 ? edgeSum / pixelCount / 255 : 0;
  }

  private calculateTemporalComplexity(imageData: ImageData): number {
    if (
      !this.previousFrameData ||
      this.previousFrameData.width !== imageData.width ||
      this.previousFrameData.height !== imageData.height
    ) {
      return 0;
    }

    const currentData = imageData.data;
    const previousData = this.previousFrameData.data;
    let diffSum = 0;
    const pixelCount = currentData.length / 4;

    for (let i = 0; i < currentData.length; i += 4) {
      const currentGray =
        (currentData[i] + currentData[i + 1] + currentData[i + 2]) / 3;
      const previousGray =
        (previousData[i] + previousData[i + 1] + previousData[i + 2]) / 3;
      diffSum += Math.abs(currentGray - previousGray);
    }

    return diffSum / pixelCount / 255;
  }

  private calculateFrameVariance(imageData: ImageData): number {
    const data = imageData.data;
    const pixelCount = data.length / 4;
    let sum = 0;
    let sumSquares = 0;

    for (let i = 0; i < data.length; i += 4) {
      const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
      sum += gray;
      sumSquares += gray * gray;
    }

    const mean = sum / pixelCount;
    const variance = sumSquares / pixelCount - mean * mean;
    return variance / (255 * 255); // Normalize to 0-1
  }

  private smoothNoise(x: number, y: number, z: number): number {
    const intX = Math.floor(x);
    const intY = Math.floor(y);
    const intZ = Math.floor(z);

    const fracX = x - intX;
    const fracY = y - intY;
    const fracZ = z - intZ;

    const hash = (x: number, y: number, z: number) => {
      let h = x * 374761393 + y * 668265263 + z * 1274126177;
      h = (h ^ (h >>> 13)) * 1274126177;
      return ((h ^ (h >>> 16)) & 0x7fffffff) / 0x7fffffff;
    };

    const smoothstep = (t: number) => t * t * (3 - 2 * t);

    const c000 = hash(intX, intY, intZ);
    const c001 = hash(intX, intY, intZ + 1);
    const c010 = hash(intX, intY + 1, intZ);
    const c011 = hash(intX, intY + 1, intZ + 1);
    const c100 = hash(intX + 1, intY, intZ);
    const c101 = hash(intX + 1, intY, intZ + 1);
    const c110 = hash(intX + 1, intY + 1, intZ);
    const c111 = hash(intX + 1, intY + 1, intZ + 1);

    const sx = smoothstep(fracX);
    const sy = smoothstep(fracY);
    const sz = smoothstep(fracZ);

    const nx00 = c000 * (1 - sx) + c100 * sx;
    const nx01 = c001 * (1 - sx) + c101 * sx;
    const nx10 = c010 * (1 - sx) + c110 * sx;
    const nx11 = c011 * (1 - sx) + c111 * sx;

    const nxy0 = nx00 * (1 - sy) + nx10 * sy;
    const nxy1 = nx01 * (1 - sy) + nx11 * sy;

    return nxy0 * (1 - sz) + nxy1 * sz;
  }

  /**
   * Get average complexity over recent history
   */
  getAverageComplexity(): number {
    if (this.complexityHistory.length === 0) return 0;

    const sum = this.complexityHistory.reduce((a, b) => a + b, 0);
    return sum / this.complexityHistory.length;
  }

  startMonitoring(
    canvas: HTMLCanvasElement,
    options: ComplexityInjectionOptions = {}
  ): void {
    if (this.isAnalyzing) return;

    const { analysisInterval = 100 } = options;
    this.isAnalyzing = true;

    this.analysisInterval = setInterval(() => {
      if (canvas && canvas.getContext("2d")) {
        this.injectComplexity(canvas, options);
      }
    }, analysisInterval);
  }

  stopMonitoring(): void {
    this.isAnalyzing = false;

    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
  }

  reset(): void {
    this.stopMonitoring();
    this.complexityHistory = [];
    this.previousFrameData = null;
  }

  getCurrentMetrics(canvas: HTMLCanvasElement): ComplexityMetrics | null {
    try {
      return this.analyzeFrameComplexity(canvas);
    } catch (error) {
      return null;
    }
  }
}

export const streamComplexityManager = StreamComplexityManager.getInstance();

export type { ComplexityInjectionOptions, ComplexityMetrics };
