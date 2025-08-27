# DrawingCanvas Example

A React drawing canvas example with WebRTC streaming capabilities. This example demonstrates a feature-rich drawing component with multiple tools, recording capabilities, and real-time streaming support.

## Features

- 🎨 **Drawing Tools**: Brush, line, circle, and fill tools
- 🎭 **Fading Effect**: Optional fading animation while drawing
- ↩️ **Undo/Redo**: Built-in history management
- 🎥 **WebRTC Streaming**: Stream canvas content via MediaStream API
- 📱 **Touch Support**: Works on mobile devices
- 🎯 **Fully Typed**: Complete TypeScript support
- 🔧 **Customizable**: Flexible API for customization
- 🚀 **Zero Dependencies**: Only requires React

## Getting Started

### Installation

Clone the repository and install dependencies:

```bash
# Clone the repository
git clone <repository-url>
cd daydream-examples/with-drawing-canvas

# Install dependencies
pnpm install
```

### Running the Example

Start the development server:

```bash
pnpm run dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

### Available Scripts

- `pnpm run dev` - Start the development server
- `pnpm run build` - Build for production
- `pnpm run preview` - Preview the production build locally

## Example Usage

The example app includes four different demonstrations:

1. **Basic Canvas** - Simple drawing canvas with default settings
2. **Custom Colors** - Canvas with a custom color palette
3. **Recording** - Record your drawing session and download as video
4. **Live Stream** - WebRTC integration showing canvas as a live video stream

### Quick Start Code

```tsx
import React from "react";
import { DrawingCanvas } from "./components/DrawingCanvas";

function App() {
  const handleStreamReady = (stream: MediaStream) => {
    console.log("Stream ready:", stream);
    // Use the stream for WebRTC, recording, etc.
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      <DrawingCanvas
        onStreamReady={handleStreamReady}
        initialColor="#FF0000"
        initialBrushSize={15}
      />
    </div>
  );
}
```

## Basic Styling

The component uses inline styles by default, but you can add your own CSS for a better look:

```css
/* Add to your global CSS or component styles */
.drawing-canvas-container {
  background-color: #f5f5f5;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Style the canvas */
.custom-canvas {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
```

## API Reference

### DrawingCanvas Props

| Prop                        | Type                                   | Default     | Description                              |
| --------------------------- | -------------------------------------- | ----------- | ---------------------------------------- |
| `onStreamReady`             | `(stream: MediaStream) => void`        | -           | Callback when the canvas stream is ready |
| `width`                     | `number`                               | `512`       | Canvas width in pixels                   |
| `height`                    | `number`                               | `512`       | Canvas height in pixels                  |
| `fps`                       | `number`                               | `30`        | Frame rate for the stream                |
| `initialBrushSize`          | `number`                               | `20`        | Initial brush size                       |
| `initialColor`              | `string`                               | `"#000000"` | Initial color (hex format)               |
| `customColors`              | `Array<{name: string, value: string}>` | -           | Custom color palette                     |
| `enableStreaming`           | `boolean`                              | `true`      | Enable/disable streaming features        |
| `enableBackgroundStreaming` | `boolean`                              | `true`      | Keep stream active when tab is hidden    |
| `className`                 | `string`                               | `""`        | Container CSS class                      |
| `canvasClassName`           | `string`                               | `""`        | Canvas element CSS class                 |
| `onDrawingStart`            | `() => void`                           | -           | Called when drawing starts               |
| `onDrawingEnd`              | `() => void`                           | -           | Called when drawing ends                 |
| `onClear`                   | `() => void`                           | -           | Called when canvas is cleared            |
| `onUndo`                    | `() => void`                           | -           | Called when undo is performed            |
| `maxHistorySize`            | `number`                               | `20`        | Maximum undo history size                |

## Advanced Examples

### Custom Color Palette

```tsx
const customColors = [
  { name: "Ocean Blue", value: "#0077BE" },
  { name: "Forest Green", value: "#228B22" },
  { name: "Sunset Orange", value: "#FF6B35" },
  { name: "Royal Purple", value: "#663399" },
];

<DrawingCanvas customColors={customColors} initialColor="#0077BE" />;
```

### WebRTC Video Call Integration

```tsx
function VideoCallWithDrawing() {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);

  const handleStreamReady = (stream: MediaStream) => {
    setLocalStream(stream);

    // Add stream to peer connection
    if (peerConnection.current) {
      stream.getTracks().forEach((track) => {
        peerConnection.current!.addTrack(track, stream);
      });
    }
  };

  return (
    <div>
      <DrawingCanvas
        onStreamReady={handleStreamReady}
        enableStreaming={true}
        enableBackgroundStreaming={true}
      />

      {localStream && (
        <video
          autoPlay
          muted
          srcObject={localStream}
          style={{ width: "200px", height: "200px" }}
        />
      )}
    </div>
  );
}
```

### Recording Canvas Content

```tsx
function RecordableCanvas() {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  const handleStreamReady = (stream: MediaStream) => {
    mediaRecorder.current = new MediaRecorder(stream, {
      mimeType: "video/webm",
    });

    mediaRecorder.current.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.current.push(e.data);
      }
    };

    mediaRecorder.current.onstop = () => {
      const blob = new Blob(chunks.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "drawing.webm";
      a.click();
      chunks.current = [];
    };
  };

  const toggleRecording = () => {
    if (!mediaRecorder.current) return;

    if (isRecording) {
      mediaRecorder.current.stop();
    } else {
      mediaRecorder.current.start();
    }
    setIsRecording(!isRecording);
  };

  return (
    <div>
      <button onClick={toggleRecording}>
        {isRecording ? "Stop Recording" : "Start Recording"}
      </button>
      <DrawingCanvas onStreamReady={handleStreamReady} />
    </div>
  );
}
```

### Custom Layout with Individual Components

```tsx
import {
  DrawingCanvas,
  ColorPalette,
  BrushControls,
  ToolSelector,
  useBackgroundStreaming,
} from "./components/DrawingCanvas";

function CustomDrawingApp() {
  const [selectedTool, setSelectedTool] = useState<DrawingTool>("brush");
  const [brushSize, setBrushSize] = useState(20);
  const [selectedColor, setSelectedColor] = useState("#000000");

  // Build your own layout using the exported components
  return (
    <div className="custom-layout">
      <div className="toolbar">
        <ToolSelector
          selectedTool={selectedTool}
          onToolChange={setSelectedTool}
        />
        <ColorPalette
          selectedColor={selectedColor}
          onColorChange={setSelectedColor}
        />
      </div>

      <div className="canvas-area">
        {/* Use the main component or build your own */}
        <DrawingCanvas
          initialBrushSize={brushSize}
          initialColor={selectedColor}
        />
      </div>

      <div className="controls">
        <BrushControls
          brushSize={brushSize}
          onBrushSizeChange={setBrushSize}
          fadingEnabled={false}
          onFadingToggle={() => {}}
          canUndo={false}
          onUndo={() => {}}
          onClear={() => {}}
        />
      </div>
    </div>
  );
}
```

### Collaborative Drawing (Basic Example)

```tsx
function CollaborativeCanvas() {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket("ws://your-server.com");
    setSocket(ws);

    return () => ws.close();
  }, []);

  const handleDrawingEnd = () => {
    // Send canvas state to other users
    const canvas = document.querySelector("canvas");
    if (canvas && socket) {
      const dataURL = canvas.toDataURL();
      socket.send(
        JSON.stringify({
          type: "canvas-update",
          data: dataURL,
        })
      );
    }
  };

  return (
    <DrawingCanvas
      onDrawingEnd={handleDrawingEnd}
      onClear={handleDrawingEnd}
      onUndo={handleDrawingEnd}
    />
  );
}
```

## Streaming Integration

The component includes built-in support for WebRTC streaming. Here's how it works:

1. **Automatic Stream Creation**: When the component mounts, it automatically creates a MediaStream from the canvas
2. **Silent Audio Track**: Adds a silent audio track for better WebRTC compatibility
3. **Background Streaming**: Keeps the stream active even when the tab is in the background
4. **Stream Stability**: Includes validation to ensure the stream is stable before use

### Stream Configuration

```tsx
<DrawingCanvas
  fps={60} // Higher FPS for smoother streaming
  enableStreaming={true}
  enableBackgroundStreaming={true}
  onStreamReady={(stream) => {
    // Stream includes both video and audio tracks
    const videoTrack = stream.getVideoTracks()[0];
    const audioTrack = stream.getAudioTracks()[0]; // Silent audio

    console.log("Video track:", videoTrack.getSettings());
  }}
/>
```

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (iOS 14.5+)
- Mobile browsers: Touch events supported

## Performance Considerations

1. **Canvas Size**: Larger canvases require more memory and processing power
2. **Stream FPS**: Higher FPS increases CPU usage
3. **History Size**: Large history sizes use more memory
4. **Background Streaming**: Disable if not needed to save resources

## Contributing

This is an example package. Feel free to copy and modify it for your own use.

## License

MIT
