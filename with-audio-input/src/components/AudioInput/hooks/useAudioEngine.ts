import { useCallback, useRef, useState } from "react";

export interface AudioLevels {
  low: number;
  mid: number;
  high: number;
  overall: number;
}

export interface UseAudioEngineOptions {
  onAudioAnalysis?: (levels: AudioLevels) => void;
  audioReactivity?: number;
}

export function useAudioEngine(options: UseAudioEngineOptions = {}) {
  const { onAudioAnalysis, audioReactivity: _audioReactivity = 1.0 } = options;

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const demoAudioElementRef = useRef<HTMLAudioElement | null>(null);
  const demoAudioSourceNodeRef = useRef<MediaElementAudioSourceNode | null>(
    null
  );
  const micSourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const smoothedLowRef = useRef(0);
  const smoothedHighRef = useRef(0);

  const [isListening, setIsListening] = useState(false);
  const [isDemoPlaying, setIsDemoPlaying] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  const [audioLevels, setAudioLevels] = useState<AudioLevels>({
    low: 0,
    mid: 0,
    high: 0,
    overall: 0,
  });

  const initAudioEngine = useCallback(() => {
    if (!audioContextRef.current) {
      try {
        const AudioContext =
          window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        analyserRef.current = analyser;

        const bufferLength = analyser.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLength);
      } catch (error) {
        setAudioError(
          "Could not create audio context. Your browser might not support it."
        );
      }
    }

    if (
      audioContextRef.current &&
      audioContextRef.current.state === "suspended"
    ) {
      audioContextRef.current.resume();
    }
  }, []);

  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current) {
      return;
    }

    analyserRef.current.getByteFrequencyData(dataArrayRef.current);

    const dataArray = dataArrayRef.current;
    const bufferLength = dataArray.length;

    const timeArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteTimeDomainData(timeArray);

    let rms = 0;
    for (let i = 0; i < timeArray.length; i++) {
      const val = (timeArray[i] - 128) / 128;
      rms += val * val;
    }
    rms = Math.sqrt(rms / timeArray.length);

    const lowFreq = dataArray.slice(0, Math.floor(bufferLength * 0.2));
    const lowAvg =
      lowFreq.reduce((sum, val) => sum + val, 0) / lowFreq.length / 255;

    const midFreq = dataArray.slice(
      Math.floor(bufferLength * 0.2),
      Math.floor(bufferLength * 0.7)
    );
    const midAvg =
      midFreq.reduce((sum, val) => sum + val, 0) / midFreq.length / 255;

    const highFreq = dataArray.slice(Math.floor(bufferLength * 0.7));
    const highAvg =
      highFreq.reduce((sum, val) => sum + val, 0) / highFreq.length / 255;

    const overallVolume = Math.max(
      dataArray.reduce((sum, val) => sum + val, 0) / bufferLength / 255,
      rms
    );

    const smoothingFactor = 0.1;
    smoothedLowRef.current +=
      (lowAvg - smoothedLowRef.current) * smoothingFactor;
    smoothedHighRef.current +=
      (highAvg - smoothedHighRef.current) * smoothingFactor;

    const levels: AudioLevels = {
      low: Math.max(smoothedLowRef.current, rms * 0.5),
      mid: Math.max(midAvg, rms * 0.3),
      high: Math.max(smoothedHighRef.current, rms * 0.2),
      overall: overallVolume,
    };

    setAudioLevels(levels);

    if (onAudioAnalysis) {
      onAudioAnalysis(levels);
    }

    return levels;
  }, [onAudioAnalysis]);

  const stopMicrophone = useCallback(() => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (micSourceNodeRef.current) {
      micSourceNodeRef.current.disconnect();
      micSourceNodeRef.current = null;
    }
    setIsListening(false);
  }, []);

  const stopDemoAudio = useCallback(() => {
    if (demoAudioElementRef.current) {
      demoAudioElementRef.current.pause();
    }
    if (demoAudioSourceNodeRef.current) {
      demoAudioSourceNodeRef.current.disconnect();
      demoAudioSourceNodeRef.current = null;
    }
    setIsDemoPlaying(false);
  }, []);

  const startMicrophone = useCallback(async () => {
    stopDemoAudio();
    initAudioEngine();

    if (!audioContextRef.current || !analyserRef.current) {
      setAudioError("Audio engine not initialized.");
      return;
    }

    try {
      setAudioError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      micStreamRef.current = stream;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      micSourceNodeRef.current = source;
      const gainNode = audioContextRef.current.createGain();
      gainNode.gain.value = 2.0;

      source.connect(gainNode);
      gainNode.connect(analyserRef.current);

      setIsListening(true);
    } catch (error) {
      setAudioError(
        error instanceof Error ? error.message : "Failed to access microphone"
      );
    }
  }, [initAudioEngine, stopDemoAudio]);

  const startDemoAudio = useCallback(
    async (demoAudioPath: string = "/assets/demo.mp3") => {
      stopMicrophone();
      initAudioEngine();

      if (!audioContextRef.current || !analyserRef.current) {
        setAudioError("Audio engine not initialized.");
        return;
      }

      try {
        setAudioError(null);
        const audio = demoAudioElementRef.current || new Audio(demoAudioPath);
        demoAudioElementRef.current = audio;
        audio.crossOrigin = "anonymous";
        audio.loop = true;

        if (!demoAudioSourceNodeRef.current) {
          const source =
            audioContextRef.current.createMediaElementSource(audio);
          demoAudioSourceNodeRef.current = source;
          const gainNode = audioContextRef.current.createGain();
          gainNode.gain.value = 1.0;

          source.connect(gainNode);
          gainNode.connect(analyserRef.current);
          gainNode.connect(audioContextRef.current.destination);
        }

        await audio.play();
        setIsDemoPlaying(true);
      } catch (error) {
        setAudioError(
          `Could not play audio file. Check if the file exists at ${demoAudioPath} and that your browser can play it.`
        );
      }
    },
    [initAudioEngine, stopMicrophone]
  );

  const cleanup = useCallback(() => {
    stopMicrophone();
    stopDemoAudio();

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    dataArrayRef.current = null;
  }, [stopMicrophone, stopDemoAudio]);

  const resetLevels = useCallback(() => {
    setAudioLevels({ low: 0, mid: 0, high: 0, overall: 0 });
    smoothedLowRef.current = 0;
    smoothedHighRef.current = 0;
  }, []);

  return {
    // State
    isListening,
    isDemoPlaying,
    audioLevels,
    audioError,

    // Actions
    startMicrophone,
    stopMicrophone,
    startDemoAudio,
    stopDemoAudio,
    analyzeAudio,
    cleanup,
    resetLevels,

    // Internal refs (for advanced usage)
    audioContextRef,
    analyserRef,
  };
}
