import { useState, useCallback } from "react";
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
 * Advanced example with multiple visualizers and complex interactions
 */
export function AdvancedExample() {
  const [selectedVisualizer, setSelectedVisualizer] = useState<
    "chrome-blob" | "waveform" | "spectrum" | "particles"
  >("chrome-blob");
  const [audioHistory, setAudioHistory] = useState<AudioLevels[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [maxAudioLevel, setMaxAudioLevel] = useState(0);

  const handleAudioAnalysis = useCallback((levels: AudioLevels) => {
    // Track audio history for waveform
    setAudioHistory((prev) => {
      const newHistory = [...prev, levels];
      return newHistory.slice(-100); // Keep last 100 samples
    });

    // Track max level
    setMaxAudioLevel((prev) => Math.max(prev, levels.overall));
  }, []);

  const waveformRender = (
    ctx: CanvasRenderingContext2D,
    audioLevels: AudioLevels
  ) => {
    // Clear with light background
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const centerY = height / 2;

    // Draw waveform from history
    if (audioHistory.length > 1) {
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 2;
      ctx.beginPath();

      audioHistory.forEach((levels, index) => {
        const x = (index / audioHistory.length) * width;
        const y = centerY - levels.overall * centerY;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
    }

    // Draw current level indicator
    ctx.fillStyle = "#ef4444";
    const currentY = centerY - audioLevels.overall * centerY;
    ctx.fillRect(width - 4, currentY - 2, 4, 4);
  };

  const spectrumRender = (
    ctx: CanvasRenderingContext2D,
    audioLevels: AudioLevels
  ) => {
    // Clear with light background
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const barWidth = width / 4;
    const levels = [
      audioLevels.low,
      audioLevels.mid,
      audioLevels.high,
      audioLevels.overall,
    ];
    const colors = ["#ef4444", "#eab308", "#22c55e", "#3b82f6"];

    levels.forEach((level, index) => {
      const barHeight = level * height;
      const x = index * barWidth;

      // Gradient
      const gradient = ctx.createLinearGradient(
        0,
        height,
        0,
        height - barHeight
      );
      gradient.addColorStop(0, colors[index]);
      gradient.addColorStop(1, colors[index] + "40");

      ctx.fillStyle = gradient;
      ctx.fillRect(x, height - barHeight, barWidth - 2, barHeight);

      // Bar outline
      ctx.strokeStyle = colors[index];
      ctx.lineWidth = 1;
      ctx.strokeRect(x, height - barHeight, barWidth - 2, barHeight);
    });
  };

  const particlesRender = (
    ctx: CanvasRenderingContext2D,
    audioLevels: AudioLevels
  ) => {
    // Clear with light background
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    const particleCount = Math.floor(audioLevels.overall * 50);

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const distance = audioLevels.overall * 150;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;

      ctx.fillStyle = `hsl(${(i / particleCount) * 360}, 70%, 60%)`;
      ctx.beginPath();
      ctx.arc(x, y, 2 + audioLevels.overall * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const getCustomRender = () => {
    switch (selectedVisualizer) {
      case "waveform":
        return waveformRender;
      case "spectrum":
        return spectrumRender;
      case "particles":
        return particlesRender;
      default:
        return undefined;
    }
  };

  const resetStats = () => {
    setAudioHistory([]);
    setMaxAudioLevel(0);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">
          Advanced Audio Workshop
        </h2>
        <p className="text-slate-600">
          Multiple visualizers, audio analysis, and interactive controls
        </p>
      </div>

      <AudioInput
        defaultDemoAudioPath="/demo.mp3"
        onAudioAnalysis={handleAudioAnalysis}
      >
        {/* Visualizer Selection */}
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {[
            { key: "chrome-blob", label: "Chrome Blob" },
            { key: "waveform", label: "Waveform" },
            { key: "spectrum", label: "Spectrum" },
            { key: "particles", label: "Particles" },
          ].map(({ key, label }) => (
            <Button
              key={key}
              variant={selectedVisualizer === key ? "default" : "outline"}
              onClick={() => setSelectedVisualizer(key as any)}
              className="min-w-[100px]"
            >
              {label}
            </Button>
          ))}
        </div>

        {/* Main Visualizer */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <AudioInputPreviewCanvas
              key={selectedVisualizer} // Force re-render when mode changes
              width={500}
              height={400}
              renderMode={
                selectedVisualizer === "chrome-blob" ? "chrome-blob" : "custom"
              }
              customRender={getCustomRender()}
              className="border border-slate-300 rounded-lg shadow-2xl bg-white"
              audioReactivityMultiplier={1.5}
              enableStreaming={selectedVisualizer === "chrome-blob"} // Only enable streaming for chrome-blob
            />
            <div className="absolute top-2 left-2 bg-white/90 px-2 py-1 rounded text-xs text-slate-900 shadow-sm">
              {selectedVisualizer.charAt(0).toUpperCase() +
                selectedVisualizer.slice(1)}{" "}
              Mode
            </div>
          </div>
        </div>

        {/* Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Audio Sources */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-slate-900">
              Audio Sources
            </h4>
            <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-3 shadow-sm">
              <AudioInputMicrophone
                className="w-full"
                onStart={() => setIsRecording(true)}
                onStop={() => setIsRecording(false)}
              />
              <AudioInputDemoMp3 className="w-full" />

              {isRecording && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  Recording
                </div>
              )}
            </div>
          </div>

          {/* Audio Controls */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-slate-900">Controls</h4>
            <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-4 shadow-sm">
              <AudioInputControls />
              <Button
                variant="outline"
                onClick={resetStats}
                className="w-full text-xs"
              >
                Reset Stats
              </Button>
            </div>
          </div>

          {/* Audio Levels */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-slate-900">
              Live Levels
            </h4>
            <AudioInputLevels
              showValues={true}
              className="bg-white border border-slate-200 shadow-sm"
            />
          </div>

          {/* Statistics */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-slate-900">Statistics</h4>
            <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-3 shadow-sm">
              <div className="text-sm">
                <div className="text-slate-600">Max Level</div>
                <div className="text-slate-900 font-mono">
                  {(maxAudioLevel * 100).toFixed(1)}%
                </div>
              </div>

              <div className="text-sm">
                <div className="text-slate-600">History Size</div>
                <div className="text-slate-900 font-mono">
                  {audioHistory.length}/100
                </div>
              </div>

              <div className="text-sm">
                <div className="text-slate-600">Visualizer</div>
                <div className="text-slate-900 capitalize">
                  {selectedVisualizer}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mini Visualizers Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {[
            { mode: "chrome-blob", title: "Chrome Blob", id: "mini-chrome" },
            {
              mode: "custom",
              title: "Waveform",
              render: waveformRender,
              id: "mini-waveform",
            },
            {
              mode: "custom",
              title: "Spectrum",
              render: spectrumRender,
              id: "mini-spectrum",
            },
            {
              mode: "custom",
              title: "Particles",
              render: particlesRender,
              id: "mini-particles",
            },
          ].map(({ mode, title, render, id }) => (
            <div key={id} className="text-center">
              <h5 className="text-sm font-medium text-slate-900 mb-2">
                {title}
              </h5>
              <AudioInputPreviewCanvas
                key={id}
                width={150}
                height={120}
                renderMode={mode as any}
                customRender={render}
                className="border border-slate-300 rounded-lg bg-white mx-auto shadow-sm"
                audioReactivityMultiplier={0.8}
                enableStreaming={false}
              />
            </div>
          ))}
        </div>
      </AudioInput>
    </div>
  );
}
