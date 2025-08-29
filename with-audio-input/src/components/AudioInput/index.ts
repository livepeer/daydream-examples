// Main components
export { AudioInput, useAudioInputContext } from "./components/AudioInput";
export { AudioInputMicrophone } from "./components/AudioInputMicrophone";
export { AudioInputDemoMp3 } from "./components/AudioInputDemoMp3";
export { AudioInputPreviewCanvas } from "./components/AudioInputPreviewCanvas";
export { AudioInputLevels } from "./components/AudioInputLevels";
export { AudioInputControls } from "./components/AudioInputControls";
export { AudioInputError } from "./components/AudioInputError";

// Hooks
export { useAudioEngine } from "./hooks/useAudioEngine";
export { useChromeBlobScene } from "./hooks/useChromeBlobScene";
export { useStreamStabilizer } from "./hooks/useStreamStabilizer";
export { useBackgroundStreaming } from "./hooks/useBackgroundStreaming";

// Utils
export { audioTrackManager, createSilentAudioTrack } from "./utils/audioTrackManager";
export { streamStabilizer, createStableCanvasStream, logStreamValidation } from "./utils/streamStabilizer";
export { streamComplexityManager } from "./utils/streamComplexityManager";
export { cn } from "./utils/cn";

// Config
export { STREAMING_CONFIG } from "./config/streamingConfig";

// UI Components (re-export for convenience)
export { Button } from "./ui/button";
export { Slider } from "./ui/slider";
export { Label } from "./ui/label";

// Types
export type { AudioLevels, UseAudioEngineOptions } from "./hooks/useAudioEngine";
export type { ChromeBlobParameters, UseChromeBlobSceneOptions } from "./hooks/useChromeBlobScene";
export type { UseStreamStabilizerOptions } from "./hooks/useStreamStabilizer";
export type { ComplexityInjectionOptions, ComplexityMetrics } from "./utils/streamComplexityManager";
export type { AudioInputContextValue, AudioInputProps } from "./components/AudioInput";
export type { AudioInputMicrophoneProps } from "./components/AudioInputMicrophone";
export type { AudioInputDemoMp3Props } from "./components/AudioInputDemoMp3";
export type { AudioInputPreviewCanvasProps } from "./components/AudioInputPreviewCanvas";
export type { AudioInputLevelsProps } from "./components/AudioInputLevels";
export type { AudioInputControlsProps } from "./components/AudioInputControls";
export type { AudioInputErrorProps } from "./components/AudioInputError";
export type { ButtonProps } from "./ui/button";
