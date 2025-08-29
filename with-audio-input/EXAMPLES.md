# Audio Input Examples

This package contains interactive examples showcasing the AudioInput component system for real-time audio visualization and processing.

## 🎯 Examples Overview

### 1. Basic Example (`BasicExample.tsx`)

**Perfect for beginners**

- Simple audio input setup
- Chrome Blob visualizer
- Basic controls (microphone, demo audio, reactivity)
- Audio level displays

**Features:**

- Easy-to-use interface
- Responsive design
- Real-time audio visualization
- Clean, minimal UI

### 2. Custom Example (`CustomExample.tsx`)

**Advanced customization**

- Side-by-side comparison of Chrome Blob vs Custom visualizer
- Custom circular visualizer with concentric rings
- Enhanced controls with streaming status
- Callback demonstrations

**Features:**

- Custom rendering function
- Audio analysis callbacks
- Stream ready notifications
- Multiple visualizer comparison

### 3. Advanced Example (`AdvancedExample.tsx`)

**Full-featured workshop**

- Multiple visualizer types (Chrome Blob, Waveform, Spectrum, Particles)
- Interactive visualizer switching
- Audio history tracking
- Statistics and analytics
- Mini visualizer previews

**Features:**

- 4 different visualizer types
- Real-time statistics
- Audio history (last 100 samples)
- Interactive controls
- Performance metrics

## 🚀 Getting Started

1. **Install dependencies:**

   ```bash
   npm install
   # or
   pnpm install
   ```

2. **Start the development server:**

   ```bash
   npm run dev
   # or
   pnpm dev
   ```

3. **Open your browser** and navigate to the local development URL

4. **Allow microphone access** when prompted (optional - you can use demo audio instead)

## 🎛️ Component Usage

### Basic Usage

```tsx
import {
  AudioInput,
  AudioInputMicrophone,
  AudioInputPreviewCanvas,
} from "./components/AudioInput";

export function MyComponent() {
  return (
    <AudioInput>
      <AudioInputPreviewCanvas width={400} height={400} />
      <AudioInputMicrophone />
    </AudioInput>
  );
}
```

### Custom Visualizer

```tsx
const customRender = (
  ctx: CanvasRenderingContext2D,
  audioLevels: AudioLevels
) => {
  // Your custom visualization logic here
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  // ... custom rendering
};

<AudioInputPreviewCanvas
  renderMode="custom"
  customRender={customRender}
  width={400}
  height={400}
/>;
```

### Audio Analysis Callbacks

```tsx
<AudioInput
  onAudioAnalysis={(levels) => {
    console.log("Audio levels:", levels);
    // Your custom analysis logic
  }}
  onStreamReady={(stream) => {
    console.log("Stream ready for broadcasting:", stream);
  }}
>
  {/* Your components */}
</AudioInput>
```

## 🎨 Customization Options

### AudioInputPreviewCanvas Props

- `width`, `height`: Canvas dimensions
- `renderMode`: `"chrome-blob"` or `"custom"`
- `customRender`: Custom rendering function
- `audioReactivityMultiplier`: Sensitivity multiplier
- `enableStreaming`: Enable/disable stream output
- `enableBackground`: Background processing

### AudioInputControls Props

- `showReactivityControl`: Show reactivity slider
- `minReactivity`, `maxReactivity`: Reactivity range
- `onReactivityChange`: Reactivity change callback

### AudioInputLevels Props

- `showLabels`, `showValues`: Display options
- `levelColors`: Custom colors for level bars
- `hideWhenInactive`: Auto-hide when no audio

## 🎵 Audio Sources

### Microphone Input

- Real-time microphone audio
- Automatic gain control options
- Permission handling

### Demo Audio

- Built-in demo audio file
- Loop playback
- Cross-origin support

## 🔧 Technical Details

### Audio Analysis

- FFT-based frequency analysis
- Real-time level detection
- Smoothed frequency bands (Low, Mid, High, Overall)
- RMS volume calculation

### Visualization

- WebGL-based Chrome Blob renderer
- Canvas 2D custom renderers
- 60fps animation loops
- Audio-reactive parameters

### Streaming

- MediaStream output
- Background processing
- Stream stabilization
- Broadcasting ready

## 🎯 Use Cases

1. **Live Streaming**: Real-time audio visualization for streams
2. **Music Production**: Audio level monitoring and visualization
3. **Interactive Art**: Audio-reactive visual experiences
4. **Education**: Teaching audio processing concepts
5. **Gaming**: Audio-responsive game elements

## 🛠️ Development

### File Structure

```
src/
├── examples/
│   ├── BasicExample.tsx     # Simple usage
│   ├── CustomExample.tsx    # Advanced customization
│   ├── AdvancedExample.tsx  # Full-featured demo
│   └── index.ts            # Exports
├── components/
│   └── AudioInput/         # Main component system
└── App.tsx                 # Example showcase
```

### Adding New Examples

1. Create a new component in `src/examples/`
2. Export it from `src/examples/index.ts`
3. Add it to the navigation in `App.tsx`

## 📱 Browser Support

- **Chrome/Chromium**: Full support
- **Firefox**: Full support
- **Safari**: Partial support (WebGL limitations)
- **Edge**: Full support

### Required APIs

- Web Audio API
- MediaDevices API
- WebGL (for Chrome Blob)
- Canvas 2D (for custom renderers)

## 🔍 Troubleshooting

### Common Issues

1. **Microphone not working**

   - Check browser permissions
   - Ensure HTTPS (required for microphone access)
   - Try demo audio instead

2. **Chrome Blob not loading**

   - Check WebGL support
   - Try custom visualizer mode
   - Check console for errors

3. **No audio visualization**
   - Ensure audio is playing/recording
   - Check audio levels in browser
   - Verify component setup

### Performance Tips

- Use lower canvas resolutions for better performance
- Disable streaming if not needed
- Reduce `audioReactivityMultiplier` for smoother animation

## 🤝 Contributing

Feel free to:

- Add new visualizer types
- Improve existing examples
- Fix bugs and issues
- Enhance documentation

## 📄 License

This project is part of the daydream-examples repository.
