import { useState } from "react";
import {
  AudioInput,
  AudioInputMicrophone,
  AudioInputDemoMp3,
  AudioInputPreviewCanvas,
  AudioInputLevels,
  AudioInputControls,
  type AudioLevels,
} from "../components/AudioInput";

/**
 * Custom example showing advanced usage and customization
 */
export function CustomExample() {
  const [customAudioReactivity, setCustomAudioReactivity] = useState(0.8);
  const [isStreamReady, setIsStreamReady] = useState(false);

  const handleAudioAnalysis = (levels: AudioLevels) => {
    // Custom audio analysis logic
    if (levels.overall > 0.8) {
      console.log("High audio detected!");
    }
  };

  const customRender = (
    ctx: CanvasRenderingContext2D,
    audioLevels: AudioLevels
  ) => {
    // Clear with light background
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Create a simple visualizer
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY) * 0.8;

    // Draw concentric circles based on audio levels
    const levels = [
      audioLevels.low,
      audioLevels.mid,
      audioLevels.high,
      audioLevels.overall,
    ];
    const colors = ["#ef4444", "#eab308", "#22c55e", "#3b82f6"];

    levels.forEach((level, index) => {
      const radius = maxRadius * (1 - index * 0.2) * (0.3 + level * 0.7);

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = colors[index] + "40"; // Add transparency
      ctx.fill();

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = colors[index];
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">
          Custom Audio Visualizer
        </h2>
        <p className="text-slate-600">
          Advanced customization with multiple visualizers and custom rendering
        </p>
      </div>

      <AudioInput
        defaultDemoAudioPath="/demo.mp3"
        defaultAudioReactivity={customAudioReactivity}
        onStreamReady={(stream) => {
          console.log("Custom stream ready:", stream);
          setIsStreamReady(true);
        }}
        onAudioAnalysis={handleAudioAnalysis}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chrome Blob Preview */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">
                Chrome Blob
              </h3>
              <div className="text-sm text-slate-600">Built-in visualizer</div>
            </div>
            <AudioInputPreviewCanvas
              width={350}
              height={350}
              renderMode="chrome-blob"
              audioReactivityMultiplier={1.2}
              className="border border-slate-300 rounded-lg shadow-lg bg-white"
            />
          </div>

          {/* Custom Visualizer */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">
                Custom Visualizer
              </h3>
              <div className="text-sm text-slate-600">Custom rendering</div>
            </div>
            <AudioInputPreviewCanvas
              width={350}
              height={350}
              renderMode="custom"
              customRender={customRender}
              enableStreaming={false}
              className="border border-slate-300 rounded-lg shadow-lg bg-white"
            />
          </div>
        </div>

        {/* Controls Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="flex flex-col gap-4">
            <h4 className="text-lg font-semibold text-slate-900">
              Audio Sources
            </h4>
            <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-3 shadow-sm">
              <AudioInputMicrophone
                variant="outline"
                className="w-full"
                onStart={() => console.log("Microphone started")}
                onStop={() => console.log("Microphone stopped")}
              />
              <AudioInputDemoMp3
                variant="secondary"
                className="w-full"
                onStart={() => console.log("Demo started")}
                onStop={() => console.log("Demo stopped")}
              />

              {isStreamReady && (
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-2 rounded border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Stream is ready for broadcasting
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-lg font-semibold text-slate-900">Controls</h4>
            <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
              <AudioInputControls
                onReactivityChange={(value) => {
                  setCustomAudioReactivity(value);
                  console.log("Reactivity changed to:", value);
                }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-lg font-semibold text-slate-900">
              Audio Levels
            </h4>
            <AudioInputLevels
              showValues={true}
              levelColors={{
                low: "bg-red-500",
                mid: "bg-yellow-500",
                high: "bg-green-500",
                overall: "bg-blue-500",
              }}
              className="bg-white border border-slate-200 shadow-sm"
            />
          </div>
        </div>
      </AudioInput>
    </div>
  );
}
