// Main component
export { DrawingCanvas } from "./components/DrawingCanvas";
export type { DrawingCanvasProps } from "./components/DrawingCanvas";

// Sub-components (in case developers want to build custom layouts)
export { ColorPalette } from "./components/ColorPalette";
export { BrushControls } from "./components/BrushControls";
export { ToolSelector } from "./components/ToolSelector";
export type { DrawingTool } from "./components/ToolSelector";

// UI components (in case developers want to reuse them)
export { Button } from "./ui/button";
export { Slider } from "./ui/slider";
export { Label } from "./ui/label";

// Hooks
export { useBackgroundStreaming } from "./hooks/useBackgroundStreaming";

// Utilities
export { STREAMING_CONFIG } from "./lib/streamingConfig";
export {
  createSilentAudioTrack,
  audioTrackManager,
} from "./lib/audioTrackManager";
export { streamStabilizer } from "./lib/streamStabilizer";
