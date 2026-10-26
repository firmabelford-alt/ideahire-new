export function audioTime(seconds) {
  const value = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2,'0')}`;
}

export function recordingDuration(bytes) {
  // Our recorder exports mono 24 kHz PCM16 WAV with a 44-byte header.
  const seconds = (Number(bytes) - 44) / 48000;
  return Number.isFinite(seconds) && seconds > 0 && seconds <= 125 ? seconds : 0;
}

export function audioPosition(value, duration) {
  if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(Number(value))) return 0;
  return Math.max(0,Math.min(Number(value),duration));
}
