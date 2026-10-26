// The server issues a private upload session and atomically attaches its file to a message.
// A lost final response must never trigger deletion or an automatic second send.
export async function sendPrivateVoice({ conversationId, file }, transport) {
  if (!conversationId || !file || file.type !== 'audio/wav' || file.size < 44 || file.size > 8 * 1024 * 1024) throw new Error('VOICE_INVALID_FILE');
  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const label = (start, end) => String.fromCharCode(...header.slice(start, end));
  if (label(0, 4) !== 'RIFF' || label(8, 12) !== 'WAVE') throw new Error('VOICE_INVALID_FILE');
  let prepared, finalizing = false;
  try {
    const session = await transport.invoke({ action: 'prepare_upload', conversationId,
      fileSpecs: [{ displayName: file.name, mimeType: file.type, byteSize: file.size }] });
    if (!session.batchId || session.files?.length !== 1) throw new Error('VOICE_INVALID_SESSION');
    prepared = session.files[0];
    if (!prepared.id || !prepared.path || !prepared.token || !['audio/wav', 'audio/x-wav'].includes(prepared.mimeType)) throw new Error('VOICE_INVALID_SESSION');
    await transport.upload(prepared, file);
    finalizing = true;
    return await transport.invoke({ action: 'send_materials', conversationId, caption: 'Wiadomość głosowa',
      files: [{ id: prepared.id, path: prepared.path, displayName: file.name }], links: [], accessEntries: [] });
  } catch (error) {
    if (finalizing) {
      // Verify the exact server-issued item; no message-text or timing guesses.
      try { if (await transport.findCommitted(prepared.id, conversationId)) return { ok: true, recovered: true }; } catch { /* Keep the outcome uncertain. */ }
    }
    const unknown = finalizing && (!error.definitelyRejected || error.safeToCleanup === false);
    if (prepared?.path && (!finalizing || error.safeToCleanup === true) && !unknown) {
      try { await transport.remove(prepared.path); } catch { /* The private upload session can expire server-side. */ }
    }
    error.outcomeUnknown = unknown;
    throw error;
  }
}
