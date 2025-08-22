import { useState } from "react";
import { FluidCanvas } from "./components/FluidCanvas";

export default function App() {
  const [selectedColor, setSelectedColor] = useState<string>("#FFA500");
  const [splatForce, setSplatForce] = useState(1000);
  const [curl, setCurl] = useState(18);
  const [velocityDissipation, setVelocityDissipation] = useState(0.86);
  const [glow, setGlow] = useState(2);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const handleStreamReady = (mediaStream: MediaStream) => {
    console.log("Stream ready:", mediaStream);
    setStream(mediaStream);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto p-4">
        <h1 className="text-4xl font-bold mb-8">FluidCanvas Demo</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Controls */}
          <div className="lg:col-span-1 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Color</label>
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="w-full h-10 rounded cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Splat Force: {splatForce}
              </label>
              <input
                type="range"
                min="1000"
                max="50000"
                value={splatForce}
                onChange={(e) => setSplatForce(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Curl: {curl}
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={curl}
                onChange={(e) => setCurl(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Velocity Dissipation: {velocityDissipation}
              </label>
              <input
                type="range"
                min="0.01"
                max="1.0"
                step="0.01"
                value={velocityDissipation}
                onChange={(e) => setVelocityDissipation(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Glow: {glow}
              </label>
              <input
                type="range"
                min="0.0"
                max="2.4"
                step="0.1"
                value={glow}
                onChange={(e) => setGlow(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="text-sm text-gray-400">
              <p>Stream Status: {stream ? "Active" : "Inactive"}</p>
              {stream && <p>Tracks: {stream.getTracks().length}</p>}
            </div>
          </div>

          {/* Canvas */}
          <div className="lg:col-span-3">
            <div className="aspect-square w-full max-w-xl mx-auto bg-black rounded-lg overflow-hidden">
              <FluidCanvas
                onStreamReady={handleStreamReady}
                selectedColor={selectedColor}
                splatForce={splatForce}
                curl={curl}
                width={1024}
                height={1024}
                velocityDissipation={velocityDissipation}
                glow={glow}
                fps={30}
                enableBloom={true}
                bloomIntensity={0.5}
                enableSunrays={true}
                autoGenerateSplats={true}
                initialSplatCount={5}
              />
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-gray-400">
          <p>Click and drag to create fluid effects</p>
        </div>
      </div>
    </div>
  );
}
