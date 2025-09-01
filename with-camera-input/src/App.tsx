import { useState } from "react";
import { CameraSwitcher } from "./components/CameraInput";

const AdvancedExample = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentMode, setCurrentMode] = useState<"camera" | "screenshare">(
    "camera"
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-800 mb-4">
          Camera and Screen Share Input Demo
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Experience seamless camera and screen sharing with our advanced input
          system. Switch between camera and screen share modes with automatic
          stream management.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800">Video Input</h2>
          <p className="text-sm text-slate-600 mt-1">
            {currentMode === "camera" && "Camera mode"}
            {currentMode === "screenshare" && "Screen sharing mode"}
            {isStreaming && " • Streaming"}
          </p>
        </div>

        <div className="p-6">
          <div className="aspect-video bg-slate-100 rounded-xl overflow-hidden border-2 border-slate-200">
            <CameraSwitcher
              autoStartCamera={true}
              onStreamReady={(stream) => {
                console.log("Camera stream ready:", stream.id);
                setIsStreaming(true);
              }}
              onModeChange={(mode) => {
                console.log("Mode changed to:", mode);
                setCurrentMode(mode);
                setIsStreaming(true);
              }}
              onError={(error) => {
                console.error("Camera error:", error);
                setIsStreaming(false);
              }}
              backgroundOptions={{
                enableComplexityManagement: true,
                complexityOptions: {
                  targetComplexity: 0.3,
                },
              }}
            />
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center space-x-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  isStreaming ? "bg-green-500 animate-pulse" : "bg-slate-300"
                }`}
              ></div>
              <span className="text-sm font-medium text-slate-700">
                {isStreaming ? "Live" : "Stopped"}
              </span>
            </div>

            <div className="text-sm text-slate-600">
              {currentMode === "camera" && "📷 Camera Mode"}
              {currentMode === "screenshare" && "🖥️ Screen Share Mode"}
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-3">
            Features
          </h3>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              Auto-switching between camera and screen share
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              Real-time stream complexity management
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              Built-in error handling and recovery
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              Responsive design for all devices
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-3">
            Controls
          </h3>
          <div className="space-y-3 text-sm text-slate-600">
            <p>
              <span className="font-medium">Camera:</span> Click the camera
              button to start your webcam
            </p>
            <p>
              <span className="font-medium">Screen Share:</span> Click screen
              share to capture your screen
            </p>
            <p>
              <span className="font-medium">Auto Switch:</span> Seamlessly
              switch between input modes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-center">
          <AdvancedExample />
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-sm border-t border-slate-200 mt-12">
        <div className="container mx-auto px-6 py-4">
          <div className="text-center text-sm text-slate-600">
            <p>Built with React, TypeScript, and Tailwind CSS</p>
            <p className="mt-1">
              Use your camera or screen share to test the video streaming
              capabilities
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
