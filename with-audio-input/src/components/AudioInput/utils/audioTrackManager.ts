class AudioTrackManager {
  private static instance: AudioTrackManager | null = null;
  private audioContext: AudioContext | null = null;
  private silentTrack: MediaStreamTrack | null = null;
  private oscillator: OscillatorNode | null = null;
  private destination: MediaStreamAudioDestinationNode | null = null;

  private constructor() {}

  static getInstance(): AudioTrackManager {
    if (!AudioTrackManager.instance) {
      AudioTrackManager.instance = new AudioTrackManager();
    }
    return AudioTrackManager.instance;
  }

  getSilentAudioTrack(): MediaStreamTrack {
    if (this.silentTrack && this.silentTrack.readyState === "live") {
      return this.silentTrack.clone();
    }

    return this.createSilentAudioTrack();
  }

  private createSilentAudioTrack(): MediaStreamTrack {
    try {
      this.cleanup();

      this.audioContext = new AudioContext({ sampleRate: 48000 });
      this.oscillator = this.audioContext.createOscillator();
      this.destination = this.audioContext.createMediaStreamDestination();
      const gain = this.audioContext.createGain();

      this.oscillator.frequency.setValueAtTime(
        440,
        this.audioContext.currentTime,
      );
      gain.gain.setValueAtTime(0.01, this.audioContext.currentTime);
      this.oscillator.type = "sine";

      this.oscillator.connect(gain);
      gain.connect(this.destination);
      this.oscillator.start();

      this.silentTrack = this.destination.stream.getAudioTracks()[0];
      if (this.silentTrack.contentHint !== undefined) {
        this.silentTrack.contentHint = "music";
      }

      return this.silentTrack.clone();
    } catch (error) {
      console.error("Error creating silent audio track:", error);
      return new MediaStreamTrack();
    }
  }

  isTrackValid(track: MediaStreamTrack): boolean {
    return track.readyState === "live" && !track.muted;
  }

  cleanup(): void {
    if (this.oscillator) {
      try {
        this.oscillator.stop();
        this.oscillator.disconnect();
      } catch (error) {
        // Oscillator might already be stopped
      }
      this.oscillator = null;
    }

    if (this.destination) {
      this.destination.disconnect();
      this.destination = null;
    }

    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.silentTrack) {
      this.silentTrack.stop();
      this.silentTrack = null;
    }
  }

  reset(): void {
    this.cleanup();
    this.silentTrack = null;
  }
}

export const audioTrackManager = AudioTrackManager.getInstance();

export const createSilentAudioTrack = (): MediaStreamTrack => {
  return audioTrackManager.getSilentAudioTrack();
};

