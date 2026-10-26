import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mic, Square, Trash2, Send, LoaderCircle, RotateCw } from 'lucide-react';
import { useSitePreferences } from './Preferences';
import { VoiceCapture, prepareVoiceFile, voiceRecordingSupported } from './VoiceRecording';

const voiceTime = seconds => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

export function useVoiceMessage({ scope, active = true, disabled, onSend, onRefresh }) {
  const english = useSitePreferences().language === 'en', t = (pl, en) => english ? en : pl;
  const [snapshot, setSnapshot] = useState({ phase: 'idle', seconds: 0, error: '' });
  const capture = useRef(null), previewUrl = useRef(null), generation = useRef(0), sending = useRef(false);
  const current = useRef(null); current.current = { scope, onSend, onRefresh };
  const clearPreview = () => { if (previewUrl.current) URL.revokeObjectURL(previewUrl.current); previewUrl.current = null; };
  function discard() {
    if (sending.current) return;
    ++generation.current; capture.current?.cancel(); clearPreview();
    setSnapshot({ phase: 'idle', seconds: 0, error: '' });
  }
  useEffect(() => {
    ++generation.current;
    sending.current = false;
    const controller = new VoiceCapture({
      onState: (phase, seconds) => {
        if (capture.current === controller && current.current?.scope === scope) setSnapshot(previous => ({ ...previous, phase, seconds }));
      },
      onError: error => {
        if (capture.current !== controller || current.current?.scope !== scope) return;
        const message = error?.name === 'NotAllowedError' ? t('Mikrofon jest zablokowany. Zezwól na dostęp w ustawieniach przeglądarki albo napisz wiadomość.', 'Microphone access is blocked. Allow it in browser settings or type a message.')
          : error?.name === 'NotFoundError' ? t('Nie znaleziono mikrofonu.', 'No microphone was found.')
          : t('Nie udało się nagrać wiadomości. Spróbuj ponownie lub wyślij tekst.', 'Could not record the message. Try again or send text.');
        setSnapshot({ phase: 'idle', seconds: 0, error: message });
      },
      onReady: async blob => {
        if (capture.current !== controller || current.current?.scope !== scope) return;
        const token = generation.current;
        try {
          const file = await prepareVoiceFile(blob);
          if (token !== generation.current || current.current?.scope !== scope) return;
          clearPreview(); previewUrl.current = URL.createObjectURL(file);
          setSnapshot({ phase: 'review', seconds: 0, file, url: previewUrl.current, error: '' });
        } catch {
          if (token === generation.current) setSnapshot({ phase: 'idle', seconds: 0, error: t('Nie udało się przygotować nagrania. Spróbuj nagrać je ponownie.', 'Could not prepare the recording. Please record it again.') });
        }
      },
    });
    capture.current = controller; setSnapshot({ phase: 'idle', seconds: 0, error: '' });
    const onVisibility = () => { if (document.hidden) { if (controller.pending && !controller.recorder) controller.cancel(); else controller.stop(); } };
    document.addEventListener('visibilitychange', onVisibility);
    return () => { ++generation.current; capture.current = null; controller.dispose(); clearPreview(); document.removeEventListener('visibilitychange', onVisibility); };
  }, [scope]);
  useEffect(() => { if ((!active || disabled) && !sending.current) discard(); }, [active, disabled]);

  async function send() {
    if (sending.current || !snapshot.file || snapshot.phase !== 'review' || disabled || !active) return;
    const token = generation.current, room = scope;
    sending.current = true; setSnapshot(previous => ({ ...previous, phase: 'sending', error: '' }));
    try {
      await current.current.onSend(snapshot.file);
      if (token !== generation.current || current.current?.scope !== room) return;
      clearPreview(); setSnapshot({ phase: 'idle', seconds: 0, error: '' });
    } catch (error) {
      if (token !== generation.current || current.current?.scope !== room) return;
      setSnapshot(previous => ({ ...previous, phase: error?.outcomeUnknown ? 'unknown' : 'review', error: error?.outcomeUnknown
        ? t('Nie potwierdzono wysłania. Sprawdź rozmowę przed ponowną próbą.', 'Sending was not confirmed. Check the conversation before trying again.')
        : t('Nie udało się wysłać nagrania. Możesz spróbować ponownie.', 'Could not send the recording. You can try again.') }));
    } finally { if (token === generation.current) sending.current = false; }
  }
  return { ...snapshot, supported: voiceRecordingSupported(), busy: snapshot.phase !== 'idle', t,
    start: () => { if (!disabled && active && !sending.current && snapshot.phase === 'idle') { ++generation.current; setSnapshot({ phase: 'requesting', seconds: 0, error: '' }); capture.current?.start(); } },
    stop: () => capture.current?.stop(), discard, send,
    refresh: async () => {
      const room = scope;
      try { await current.current.onRefresh?.(); }
      catch { if (current.current?.scope === room) setSnapshot(previous => ({ ...previous, error: t('Nie udało się odświeżyć rozmowy. Sprawdź połączenie i spróbuj ponownie.', 'Could not refresh the conversation. Check your connection and try again.') })); }
    }, disabled,
  };
}

export function VoiceMessageControls({ voice }) {
  const { t, phase } = voice;
  const recording = phase === 'recording', waiting = ['requesting', 'processing', 'sending'].includes(phase);
  return <>
    <button type="button" className="ih-send-voice" onClick={voice.start} disabled={voice.disabled || voice.busy || !voice.supported}
      aria-label={t('Nagraj wiadomość głosową', 'Record a voice message')}
      title={voice.supported ? t('Nagraj wiadomość głosową', 'Record a voice message') : t('Nagrywanie nie jest dostępne w tej przeglądarce. Możesz dodać plik audio.', 'Recording is unavailable in this browser. You can attach an audio file.')}><Mic size={21} /></button>
    {voice.busy && <section className="ih-voice-draft" aria-label={t('Wiadomość głosowa', 'Voice message')}>
      <div className="ih-voice-draft-main">
        {recording ? <><span className="ih-voice-recording-dot" /><strong>{t('Nagrywanie', 'Recording')}</strong><time>{voiceTime(voice.seconds)} / 2:00</time><button type="button" onClick={voice.stop} className="ih-voice-stop"><Square size={16} fill="currentColor" />{t('Zatrzymaj', 'Stop')}</button></>
          : waiting ? <p role="status"><LoaderCircle className="ih-voice-loading" size={19} />{phase === 'requesting' ? t('Oczekiwanie na mikrofon…', 'Waiting for the microphone…') : phase === 'sending' ? t('Wysyłanie nagrania…', 'Sending recording…') : t('Przygotowanie odsłuchu…', 'Preparing playback…')}</p>
          : <audio key={voice.url} src={voice.url} controls preload="metadata" aria-label={t('Odsłuchaj nagranie przed wysłaniem', 'Listen to the recording before sending')} />}
        <div className="ih-voice-draft-actions">
          <button type="button" onClick={voice.discard} disabled={phase === 'sending'} aria-label={t('Usuń niewysłane nagranie', 'Discard this recording')} title={t('Usuń nagranie', 'Discard recording')}><Trash2 size={19} /></button>
          {phase === 'review' && <button type="button" className="ih-voice-send" onClick={voice.send} disabled={voice.disabled}><Send size={18} />{t('Wyślij', 'Send')}</button>}
          {phase === 'unknown' && <button type="button" onClick={voice.refresh}><RotateCw size={18} />{t('Odśwież rozmowę', 'Refresh conversation')}</button>}
        </div>
      </div>
      <p className="ih-voice-notice">{t('Nagranie wyślesz rozmówcy dopiero po wybraniu „Wyślij”.', 'The recording reaches the recipient only after you select Send.')} <Link to="/polityka-prywatnosci#wiadomości-głosowe">{t('Prywatność', 'Privacy')}</Link></p>
    </section>}
    {voice.error && <p className="ih-voice-error" role="alert">{voice.error}</p>}
  </>;
}

export function AudioMessageAttachment({ item, url, ownMessage, onReport }) {
  const english = useSitePreferences().language === 'en';
  const t = (pl, en) => english ? en : pl;
  const isVoice = /^Wiadomość głosowa /.test(item.display_name || '');
  return <section className="ih-audio-message" aria-label={t('Nagranie audio', 'Audio recording')}>
    <header><Mic size={17} /><strong>{isVoice ? t('Wiadomość głosowa', 'Voice message') : item.display_name || t('Nagranie audio', 'Audio recording')}</strong></header>
    {url ? <audio controls preload="none" src={url} aria-label={t('Odtwórz wiadomość głosową', 'Play voice message')} /> : <p>{t('Nagranie jest chwilowo niedostępne. Odśwież rozmowę.', 'The recording is temporarily unavailable. Refresh the conversation.')}</p>}
    <footer>{url && <a href={url} download={item.display_name} target="_blank" rel="noopener noreferrer">{t('Pobierz', 'Download')}</a>}{!ownMessage && <button type="button" onClick={() => onReport('shared_item', item.id)}>{t('Zgłoś', 'Report')}</button>}</footer>
  </section>;
}
