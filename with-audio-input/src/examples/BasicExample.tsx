import {
  AudioInput,
  AudioInputMicrophone,
  AudioInputDemoMp3,
  AudioInputPreviewCanvas,
  AudioInputLevels,
  AudioInputControls,
} from "../components/AudioInput";

/**
 * Basic example showing simple usage of the AudioInput component
 */
export function BasicExample() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">
          Basic Audio Input
        </h2>
        <p className="text-neutral-400">
          Get started with audio input and visualization
        </p>
      </div>

      <AudioInput defaultDemoAudioPath="/demo.mp3">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Visualizer */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xl font-semibold text-white">
              Chrome Blob Visualizer
            </h3>
            <AudioInputPreviewCanvas
              width={400}
              height={400}
              className="mx-auto border border-neutral-700 rounded-lg shadow-lg"
            />
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xl font-semibold text-white">Audio Controls</h3>

            <div className="space-y-3">
              <div className="p-4 bg-neutral-800 rounded-lg">
                <h4 className="font-medium text-white mb-3">Audio Sources</h4>
                <div className="flex flex-col gap-2">
                  <AudioInputMicrophone className="w-full" />
                  <AudioInputDemoMp3 className="w-full" />
                </div>
              </div>

              <div className="p-4 bg-neutral-800 rounded-lg">
                <h4 className="font-medium text-white mb-3">Settings</h4>
                <AudioInputControls />
              </div>

              <AudioInputLevels className="p-4 bg-neutral-800 rounded-lg" />
            </div>
          </div>
        </div>
      </AudioInput>
    </div>
  );
}
