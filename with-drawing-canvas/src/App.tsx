import { useState, useRef } from "react";
import { DrawingCanvas } from "./components/DrawingCanvas";
import "./App.css";

// Custom color palette
const customColors = [
  { name: "Ocean Blue", value: "#0077BE" },
  { name: "Forest Green", value: "#228B22" },
  { name: "Sunset Orange", value: "#FF6B35" },
  { name: "Royal Purple", value: "#663399" },
  { name: "Hot Pink", value: "#FF69B4" },
  { name: "Golden Yellow", value: "#FFD700" },
];

function App() {
  const [activeExample, setActiveExample] = useState<
    "basic" | "custom" | "recording" | "streaming"
  >("streaming");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  // Basic example stream handler
  const handleBasicStreamReady = (stream: MediaStream) => {
    console.log("Basic stream ready:", stream);
  };

  // Streaming example handler
  const handleStreamingReady = (stream: MediaStream) => {
    setLocalStream(stream);
    console.log("Streaming ready with tracks:", {
      video: stream.getVideoTracks()[0]?.getSettings(),
      audio: stream.getAudioTracks()[0]
        ? "Silent audio track included"
        : "No audio",
    });
  };

  // Recording example handler
  const handleRecordingStreamReady = (stream: MediaStream) => {
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
      a.download = `drawing-${new Date().toISOString()}.webm`;
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
    <div className="app-container">
      <header className="app-header">
        <h1>Drawing Canvas Examples</h1>
        <p>Explore different features of the DrawingCanvas component</p>
      </header>

      <nav className="example-nav">
        <button
          className={`nav-button ${activeExample === "basic" ? "active" : ""}`}
          onClick={() => setActiveExample("basic")}
        >
          Basic Canvas
        </button>
        <button
          className={`nav-button ${activeExample === "custom" ? "active" : ""}`}
          onClick={() => setActiveExample("custom")}
        >
          Custom Colors
        </button>
        <button
          className={`nav-button ${
            activeExample === "recording" ? "active" : ""
          }`}
          onClick={() => setActiveExample("recording")}
        >
          Recording
        </button>
        <button
          className={`nav-button ${
            activeExample === "streaming" ? "active" : ""
          }`}
          onClick={() => setActiveExample("streaming")}
        >
          Live Stream
        </button>
      </nav>

      <main className="example-content">
        {/* Basic Example */}
        {activeExample === "basic" && (
          <div className="example-section">
            <h2>Basic Drawing Canvas</h2>
            <p>
              A simple drawing canvas with default settings. Try drawing with
              different tools!
            </p>
            <div className="canvas-wrapper">
              <DrawingCanvas
                onStreamReady={handleBasicStreamReady}
                initialColor="#000000"
                initialBrushSize={15}
                className="drawing-canvas-container"
                canvasClassName="custom-canvas"
              />
            </div>
          </div>
        )}

        {/* Custom Colors Example */}
        {activeExample === "custom" && (
          <div className="example-section">
            <h2>Custom Color Palette</h2>
            <p>
              Drawing canvas with a custom color palette. Choose from our
              curated colors!
            </p>
            <div className="canvas-wrapper">
              <DrawingCanvas
                customColors={customColors}
                initialColor="#0077BE"
                initialBrushSize={20}
                width={600}
                height={400}
                className="drawing-canvas-container"
                canvasClassName="custom-canvas"
              />
            </div>
          </div>
        )}

        {/* Recording Example */}
        {activeExample === "recording" && (
          <div className="example-section">
            <h2>Canvas Recording</h2>
            <p>Record your drawing session and download it as a video file.</p>
            <div className="recording-controls">
              <button
                onClick={toggleRecording}
                className={`record-button ${isRecording ? "recording" : ""}`}
                disabled={!mediaRecorder.current}
              >
                {isRecording ? "⏹ Stop Recording" : "⏺ Start Recording"}
              </button>
              {isRecording && (
                <span className="recording-indicator">Recording...</span>
              )}
            </div>
            <div className="canvas-wrapper">
              <DrawingCanvas
                onStreamReady={handleRecordingStreamReady}
                fps={60}
                initialColor="#FF0000"
                className="drawing-canvas-container"
                canvasClassName="custom-canvas"
              />
            </div>
          </div>
        )}

        {/* Streaming Example */}
        {activeExample === "streaming" && (
          <div className="example-section">
            <h2>Live Stream Preview</h2>
            <p>
              See your canvas as a live video stream. This demonstrates WebRTC
              integration capabilities.
            </p>
            <div className="streaming-layout">
              <div className="canvas-wrapper">
                <DrawingCanvas
                  onStreamReady={handleStreamingReady}
                  fps={30}
                  enableStreaming={true}
                  enableBackgroundStreaming={true}
                  initialColor="#663399"
                  className="drawing-canvas-container"
                  canvasClassName="custom-canvas"
                />
              </div>
              {localStream && (
                <div className="stream-preview">
                  <h3>Live Stream Preview</h3>
                  <video
                    autoPlay
                    muted
                    ref={(video) => {
                      if (video && localStream) {
                        video.srcObject = localStream;
                      }
                    }}
                    className="preview-video"
                  />
                  <p className="stream-info">
                    This video element shows the canvas content as a
                    MediaStream, ready for WebRTC transmission or local
                    recording.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <div className="features-list">
          <h3>Component Features:</h3>
          <ul>
            <li>🎨 Multiple drawing tools (brush, line, circle, fill)</li>
            <li>🎭 Optional fading effect while drawing</li>
            <li>↩️ Undo/Redo functionality</li>
            <li>🎥 WebRTC streaming support</li>
            <li>📱 Touch device support</li>
            <li>🎯 Fully typed with TypeScript</li>
          </ul>
        </div>
      </footer>
    </div>
  );
}

export default App;
