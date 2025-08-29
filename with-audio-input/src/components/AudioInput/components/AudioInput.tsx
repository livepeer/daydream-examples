import { createContext, useContext, useState } from "react";
import { useAudioEngine, type AudioLevels } from "../hooks/useAudioEngine";

export interface AudioInputContextValue {
  // Audio state
  isListening: boolean;
  isDemoPlaying: boolean;
  audioLevels: AudioLevels;
  audioError: string | null;
  audioReactivity: number;

  // Audio actions
  startMicrophone: () => Promise<void>;
  stopMicrophone: () => void;
  startDemoAudio: (path?: string) => Promise<void>;
  stopDemoAudio: () => void;
  analyzeAudio: () => AudioLevels | undefined;
  setAudioReactivity: (value: number) => void;

  // Stream state
  stream: MediaStream | null;
  setStream: (stream: MediaStream | null) => void;

  // Demo audio path
  demoAudioPath: string;
  setDemoAudioPath: (path: string) => void;
}

const AudioInputContext = createContext<AudioInputContextValue | undefined>(
  undefined
);

// eslint-disable-next-line react-refresh/only-export-components
export const useAudioInputContext = () => {
  const context = useContext(AudioInputContext);
  if (!context) {
    throw new Error("useAudioInputContext must be used within AudioInput");
  }
  return context;
};

export interface AudioInputProps {
  children: React.ReactNode;
  onStreamReady?: (stream: MediaStream) => void;
  onAudioAnalysis?: (levels: AudioLevels) => void;
  defaultDemoAudioPath?: string;
  defaultAudioReactivity?: number;
  className?: string;
}

export function AudioInput({
  children,
  onStreamReady,
  onAudioAnalysis,
  defaultDemoAudioPath = "/assets/demo.mp3",
  defaultAudioReactivity = 1.0,
  className,
}: AudioInputProps) {
  const [audioReactivity, setAudioReactivity] = useState(
    defaultAudioReactivity
  );
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [demoAudioPath, setDemoAudioPath] = useState(defaultDemoAudioPath);

  const audioEngine = useAudioEngine({
    onAudioAnalysis,
    audioReactivity,
  });

  const handleStartDemoAudio = async (path?: string) => {
    await audioEngine.startDemoAudio(path || demoAudioPath);
  };

  const handleSetStream = (newStream: MediaStream | null) => {
    setStream(newStream);
    if (newStream && onStreamReady) {
      onStreamReady(newStream);
    }
  };

  const contextValue: AudioInputContextValue = {
    // Audio state
    isListening: audioEngine.isListening,
    isDemoPlaying: audioEngine.isDemoPlaying,
    audioLevels: audioEngine.audioLevels,
    audioError: audioEngine.audioError,
    audioReactivity,

    // Audio actions
    startMicrophone: audioEngine.startMicrophone,
    stopMicrophone: audioEngine.stopMicrophone,
    startDemoAudio: handleStartDemoAudio,
    stopDemoAudio: audioEngine.stopDemoAudio,
    analyzeAudio: audioEngine.analyzeAudio,
    setAudioReactivity,

    // Stream state
    stream,
    setStream: handleSetStream,

    // Demo audio path
    demoAudioPath,
    setDemoAudioPath,
  };

  return (
    <AudioInputContext.Provider value={contextValue}>
      <div className={className}>{children}</div>
    </AudioInputContext.Provider>
  );
}
