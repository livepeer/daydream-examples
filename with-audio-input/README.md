# How to Build an Audio-Reactive App (Component Guide)

https://github.com/user-attachments/assets/5f093260-9bb6-4d05-a47a-d43237255a21


## What you'll build

An `AudioInput` component system that captures microphone or demo audio, analyzes frequency levels in real-time, and renders audio-reactive visualizations to canvas for streaming applications.

## Live Demo

```tsx
import {
  AudioInput,
  AudioInputMicrophone,
  AudioInputDemoMp3,
  AudioInputPreviewCanvas,
  AudioInputLevels,
  AudioInputControls,
} from "./components/AudioInput";

export function AudioVisualizerApp() {
  return (
    <AudioInput defaultDemoAudioPath="/demo.mp3">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Visualizer */}
        <AudioInputPreviewCanvas
          width={400}
          height={400}
          renderMode="chrome-blob"
          className="border border-slate-300 rounded-lg shadow-lg"
        />

        {/* Controls */}
        <div className="space-y-4">
          <AudioInputMicrophone />
          <AudioInputDemoMp3 />
          <AudioInputControls />
          <AudioInputLevels />
        </div>
      </div>
    </AudioInput>
  );
}
```

## Key Ideas

### Component Architecture

- **Provider Pattern**: `AudioInput` wraps child components with audio context
- **Composable Design**: Mix and match audio sources, visualizers, and controls
- **Real-time Analysis**: FFT-based frequency analysis with smoothed bands (Low, Mid, High, Overall)
- **Stream Ready**: Outputs MediaStream for broadcasting/recording

### Audio Sources

- **Microphone**: Real-time microphone input with gain control
- **Demo Audio**: MP3 playback for testing without microphone permissions
- **Automatic Switching**: Components handle source switching seamlessly

### Visualizer Modes

- **Chrome Blob**: 3D WebGL metallic blob with audio-reactive deformations
- **Custom Renderers**: 2D Canvas with your own visualization logic
- **Multiple Types**: Waveform, spectrum analyzer, particle systems, etc.

### Streaming Integration

- **MediaStream Output**: Ready for WebRTC, recording, or broadcasting
- **Background Processing**: Efficient frame capture without blocking UI
- **Stream Stabilization**: Handles canvas stream reliability

## Component API

### AudioInput (Provider)

```tsx
<AudioInput
  defaultDemoAudioPath="/demo.mp3" // Demo audio file path
  defaultAudioReactivity={1.0} // Audio sensitivity
  onStreamReady={(stream) => {}} // MediaStream callback
  onAudioAnalysis={(levels) => {}} // Real-time audio data
>
  {children}
</AudioInput>
```

### AudioInputPreviewCanvas (Visualizer)

```tsx
<AudioInputPreviewCanvas
  width={400}
  height={400}
  renderMode="chrome-blob" | "custom"      // Visualization type
  customRender={(ctx, levels) => {}}       // Custom drawing function
  audioReactivityMultiplier={1.0}         // Sensitivity multiplier
  enableStreaming={true}                   // Enable MediaStream output
/>
```

### Custom Visualizer Example

```tsx
const waveformRender = (ctx: CanvasRenderingContext2D, levels: AudioLevels) => {
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Draw waveform based on levels.overall, levels.low, levels.mid, levels.high
  const centerY = ctx.canvas.height / 2;
  ctx.strokeStyle = "#3b82f6";
  ctx.lineWidth = 2;
  // ... your visualization logic
};

<AudioInputPreviewCanvas renderMode="custom" customRender={waveformRender} />;
```

## UX Tips

### Audio Permissions

- **Demo First**: Provide demo audio so users can try without microphone permissions
- **Clear CTAs**: Use descriptive button labels ("Try with Microphone" vs "Start Audio")
- **Permission Handling**: Show helpful error messages for denied permissions

### Visual Feedback

- **Audio Levels**: Always show real-time audio levels so users know it's working
- **Loading States**: Display loading indicators for WebGL/Chrome Blob initialization
- **Fallback Visualizers**: Provide 2D fallbacks when 3D rendering fails

### Performance

- **Responsive Canvas**: Use appropriate canvas sizes for different screen sizes
- **Streaming Control**: Only enable streaming when needed to reduce CPU usage
- **Error Recovery**: Gracefully degrade from 3D to 2D when WebGL unavailable

### Accessibility

- **Keyboard Navigation**: All controls are keyboard accessible
- **Screen Reader**: Audio levels and controls have proper ARIA labels
- **High Contrast**: Light theme with proper contrast ratios

## Getting Started

1. **Install dependencies:**

   ```bash
   npm install three @radix-ui/react-slider @radix-ui/react-label lucide-react
   ```

2. **Copy the AudioInput component system** from `src/components/AudioInput/`

3. **Add to your app:**

   ```tsx
   import {
     AudioInput,
     AudioInputPreviewCanvas,
     AudioInputMicrophone,
   } from "./AudioInput";

   function App() {
     return (
       <AudioInput>
         <AudioInputPreviewCanvas width={400} height={400} />
         <AudioInputMicrophone />
       </AudioInput>
     );
   }
   ```

4. **Handle the stream:**
   ```tsx
   <AudioInput
     onStreamReady={(stream) => {
       // Send to your streaming service
       console.log("Ready to broadcast:", stream);
     }}
   >
   ```

## Browser Support

- **Chrome/Edge**: Full support (WebGL + Web Audio API)
- **Firefox**: Full support
- **Safari**: Partial support (WebGL limitations, use custom renderers)

**Required APIs**: Web Audio API, MediaDevices API, Canvas 2D, WebGL (optional)
