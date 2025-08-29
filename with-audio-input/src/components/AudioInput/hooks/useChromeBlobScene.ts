import { useCallback, useRef, useState, useEffect } from "react";
import type * as THREE from "three";
import { STREAMING_CONFIG } from "../config/streamingConfig";
import type { AudioLevels } from "./useAudioEngine";

export interface ChromeBlobParameters {
  diameter: number;
  frequency: number;
  intensity: number;
  noiseScale: number;
  segments: number;
  waveSpeed: number;
  rotationSpeed: number;
}

export interface UseChromeBlobSceneOptions {
  width?: number;
  height?: number;
  audioReactivity?: number;
  onSceneReady?: () => void;
  chromeEnvPath?: string;
}

export function useChromeBlobScene(
  canvasRef: { current: HTMLCanvasElement | null },
  options: UseChromeBlobSceneOptions = {}
) {
  const {
    width = STREAMING_CONFIG.WIDTH,
    height = STREAMING_CONFIG.HEIGHT,
    audioReactivity = 1.0,
    onSceneReady,
    chromeEnvPath = "/assets/chrome-env.png",
  } = options;

  const THREERef = useRef<typeof THREE | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const chromeBlobMeshRef = useRef<THREE.Mesh | null>(null);
  const timeRef = useRef(0);
  const originalPositionsRef = useRef<Float32Array | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);

  const [parameters, setParameters] = useState<ChromeBlobParameters>({
    diameter: 1.0,
    frequency: 1.0,
    intensity: 0.1,
    noiseScale: 1.0,
    segments: 128,
    waveSpeed: 1.0,
    rotationSpeed: 1.0,
  });

  const baseParametersRef = useRef<ChromeBlobParameters>({
    diameter: 1.0,
    frequency: 1.0,
    intensity: 0.1,
    noiseScale: 1.0,
    segments: 128,
    waveSpeed: 1.0,
    rotationSpeed: 1.0,
  });

  const smoothedLowRef = useRef(0);
  const smoothedHighRef = useRef(0);

  // Load Three.js
  useEffect(() => {
    const loadThree = async () => {
      try {
        const THREE = await import("three");
        THREERef.current = THREE;
        setIsLoaded(true);
      } catch (error) {
        console.error("Failed to load Three.js:", error);
      }
    };

    if (typeof window !== "undefined") {
      loadThree();
    }
  }, []);

  const noise3D = useCallback(
    (x: number, y: number, z: number, scale: number, time: number) => {
      const octave1 =
        Math.sin(x * scale + time) *
        Math.cos(y * scale * 1.1 + time * 0.7) *
        Math.sin(z * scale * 0.9 + time * 1.3);
      const octave2 =
        Math.sin(x * scale * 2.1 + time * 1.4) *
        Math.cos(y * scale * 1.7 + time * 0.9) *
        Math.sin(z * scale * 2.3 + time * 0.6);
      const octave3 =
        Math.sin(x * scale * 4.2 + time * 0.8) *
        Math.cos(y * scale * 3.9 + time * 1.6) *
        Math.sin(z * scale * 3.1 + time * 2.1);
      const octave4 =
        Math.sin(x * scale * 8.1 + time * 2.2) *
        Math.cos(y * scale * 7.3 + time * 1.1) *
        Math.sin(z * scale * 6.7 + time * 0.4);

      return (
        octave1 * 0.5 + octave2 * 0.25 + octave3 * 0.125 + octave4 * 0.0625
      );
    },
    []
  );

  const createChromeBlobGeometry = useCallback(() => {
    if (!THREERef.current) return null;
    const THREE = THREERef.current;

    const geometry = new THREE.SphereGeometry(
      parameters.diameter / 2,
      parameters.segments,
      parameters.segments / 2
    );

    const positions = geometry.attributes.position.array;
    originalPositionsRef.current = new Float32Array(positions.length);
    originalPositionsRef.current.set(positions);

    return geometry;
  }, [parameters.diameter, parameters.segments]);

  const createChromeMaterial = useCallback(() => {
    if (!THREERef.current) return null;
    const THREE = THREERef.current;

    // Create a chrome-like material without environment map
    const material = new THREE.MeshStandardMaterial({
      color: 0xdddddd,
      metalness: 1.0,
      roughness: 0.05,
      envMapIntensity: 1.5,
    });

    // Try to load environment map if available, but don't fail if it doesn't exist
    try {
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(
        chromeEnvPath,
        (texture) => {
          texture.mapping = THREE.EquirectangularReflectionMapping;
          material.envMap = texture;
          material.needsUpdate = true;
          if (rendererRef.current && sceneRef.current && cameraRef.current) {
            rendererRef.current.render(sceneRef.current, cameraRef.current);
          }
        },
        undefined,
        (error: unknown) => {
          console.warn(
            "Environment map not found, using basic chrome material:",
            error
          );
          // Material will still work without envMap
        }
      );
    } catch (error) {
      console.warn("Could not load texture loader:", error);
    }

    return material;
  }, [chromeEnvPath]);

  const applyDeformations = useCallback(() => {
    if (
      !chromeBlobMeshRef.current ||
      !originalPositionsRef.current ||
      !THREERef.current
    )
      return;

    const geometry = chromeBlobMeshRef.current.geometry as THREE.BufferGeometry;
    const positions = geometry.attributes.position.array as Float32Array;
    const originalPositions = originalPositionsRef.current;

    const time = timeRef.current * parameters.waveSpeed;

    for (let i = 0; i < positions.length; i += 3) {
      const x = originalPositions[i];
      const y = originalPositions[i + 1];
      const z = originalPositions[i + 2];

      const radius = Math.sqrt(x * x + y * y + z * z);
      const theta = Math.atan2(y, x);
      const phi = Math.acos(z / radius);

      const noise1 = noise3D(
        x,
        y,
        z,
        parameters.frequency * parameters.noiseScale,
        time
      );
      const noise2 = noise3D(
        x * 1.7,
        y * 1.3,
        z * 2.1,
        parameters.frequency * parameters.noiseScale * 0.6,
        time * 1.4
      );
      const noise3 = noise3D(
        x * 3.1,
        y * 2.7,
        z * 1.9,
        parameters.frequency * parameters.noiseScale * 0.3,
        time * 0.8
      );

      const flowNoise =
        Math.sin(theta * 3 + time * 0.5) * Math.cos(phi * 2 + time * 0.7) * 0.3;

      const combinedNoise =
        (noise1 * 0.6 + noise2 * 0.3 + noise3 * 0.1 + flowNoise) *
        parameters.intensity;

      const pulse = Math.sin(time * 2) * 0.02 * parameters.intensity;

      const deformation = combinedNoise + pulse;
      const newRadius = radius + deformation;
      const factor = newRadius / radius;

      positions[i] = x * factor;
      positions[i + 1] = y * factor;
      positions[i + 2] = z * factor;
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
  }, [parameters, noise3D]);

  const setupScene = useCallback(() => {
    try {
      const canvas = canvasRef.current;
      if (!canvas || !THREERef.current) return;
      const THREE = THREERef.current;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf8fafc); // Light slate background
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.set(0, 0, 3);
      cameraRef.current = camera;

      const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        preserveDrawingBuffer: true,
        powerPreference: "high-performance",
        failIfMajorPerformanceCaveat: false,
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(1);

      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.NoToneMapping;
      rendererRef.current = renderer;

      // Lighting setup
      const ambientLight = new THREE.AmbientLight(0x404040, 1.2);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
      directionalLight.position.set(5, 5, 5);
      directionalLight.castShadow = true;
      scene.add(directionalLight);

      const directionalLight2 = new THREE.DirectionalLight(0xffffff, 2.0);
      directionalLight2.position.set(-5, -5, -5);
      scene.add(directionalLight2);

      const fillLight1 = new THREE.DirectionalLight(0x4444ff, 1.0);
      fillLight1.position.set(-3, -3, 2);
      scene.add(fillLight1);

      const fillLight2 = new THREE.DirectionalLight(0xff4444, 0.8);
      fillLight2.position.set(2, -4, -3);
      scene.add(fillLight2);

      const pointLight = new THREE.PointLight(0xffffff, 2.0);
      pointLight.position.set(0, 3, 3);
      scene.add(pointLight);

      const pointLight2 = new THREE.PointLight(0xffffff, 1.5);
      pointLight2.position.set(-2, -2, 4);
      scene.add(pointLight2);

      const pointLight3 = new THREE.PointLight(0xccccff, 1.2);
      pointLight3.position.set(3, 0, -2);
      scene.add(pointLight3);

      const geometry = createChromeBlobGeometry();
      const material = createChromeMaterial();

      if (geometry && material) {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        chromeBlobMeshRef.current = mesh;
      }

      setSceneReady(true);
      if (onSceneReady) {
        onSceneReady();
      }
    } catch (error) {
      console.error("Error setting up Chrome Blob scene:", error);
      setSceneReady(false);
    }
  }, [
    width,
    height,
    createChromeBlobGeometry,
    createChromeMaterial,
    onSceneReady,
  ]);

  const updateParametersFromAudio = useCallback(
    (audioLevels: AudioLevels) => {
      const smoothingFactor = 0.1;
      smoothedLowRef.current +=
        (audioLevels.low - smoothedLowRef.current) * smoothingFactor;
      smoothedHighRef.current +=
        (audioLevels.high - smoothedHighRef.current) * smoothingFactor;

      const reactivity = audioReactivity * 1.5;

      const baseDiameter = baseParametersRef.current.diameter;
      const maxDiameterIncrease = (2.0 - baseDiameter) * reactivity;
      const newDiameter =
        baseDiameter + smoothedLowRef.current * maxDiameterIncrease;

      const baseIntensity = baseParametersRef.current.intensity;
      const maxIntensityIncrease = (3.0 - baseIntensity) * reactivity;
      const newIntensity =
        baseIntensity + smoothedHighRef.current * maxIntensityIncrease;

      const baseNoiseScale = baseParametersRef.current.noiseScale;
      const maxNoiseIncrease = (10.0 - baseNoiseScale) * reactivity;
      const newNoiseScale =
        baseNoiseScale + smoothedHighRef.current * maxNoiseIncrease * 0.5;

      setParameters((prev: ChromeBlobParameters) => ({
        ...prev,
        diameter: newDiameter,
        intensity: newIntensity,
        noiseScale: newNoiseScale,
      }));
    },
    [audioReactivity]
  );

  const renderFrame = useCallback(() => {
    try {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) {
        return;
      }

      timeRef.current += 0.016;

      applyDeformations();

      if (chromeBlobMeshRef.current) {
        chromeBlobMeshRef.current.rotation.x +=
          parameters.rotationSpeed * 0.005;
        chromeBlobMeshRef.current.rotation.y +=
          parameters.rotationSpeed * 0.008;
        chromeBlobMeshRef.current.rotation.z +=
          parameters.rotationSpeed * 0.003;
      }

      const gl = rendererRef.current.getContext();
      if (gl && !gl.isContextLost()) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    } catch (error) {
      console.error("Error in renderFrame:", error);
      // Don't crash the entire app, just skip this frame
    }
  }, [applyDeformations, parameters.rotationSpeed]);

  const cleanup = useCallback(() => {
    if (chromeBlobMeshRef.current) {
      const geometry = chromeBlobMeshRef.current.geometry;
      const material = chromeBlobMeshRef.current.material;

      if (geometry) geometry.dispose();
      if (material) {
        if (Array.isArray(material)) {
          material.forEach((m) => m.dispose());
        } else {
          material.dispose();
        }
      }
    }

    if (rendererRef.current) {
      rendererRef.current.dispose();
      rendererRef.current = null;
    }

    // Don't call setSceneReady during cleanup to avoid infinite loops
    sceneRef.current = null;
    cameraRef.current = null;
    chromeBlobMeshRef.current = null;
  }, []);

  const updateParameters = useCallback(
    (newParams: Partial<ChromeBlobParameters>) => {
      setParameters((prev: ChromeBlobParameters) => ({
        ...prev,
        ...newParams,
      }));
    },
    []
  );

  const resetParameters = useCallback(() => {
    setParameters(baseParametersRef.current);
    smoothedLowRef.current = 0;
    smoothedHighRef.current = 0;
  }, []);

  // Update base parameters when not audio-reactive
  const updateBaseParameters = useCallback(
    (params: Partial<ChromeBlobParameters>) => {
      baseParametersRef.current = { ...baseParametersRef.current, ...params };
    },
    []
  );

  // Recreate geometry when diameter or segments change
  useEffect(() => {
    if (chromeBlobMeshRef.current && sceneRef.current && isLoaded) {
      const oldGeometry = chromeBlobMeshRef.current.geometry;
      const newGeometry = createChromeBlobGeometry();
      if (newGeometry) {
        chromeBlobMeshRef.current.geometry = newGeometry;
        oldGeometry.dispose();
      }
    }
  }, [
    parameters.diameter,
    parameters.segments,
    createChromeBlobGeometry,
    isLoaded,
  ]);

  return {
    // State
    isLoaded,
    sceneReady,
    parameters,

    // Actions
    setupScene,
    renderFrame,
    cleanup,
    updateParametersFromAudio,
    updateParameters,
    resetParameters,
    updateBaseParameters,

    // Refs (for advanced usage)
    sceneRef,
    rendererRef,
    cameraRef,
    chromeBlobMeshRef,
  };
}
