// Voice drafts stay in memory. Only the explicit send action uploads a WAV file.
export const VOICE_LIMIT_MS = 120000;
export const VOICE_CAPTURE_BYTES = 8 * 1024 * 1024;
const RECORDING_TYPES = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/webm'];

export function voiceRecordingSupported(host = globalThis) {
  return Boolean(host.isSecureContext && host.navigator?.mediaDevices?.getUserMedia
    && host.MediaRecorder && (host.AudioContext || host.webkitAudioContext)
    && (host.OfflineAudioContext || host.webkitOfflineAudioContext));
}

export function encodeVoiceWav(samples, sampleRate = 24000) {
  if (!samples?.length || !Number.isInteger(sampleRate) || sampleRate < 8000 || sampleRate > 48000
    || samples.length > sampleRate * 125) throw new Error('VOICE_INVALID_AUDIO');
  const buffer = new ArrayBuffer(44 + samples.length * 2), view = new DataView(buffer);
  const label = (offset, text) => [...text].forEach((letter, i) => view.setUint8(offset + i, letter.charCodeAt(0)));
  label(0, 'RIFF'); view.setUint32(4, buffer.byteLength - 8, true); label(8, 'WAVE');
  label(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  label(36, 'data'); view.setUint32(40, samples.length * 2, true);
  samples.forEach((value, i) => {
    const sample = Number.isFinite(value) ? Math.max(-1, Math.min(1, value)) : 0;
    view.setInt16(44 + i * 2, Math.round(sample * (sample < 0 ? 32768 : 32767)), true);
  });
  return buffer;
}

export async function prepareVoiceFile(blob, host = globalThis) {
  const Context = host.AudioContext || host.webkitAudioContext;
  const Offline = host.OfflineAudioContext || host.webkitOfflineAudioContext;
  const context = new Context();
  try {
    const decoded = await context.decodeAudioData(await blob.arrayBuffer());
    if (!Number.isFinite(decoded.duration) || decoded.duration < .2 || decoded.duration > 125) throw new Error('VOICE_INVALID_AUDIO');
    const sampleRate = 24000;
    const offline = new Offline(1, Math.ceil(decoded.duration * sampleRate), sampleRate);
    const source = offline.createBufferSource(); source.buffer = decoded; source.connect(offline.destination); source.start();
    const rendered = await offline.startRendering();
    return new File([encodeVoiceWav(rendered.getChannelData(0), sampleRate)],
      `Wiadomość głosowa ${new Date().toISOString().replace(/[:.]/g, '-')}.wav`, { type: 'audio/wav' });
  } finally { await context.close().catch(() => {}); }
}

export class VoiceCapture {
  constructor({ onState, onReady, onError }, host = globalThis) {
    this.callbacks = { onState, onReady, onError }; this.host = host; this.generation = 0;
  }
  emit(state, seconds = 0) { if (!this.disposed) this.callbacks.onState(state, seconds); }
  release() {
    this.host.clearInterval(this.timer); this.timer = null;
    this.stream?.getTracks().forEach(track => track.stop()); this.stream = null;
  }
  async start() {
    if (this.disposed || this.pending || this.recorder) return;
    const generation = ++this.generation; this.pending = true; this.emit('requesting');
    try {
      const stream = await this.host.navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false });
      if (this.disposed || generation !== this.generation) { stream.getTracks().forEach(track => track.stop()); return; }
      this.stream = stream; this.chunks = []; this.bytes = 0;
      const mimeType = RECORDING_TYPES.find(type => this.host.MediaRecorder.isTypeSupported?.(type));
      const recorder = new this.host.MediaRecorder(stream, mimeType ? { mimeType, audioBitsPerSecond: 96000 } : undefined);
      this.recorder = recorder; this.started = this.host.performance.now();
      recorder.ondataavailable = event => {
        if (generation !== this.generation || !event.data?.size) return;
        this.bytes += event.data.size;
        if (this.bytes > VOICE_CAPTURE_BYTES) { this.cancel(); this.callbacks.onError(new Error('VOICE_TOO_LARGE')); return; }
        this.chunks.push(event.data);
      };
      recorder.onerror = event => {
        if (generation !== this.generation) return;
        this.cancel(); this.callbacks.onError(event.error || new Error('VOICE_RECORDING_FAILED'));
      };
      recorder.onstop = () => {
        if (generation !== this.generation || this.disposed) return;
        this.release(); this.recorder = null;
        const blob = new Blob(this.chunks, { type: recorder.mimeType || this.chunks[0]?.type || 'audio/webm' });
        this.chunks = [];
        if (!blob.size) { this.emit('idle'); this.callbacks.onError(new Error('VOICE_EMPTY')); return; }
        this.emit('processing'); this.callbacks.onReady(blob);
      };
      recorder.start(500); this.emit('recording');
      this.timer = this.host.setInterval(() => {
        const elapsed = this.host.performance.now() - this.started;
        if (elapsed >= VOICE_LIMIT_MS) this.stop(); else this.emit('recording', Math.floor(elapsed / 1000));
      }, 250);
    } catch (error) {
      if (generation === this.generation && !this.disposed) { this.cancel(); this.callbacks.onError(error); }
    } finally { if (generation === this.generation) this.pending = false; }
  }
  stop() {
    if (!this.recorder || this.recorder.state === 'inactive') return;
    this.host.clearInterval(this.timer); this.timer = null; this.emit('processing');
    this.recorder.stop(); this.stream?.getTracks().forEach(track => track.stop());
  }
  cancel() {
    ++this.generation; this.pending = false;
    if (this.recorder) {
      this.recorder.ondataavailable = null; this.recorder.onstop = null; this.recorder.onerror = null;
      if (this.recorder.state !== 'inactive') this.recorder.stop();
    }
    this.recorder = null; this.chunks = []; this.release(); this.emit('idle');
  }
  dispose() { this.disposed = true; this.cancel(); }
}
