/**
 * Creates a silent audio track for MediaStream
 * This is necessary for some streaming platforms that require audio
 */
export function createSilentAudioTrack(): MediaStreamTrack {
  const audioContext = new AudioContext({ sampleRate: 48000 });
  const oscillator = audioContext.createOscillator();
  const destination = audioContext.createMediaStreamDestination();
  const gain = audioContext.createGain();

  // Create a very quiet sine wave
  oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
  gain.gain.setValueAtTime(0.01, audioContext.currentTime);
  oscillator.type = "sine";

  // Connect nodes
  oscillator.connect(gain);
  gain.connect(destination);
  oscillator.start();

  const track = destination.stream.getAudioTracks()[0];
  if (track.contentHint !== undefined) {
    track.contentHint = "music";
  }

  return track;
}

/**
 * Cleans up audio resources
 */
export function cleanupAudioTrack(track: MediaStreamTrack) {
  if (track && track.readyState === "live") {
    track.stop();
  }
}
