# Camera Input Demo

A React component library for seamless camera and screen sharing functionality with automatic stream management, built with TypeScript and Tailwind CSS.

<img width="1897" height="1078" alt="image" src="https://github.com/user-attachments/assets/2e2ab46c-fb10-4125-9cbb-9dc8d13c64d3" />


## 🚀 Features

- **Seamless switching** between camera and screen share modes
- **Auto-start capabilities** for immediate camera access
- **Built-in error handling** and stream recovery
- **Real-time stream complexity management** for optimal performance
- **Responsive design** that works on all devices
- **TypeScript support** with full type definitions
- **Modern UI** with Tailwind CSS styling

## 🎯 Demo

Run the demo locally to see the component in action:

```bash
cd with-camera-input
pnpm install
pnpm dev
```

The demo showcases:

- Camera input with automatic startup
- One-click screen sharing
- Seamless mode switching
- Real-time status indicators
- Error handling and recovery

## 📦 Installation

To use this component in your own project:

1. **Copy the CameraInput component** from `src/components/CameraInput/` to your project
2. **Install dependencies:**
   ```bash
   npm install clsx zustand
   # or
   pnpm add clsx zustand
   ```
3. **Ensure you have Tailwind CSS** configured in your project

## 🛠️ Basic Usage

### Simple Camera Input

```tsx
import { CameraInput } from "./components/CameraInput";

function App() {
  return (
    <div className="w-96 h-96">
      <CameraInput
        autoStart
        onStreamReady={(stream) => {
          console.log("Camera stream ready:", stream.id);
        }}
        onError={(error) => {
          console.error("Camera error:", error);
        }}
      />
    </div>
  );
}
```

### Camera Switcher (Recommended)

```tsx
import { CameraSwitcher } from "./components/CameraInput";

function App() {
  return (
    <div className="aspect-video">
      <CameraSwitcher
        autoStartCamera={true}
        onStreamReady={(stream) => {
          console.log("Stream ready:", stream.id);
        }}
        onModeChange={(mode) => {
          console.log("Mode changed to:", mode);
        }}
        onError={(error) => {
          console.error("Error:", error);
        }}
        backgroundOptions={{
          enableComplexityManagement: true,
          complexityOptions: {
            targetComplexity: 0.3,
          },
        }}
      />
    </div>
  );
}
```

### Screen Share Only

```tsx
import { ScreenShareInput } from "./components/CameraInput";

function App() {
  return (
    <div className="w-96 h-96">
      <ScreenShareInput
        onStreamReady={(stream) => {
          console.log("Screen share ready:", stream.id);
        }}
        onStreamEnded={() => {
          console.log("Screen share ended");
        }}
      />
    </div>
  );
}
```

## 🎛️ Component API

### CameraSwitcher Props

| Prop                     | Type                                        | Default | Description                          |
| ------------------------ | ------------------------------------------- | ------- | ------------------------------------ |
| `autoStartCamera`        | `boolean`                                   | `true`  | Auto-start camera on component mount |
| `cameraConstraints`      | `CameraConstraints`                         | -       | Camera configuration options         |
| `screenShareConstraints` | `ScreenShareConstraints`                    | -       | Screen share configuration options   |
| `backgroundOptions`      | `BackgroundOptions`                         | -       | Stream complexity management options |
| `onStreamReady`          | `(stream: MediaStream) => void`             | -       | Callback when stream is ready        |
| `onModeChange`           | `(mode: "camera" \| "screenshare") => void` | -       | Callback when mode changes           |
| `onError`                | `(error: string) => void`                   | -       | Error callback                       |
| `showSwitchButton`       | `boolean`                                   | `true`  | Show the mode switch button          |
| `className`              | `string`                                    | -       | Additional CSS classes               |
| `buttonClassName`        | `string`                                    | -       | CSS classes for switch button        |

### Camera Constraints

```tsx
interface CameraConstraints {
  width?: { ideal?: number; min?: number; max?: number };
  height?: { ideal?: number; min?: number; max?: number };
  frameRate?: { ideal?: number; min?: number; max?: number };
  facingMode?: "user" | "environment";
  deviceId?: string;
}
```

### Background Options

```tsx
interface BackgroundOptions {
  fps?: number;
  enableComplexityManagement?: boolean;
  complexityOptions?: {
    targetComplexity?: number; // 0-1
    complexityType?: "noise" | "movement" | "dithering" | "adaptive";
    enableAnalysis?: boolean;
  };
}
```

## 🔧 Advanced Usage

### Using Custom Hooks

```tsx
import {
  useCamera,
  useScreenShare,
  useStreamManager,
} from "./components/CameraInput";

function CustomComponent() {
  const { registerSource } = useStreamManager({
    onStreamReady: (stream) => console.log("Stream ready:", stream.id),
  });

  const camera = useCamera({
    autoStart: false,
    onStreamReady: (stream) => {
      // Handle camera stream
      registerSource({
        kind: "video",
        element: videoElement,
        contentHint: "motion",
      });
    },
  });

  const screenShare = useScreenShare({
    onStreamReady: (stream) => {
      // Handle screen share stream
      registerSource({
        kind: "video",
        element: videoElement,
        contentHint: "detail",
      });
    },
  });

  return (
    <div>
      <button onClick={camera.startCamera}>Start Camera</button>
      <button onClick={screenShare.startScreenShare}>Share Screen</button>
      <video ref={videoRef} autoPlay playsInline muted />
    </div>
  );
}
```

### Stream Manager Integration

The `useStreamManager` hook provides:

- Automatic stream orchestration
- Background complexity management
- Performance optimization
- Stream stability monitoring

## 🎨 Styling

The components use Tailwind CSS classes and can be customized:

```tsx
<CameraSwitcher
  className="rounded-2xl shadow-xl"
  buttonClassName="bg-blue-600 hover:bg-blue-700"
  style={{ aspectRatio: "16/9" }}
/>
```

## 📁 File Structure

```
src/components/CameraInput/
├── components/          # React components
│   ├── CameraInput.tsx
│   ├── CameraPreview.tsx
│   ├── CameraSwitcher.tsx
│   ├── ScreenShareInput.tsx
│   └── MultiInputPreview.tsx
├── hooks/              # Custom React hooks
│   ├── useCamera.ts
│   ├── useScreenShare.ts
│   ├── useStreamManager.ts
│   └── useInputFPS.ts
├── types/              # TypeScript definitions
├── utils/              # Utility functions
└── index.ts           # Main exports
```

## 🔒 Permissions

The components handle browser permissions automatically:

- **Camera**: Requests camera access when needed
- **Screen Share**: Prompts for screen capture permission
- **Error Handling**: Graceful fallbacks for denied permissions

## 🌐 Browser Support

- Modern browsers with WebRTC support
- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## 🚦 Getting Started

1. **Copy the component** to your project's components directory
2. **Install dependencies**: `clsx`, `zustand`
3. **Import and use** in your React application
4. **Customize styling** with Tailwind CSS classes

## 💡 Integration Tips

- Use `CameraSwitcher` for the best user experience
- Implement `onError` callbacks for robust error handling
- Configure `backgroundOptions` for performance optimization
- Use `cameraConstraints` to specify video quality requirements

## 🔧 Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Run linting
pnpm lint
```

## 📝 License

This example is part of the daydream-examples repository and is available for educational and reference purposes.
