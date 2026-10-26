import React, { useEffect, useId, useRef, useState } from 'react';
import { LoaderCircle, MoreHorizontal, Pause, Play } from 'lucide-react';
import { useSitePreferences } from './Preferences';
import { audioPosition, audioTime } from './VoicePlayback';
import './VoicePlayer.css';

// Decorative bars show playback progress; they do not claim to display audio amplitude.
const BARS = [9,16,24,12,29,18,10,22,32,15,24,11,18,30,21,12,26,17,9,23,30,15,21,11,27,18,32,14,23,10,20];

export default function VoicePlayer({ url, durationHint = 0, downloadName, onReport, label }) {
  const english = useSitePreferences().language === 'en', t = (pl,en) => english ? en:pl;
  const audio = useRef(null), menu = useRef(null), generation = useRef(0), attempt = useRef(false), playerId = useId();
  const [playing,setPlaying] = useState(false), [loading,setLoading] = useState(false), [error,setError] = useState('');
  const [position,setPosition] = useState(0), [duration,setDuration] = useState(durationHint), [speed,setSpeed] = useState(1), [seekable,setSeekable] = useState(false);
  useEffect(() => {
    const node = audio.current;
    ++generation.current; attempt.current = false; setPlaying(false); setLoading(false); setError(url ? '':t('Nagranie jest chwilowo niedostępne. Odśwież rozmowę.','Recording is temporarily unavailable. Refresh the conversation.')); setPosition(0); setDuration(durationHint); setSpeed(1); setSeekable(false);
    const pauseOther = event => { if (event.detail !== playerId) node?.pause(); };
    window.addEventListener('ideahire:voice-play',pauseOther);
    return () => { ++generation.current; attempt.current = false; node?.pause(); window.removeEventListener('ideahire:voice-play',pauseOther); };
  }, [url]);
  useEffect(() => {
    const close = event => {
      if (!menu.current?.open) return;
      if (event.type === 'pointerdown' && !menu.current.contains(event.target)) menu.current.open = false;
      if (event.type === 'keydown' && event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); menu.current.open = false; menu.current.querySelector('summary')?.focus({preventScroll:true}); }
    };
    document.addEventListener('pointerdown',close); document.addEventListener('keydown',close,true);
    return () => { document.removeEventListener('pointerdown',close); document.removeEventListener('keydown',close,true); };
  }, []);
  async function toggle() {
    const node = audio.current;
    if (!node || !url || attempt.current) return;
    if (!node.paused) { node.pause(); return; }
    const token = generation.current;
    attempt.current = true; setLoading(true); setError('');
    window.dispatchEvent(new CustomEvent('ideahire:voice-play',{detail:playerId}));
    try { await node.play(); }
    catch (failure) { if (token === generation.current && failure?.name !== 'AbortError') setError(t('Nie udało się odtworzyć nagrania. Odśwież rozmowę i spróbuj ponownie.','Could not play the recording. Refresh the conversation and try again.')); }
    finally { if (token === generation.current) { attempt.current = false; setLoading(false); } }
  }
  function metadata(event) {
    const value = event.currentTarget.duration;
    if (Number.isFinite(value) && value > 0) { setDuration(value); setSeekable(true); }
  }
  function seek(value) {
    const node = audio.current;
    if (!node || !seekable) return;
    const next = audioPosition(value,node.duration);
    try { node.currentTime = next; setPosition(next); } catch { /* A media range may not have loaded yet. */ }
  }
  function changeSpeed() {
    const next = speed === 1 ? 1.5:speed === 1.5 ? 2:1;
    if (audio.current) audio.current.playbackRate = next;
    setSpeed(next);
  }
  const progress = duration > 0 ? Math.min(100,position/duration*100):0;
  return <div className="ih-voice-player" role="group" aria-label={label || t('Wiadomość głosowa','Voice message')}>
    <audio ref={audio} src={url || undefined} preload="metadata" onLoadedMetadata={metadata} onDurationChange={metadata}
      onPlaying={() => { setPlaying(true); setLoading(false); }} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)}
      onTimeUpdate={event => setPosition(event.currentTarget.currentTime)} onError={() => { setPlaying(false); setLoading(false); setError(t('Nagranie jest chwilowo niedostępne. Odśwież rozmowę.','Recording is temporarily unavailable. Refresh the conversation.')); }} />
    <div className="ih-voice-player-row">
      <button type="button" className="ih-voice-play" onClick={toggle} disabled={!url || loading}
        aria-label={loading ? t('Wczytywanie nagrania','Loading recording'):playing ? t('Wstrzymaj nagranie','Pause recording'):t('Odtwórz nagranie','Play recording')}>
        {loading ? <LoaderCircle size={21} className="ih-voice-loading"/>:playing ? <Pause size={19} fill="currentColor"/>:<Play size={19} fill="currentColor"/>}
      </button>
      <div className="ih-voice-seek">
        <div className="ih-voice-bars" aria-hidden="true">{BARS.map((height,index) => <i key={index} className={index/BARS.length*100 < progress ? 'is-played':undefined} style={{height}}/>)}</div>
        <input type="range" min="0" max={duration || 1} step="0.05" value={Math.min(position,duration || 1)} disabled={!url || !seekable}
          aria-label={t('Pozycja nagrania','Recording position')} aria-valuetext={`${audioTime(position)} ${t('z','of')} ${audioTime(duration)}`}
          onChange={event => seek(event.target.value)}/>
      </div>
      <time className="ih-voice-time">{audioTime(position > 0 ? position:duration)}</time>
      <button type="button" className="ih-voice-speed" onClick={changeSpeed} aria-label={t('Prędkość odtwarzania: ','Playback speed: ')+speed+'×'}>{speed}×</button>
      {(downloadName || onReport) && <details ref={menu} className="ih-voice-options"><summary aria-label={t('Opcje nagrania','Recording options')}><MoreHorizontal size={19}/></summary><div>
        {url && downloadName && <a href={url} download={downloadName} target="_blank" rel="noopener noreferrer" onClick={() => { menu.current.open = false; }}>{t('Pobierz nagranie','Download recording')}</a>}
        {onReport && <button type="button" onClick={() => { menu.current.open = false; onReport(); }}>{t('Zgłoś nagranie','Report recording')}</button>}
      </div></details>}
    </div>
    {error && <p className="ih-voice-player-error" role="alert">{error}</p>}
  </div>;
}
