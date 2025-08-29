import { useState } from "react";
import {
  AudioInput,
  AudioInputMicrophone,
  AudioInputDemoMp3,
  AudioInputPreviewCanvas,
  AudioInputLevels,
  AudioInputControls,
  type AudioLevels,
  Button,
} from "../components/AudioInput";

/**
 * Debug example for testing and troubleshooting
 */
export function DebugExample() {
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [audioData, setAudioData] = useState<AudioLevels>({
    low: 0,
    mid: 0,
    high: 0,
    overall: 0,
  });

  const addLog = (message: string) => {
    setDebugLogs((prev) => [
      ...prev.slice(-9),
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const handleAudioAnalysis = (levels: AudioLevels) => {
    setAudioData(levels);
    if (levels.overall > 0.1) {
      addLog(`Audio detected - Overall: ${(levels.overall * 100).toFixed(1)}%`);
    }
  };

  const simpleVisualizer = (
    ctx: CanvasRenderingContext2D,
    levels: AudioLevels
  ) => {
    // Clear with light background
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Simple bar visualizer
    const barWidth = ctx.canvas.width / 4;
    const barHeight = ctx.canvas.height;

    const levelValues = [levels.low, levels.mid, levels.high, levels.overall];
    const colors = ["#ef4444", "#eab308", "#22c55e", "#3b82f6"];
    const labels = ["Low", "Mid", "High", "Overall"];

    levelValues.forEach((level, index) => {
      const x = index * barWidth;
      const height = level * barHeight * 0.8;
      const y = barHeight - height;

      // Draw bar
      ctx.fillStyle = colors[index];
      ctx.fillRect(x + 10, y, barWidth - 20, height);

      // Draw label
      ctx.fillStyle = "#ffffff";
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      ctx.fillText(labels[index], x + barWidth / 2, barHeight - 5);

      // Draw value
      ctx.fillText(`${(level * 100).toFixed(0)}%`, x + barWidth / 2, y - 5);
    });
  };

  const clearLogs = () => setDebugLogs([]);

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Debug Mode</h2>
        <p className="text-slate-600">
          Testing and troubleshooting audio input components
        </p>
      </div>

      <AudioInput
        defaultDemoAudioPath="/demo.mp3"
        onStreamReady={(stream) => addLog(`Stream ready: ${stream.id}`)}
        onAudioAnalysis={handleAudioAnalysis}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Visualizer */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-slate-900">
              Simple Visualizer
            </h3>
            <AudioInputPreviewCanvas
              width={400}
              height={300}
              renderMode="custom"
              customRender={simpleVisualizer}
              enableStreaming={false}
              className="border border-slate-300 rounded-lg bg-white shadow-sm"
            />
          </div>

          {/* Debug Info */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">
                Debug Info
              </h3>
              <Button variant="outline" onClick={clearLogs} className="text-xs">
                Clear Logs
              </Button>
            </div>

            <div className="p-4 bg-neutral-800 rounded-lg">
              <h4 className="font-medium text-slate-900 mb-2">
                Real-time Audio Data
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                <div>
                  Low:{" "}
                  <span className="text-red-400">
                    {(audioData.low * 100).toFixed(1)}%
                  </span>
                </div>
                <div>
                  Mid:{" "}
                  <span className="text-yellow-400">
                    {(audioData.mid * 100).toFixed(1)}%
                  </span>
                </div>
                <div>
                  High:{" "}
                  <span className="text-green-400">
                    {(audioData.high * 100).toFixed(1)}%
                  </span>
                </div>
                <div>
                  Overall:{" "}
                  <span className="text-blue-400">
                    {(audioData.overall * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
              <h4 className="font-medium text-slate-900 mb-2">Activity Log</h4>
              <div className="h-32 overflow-y-auto bg-slate-50 p-2 rounded text-xs font-mono border border-slate-200">
                {debugLogs.length === 0 ? (
                  <div className="text-slate-500">No activity yet...</div>
                ) : (
                  debugLogs.map((log, index) => (
                    <div key={index} className="text-green-700">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-slate-900">
              Audio Sources
            </h4>
            <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-3 shadow-sm">
              <AudioInputMicrophone
                className="w-full"
                onStart={() => addLog("Microphone started")}
                onStop={() => addLog("Microphone stopped")}
              />
              <AudioInputDemoMp3
                className="w-full"
                onStart={() => addLog("Demo audio started")}
                onStop={() => addLog("Demo audio stopped")}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-slate-900">Controls</h4>
            <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
              <AudioInputControls
                onReactivityChange={(value) =>
                  addLog(`Reactivity changed: ${value}`)
                }
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-slate-900">
              Audio Levels
            </h4>
            <AudioInputLevels className="bg-white border border-slate-200 shadow-sm" />
          </div>
        </div>
      </AudioInput>
    </div>
  );
}
