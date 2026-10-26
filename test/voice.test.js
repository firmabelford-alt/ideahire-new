import test from 'node:test';
import assert from 'node:assert/strict';
import { VoiceCapture, encodeVoiceWav, prepareVoiceFile, voiceRecordingSupported, VOICE_LIMIT_MS, VOICE_CAPTURE_BYTES } from '../src/VoiceRecording.js';
import { sendPrivateVoice } from '../src/VoiceTransfer.js';
import { audioPosition, audioTime, recordingDuration } from '../src/VoicePlayback.js';

function captureFixture(getUserMedia) {
  let now = 0, stopped = 0, timer;
  const events = [], errors = [], ready = [];
  const stream = { getTracks: () => [{ stop: () => { stopped++; } }] };
  class Recorder {
    static instances = [];
    static isTypeSupported(type) { return type === 'audio/mp4'; }
    constructor(_, options) { this.mimeType = options?.mimeType; this.state = 'inactive'; Recorder.instances.push(this); }
    start() { this.state = 'recording'; }
    stop() { this.state = 'inactive'; queueMicrotask(() => { this.ondataavailable?.({ data: new Blob(['sound'], { type: this.mimeType }) }); this.onstop?.(); }); }
  }
  const host = { navigator: { mediaDevices: { getUserMedia: getUserMedia || (async () => stream) } }, MediaRecorder: Recorder,
    performance: { now: () => now }, setInterval: callback => { timer = callback; return 1; }, clearInterval: () => { timer = null; } };
  const capture = new VoiceCapture({ onState: (phase, seconds) => events.push({ phase, seconds }), onError: error => errors.push(error), onReady: blob => ready.push(blob) }, host);
  return { capture, stream, events, errors, ready, Recorder, stopped: () => stopped, advance: value => { now = value; timer?.(); }, hasTimer: () => Boolean(timer) };
}
const tick = () => new Promise(resolve => queueMicrotask(resolve));

test('voice playback: times remain useful before metadata and for long recordings', () => {
  assert.equal(audioTime(NaN),'0:00'); assert.equal(audioTime(Infinity),'0:00'); assert.equal(audioTime(-8),'0:00');
  assert.equal(audioTime(2.7),'0:02'); assert.equal(audioTime(120),'2:00');
});
test('voice playback: our WAV duration hint rejects impossible or missing byte counts', () => {
  assert.equal(recordingDuration(96044),2); assert.equal(recordingDuration(5760044),120);
  for (const bytes of [null,0,44,-1,'invalid',Infinity,100000000]) assert.equal(recordingDuration(bytes),0);
});
test('voice playback: seeking never leaves the loaded recording range', () => {
  assert.equal(audioPosition(-9,2),0); assert.equal(audioPosition(90,2),2); assert.equal(audioPosition('1.25',2),1.25);
  assert.equal(audioPosition(1,Infinity),0); assert.equal(audioPosition(NaN,2),0); assert.equal(audioPosition(1,0),0);
});

test('voice: opening a conversation does not request microphone access', () => {
  let requests = 0;
  const f = captureFixture(async () => { requests++; return f.stream; });
  assert.equal(requests, 0); f.capture.dispose(); assert.equal(requests, 0);
  assert.equal(voiceRecordingSupported({ isSecureContext: false }), false);
});
test('voice: stop releases the microphone and creates one unsent draft', async () => {
  const f = captureFixture(); await f.capture.start();
  assert.equal(f.Recorder.instances[0].mimeType, 'audio/mp4');
  assert.equal(f.events.at(-1).phase, 'recording');
  f.capture.stop(); await tick();
  assert.equal(f.ready.length, 1); assert.equal(f.ready[0].type, 'audio/mp4');
  assert.ok(f.stopped() > 0); assert.equal(f.hasTimer(), false);
  assert.equal(f.events.at(-1).phase, 'processing');
});
test('voice: cancelling before permission resolves stops the late stream', async () => {
  let resolve; const f = captureFixture(() => new Promise(done => { resolve = done; }));
  const started = f.capture.start(); f.capture.cancel(); resolve(f.stream); await started;
  assert.ok(f.stopped() > 0); assert.equal(f.Recorder.instances.length, 0); assert.equal(f.ready.length, 0);
});
test('voice: leaving the room discards a recording without a draft callback', async () => {
  const f = captureFixture(); await f.capture.start(); f.capture.dispose(); await tick();
  assert.equal(f.ready.length, 0); assert.ok(f.stopped() > 0); assert.equal(f.hasTimer(), false);
});
test('voice: permission denial is reported and another attempt is possible', async () => {
  let attempts = 0; const f = captureFixture(async () => { if (++attempts === 1) throw Object.assign(new Error('denied'), { name: 'NotAllowedError' }); return f.stream; });
  await f.capture.start(); assert.equal(f.errors[0].name, 'NotAllowedError');
  await f.capture.start(); assert.equal(f.events.at(-1).phase, 'recording'); f.capture.dispose();
});
test('voice: the two-minute limit stops capture and preserves a preview', async () => {
  const f = captureFixture(); await f.capture.start(); f.advance(VOICE_LIMIT_MS); await tick();
  assert.equal(f.ready.length, 1); assert.equal(f.hasTimer(), false); assert.ok(f.stopped() > 0);
});
test('voice: excessive recorded bytes discard data and release the microphone', async () => {
  const f = captureFixture(); await f.capture.start();
  f.Recorder.instances[0].ondataavailable({ data: { size: VOICE_CAPTURE_BYTES + 1 } }); await tick();
  assert.equal(f.ready.length, 0); assert.equal(f.errors[0].message, 'VOICE_TOO_LARGE'); assert.ok(f.stopped() > 0);
});
test('voice: WAV output has valid mono PCM headers and clamped signed samples', () => {
  const buffer = encodeVoiceWav(new Float32Array([-2,-1,0,1,2,NaN])); const view = new DataView(buffer);
  assert.equal(new TextDecoder().decode(new Uint8Array(buffer,0,4)), 'RIFF');
  assert.equal(view.getUint32(4,true), buffer.byteLength - 8); assert.equal(view.getUint16(22,true),1);
  assert.equal(view.getUint32(24,true),24000); assert.equal(view.getUint16(34,true),16);
  assert.deepEqual(Array.from({ length:6 }, (_,i) => view.getInt16(44+i*2,true)), [-32768,-32768,0,32767,32767,0]);
});
test('voice: decoding failures close the audio context', async () => {
  let closed = false;
  class Context { async decodeAudioData() { throw new Error('decode'); } async close() { closed = true; } }
  await assert.rejects(prepareVoiceFile(new Blob(['bad']), { AudioContext: Context }), /decode/); assert.equal(closed,true);
});
test('voice: preview conversion resamples to a private-upload compatible mono WAV', async () => {
  let closed = false, connected = false;
  const decoded = { duration:1 };
  class Context { async decodeAudioData() { return decoded; } async close() { closed = true; } }
  class Offline {
    constructor(channels,frames,rate) { assert.deepEqual([channels,frames,rate],[1,24000,24000]); this.destination = {}; }
    createBufferSource() { const source = { connect: () => { connected = true; }, start: () => assert.equal(source.buffer,decoded) }; return source; }
    async startRendering() { return { getChannelData: channel => { assert.equal(channel,0); return new Float32Array(24000); } }; }
  }
  const file = await prepareVoiceFile(new Blob(['encoded audio']), { AudioContext: Context,OfflineAudioContext: Offline });
  assert.equal(file.type,'audio/wav'); assert.equal(file.size,48044); assert.match(file.name,/^Wiadomość głosowa .*\.wav$/);
  assert.ok(closed && connected);
});
test('voice: a recording too short for a useful preview is rejected before rendering', async () => {
  let closed = false;
  class Context { async decodeAudioData() { return { duration:.01 }; } async close() { closed = true; } }
  await assert.rejects(prepareVoiceFile(new Blob(['short']), { AudioContext: Context }), /VOICE_INVALID_AUDIO/);
  assert.equal(closed,true);
});

const voiceFile = () => new File([encodeVoiceWav(new Float32Array(24000))], 'Wiadomość głosowa test.wav', { type:'audio/wav' });
function transferFixture(options = {}) {
  const calls = [], prepared = { id:'server-id', path:'private/room/batch/voice.wav', token:'signed-upload-token', mimeType:'audio/wav' };
  return { calls, transport: {
    invoke: async body => { calls.push(body); if (body.action === 'prepare_upload') return { ok:true, batchId:'batch', files:[prepared] }; if(options.failure) throw options.failure; return { ok:true }; },
    upload: async (session, file) => { calls.push({ action:'upload', session, file }); if(options.uploadFailure) throw options.uploadFailure; },
    findCommitted: async (id, room) => { calls.push({ action:'verify', id, room }); return options.committed || false; },
    remove: async path => calls.push({ action:'remove', path }),
  } };
}
test('voice: explicit send uses the server-issued session and attaches one private material', async () => {
  const f = transferFixture(); await sendPrivateVoice({ conversationId:'room', file:voiceFile() },f.transport);
  assert.deepEqual(f.calls.map(call => call.action), ['prepare_upload','upload','send_materials']);
  assert.deepEqual(f.calls[2].files,[{ id:'server-id',path:'private/room/batch/voice.wav',displayName:'Wiadomość głosowa test.wav' }]);
  assert.equal(f.calls[2].conversationId,'room');
});
test('voice: invalid audio is rejected before upload preparation', async () => {
  const f = transferFixture(); await assert.rejects(sendPrivateVoice({ conversationId:'room',file:new File(['not WAV'.repeat(10)],'fake.wav',{ type:'audio/wav' }) },f.transport),/VOICE_INVALID_FILE/);
  assert.equal(f.calls.length,0);
});
test('voice: failed upload cleans up only its uncommitted private file', async () => {
  const f = transferFixture({ uploadFailure:new Error('offline') });
  await assert.rejects(sendPrivateVoice({ conversationId:'room',file:voiceFile() },f.transport),/offline/);
  assert.equal(f.calls.at(-1).action,'remove'); assert.ok(!f.calls.some(call => call.action === 'send_materials'));
});
test('voice: a lost final response retains the file and disables automatic resend', async () => {
  const failure = new Error('timeout'); const f = transferFixture({ failure });
  await assert.rejects(sendPrivateVoice({ conversationId:'room',file:voiceFile() },f.transport),error => error.outcomeUnknown === true);
  assert.equal(f.calls.filter(call => call.action === 'send_materials').length,1);
  assert.ok(!f.calls.some(call => call.action === 'remove'));
});
test('voice: confirmed committed item recovers a lost response without another send', async () => {
  const f = transferFixture({ failure:new Error('timeout'),committed:true });
  const result = await sendPrivateVoice({ conversationId:'room',file:voiceFile() },f.transport);
  assert.equal(result.recovered,true); assert.deepEqual(f.calls.at(-1), { action:'verify',id:'server-id',room:'room' });
  assert.ok(!f.calls.some(call => call.action === 'remove'));
});
test('voice: explicit safe rejection permits cleanup and a deliberate retry', async () => {
  const f = transferFixture({ failure:Object.assign(new Error('rejected'), { definitelyRejected:true,safeToCleanup:true }) });
  await assert.rejects(sendPrivateVoice({ conversationId:'room',file:voiceFile() },f.transport),error => error.outcomeUnknown === false);
  assert.equal(f.calls.at(-1).action,'remove');
});
