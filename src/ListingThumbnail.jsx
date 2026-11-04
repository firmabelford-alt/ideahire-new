import React, { useEffect, useId, useRef, useState } from 'react';
import { supabase } from './supabase';
import { prepareListingThumbnail, thumbnailErrorMessage, thumbnailUrl } from './ListingThumbnails';
import './ListingThumbnail.css';

function ImageIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 5-5 4 4 4-6 5 7"/></svg>;
}

export function ListingThumbnail({ path, ownerId, kind, title = '', className = '', client = supabase, fallback = null }) {
  const url = thumbnailUrl(client, path, ownerId, kind);
  const [failed, setFailed] = useState('');
  if (!url || failed === url) return fallback;
  return <figure className={`ih-listing-thumbnail ${className}`.trim()}><img src={url} alt={title} loading="lazy" decoding="async" onError={() => setFailed(url)} /></figure>;
}

export function ListingThumbnailPreview({ value, ...props }) {
  const [preview, setPreview] = useState('');
  useEffect(() => {
    if (!value?.blob) { setPreview(''); return; }
    const url = URL.createObjectURL(value.blob);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);
  if (value?.blob) return <figure className="ih-listing-thumbnail">{preview && <img src={preview} alt={props.title || ''} />}</figure>;
  return <ListingThumbnail {...props} path={typeof value === 'string' ? value : null} />;
}

export function ListingThumbnailPicker({ value, onChange, onBusyChange, disabled = false, en = false, ownerId, kind, client = supabase }) {
  const id = useId();
  const generation = useRef(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const busyCallback = useRef(onBusyChange);
  busyCallback.current = onBusyChange;
  useEffect(() => () => { generation.current++; busyCallback.current?.(false); }, []);

  async function choose(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || disabled || busy) return;
    const ticket = ++generation.current;
    setBusy(true); setError(''); onBusyChange?.(true);
    try {
      const prepared = await prepareListingThumbnail(file);
      if (ticket === generation.current) onChange(prepared);
    } catch (cause) {
      if (ticket === generation.current) setError(thumbnailErrorMessage(cause, en));
    } finally {
      if (ticket === generation.current) { setBusy(false); onBusyChange?.(false); }
    }
  }

  const brokenPreview = <span className="ih-thumbnail-unavailable">{en ? 'Preview unavailable. Choose another image.' : 'Podgląd niedostępny. Wybierz inne zdjęcie.'}</span>;
  return <fieldset className="ih-thumbnail-editor is-wide" disabled={disabled || busy} aria-describedby={`${id}-hint`}>
    <legend>{en ? 'Thumbnail' : 'Miniaturka'} <span>{en ? 'Optional' : 'Opcjonalnie'}</span></legend>
    <p id={`${id}-hint`} className="ih-thumbnail-intro">{en ? 'Visible on the listing card. We show the whole image.' : 'Widoczna na karcie ogłoszenia. Pokażemy całe zdjęcie.'}</p>
    <div className="ih-thumbnail-editor-body">
      <div className="ih-thumbnail-preview">
        {value ? <ListingThumbnailPreview value={value} ownerId={ownerId} kind={kind} client={client} title={en ? 'Your thumbnail preview' : 'Podgląd Twojej miniaturki'} fallback={brokenPreview} />
          : <div className="ih-thumbnail-placeholder"><ImageIcon/><span>{en ? 'Your image goes here' : 'Miejsce na Twoje zdjęcie'}</span></div>}
      </div>
      <div className="ih-thumbnail-controls">
        <label className="ih-thumbnail-choose" htmlFor={`${id}-file`}><input id={`${id}-file`} type="file" accept="image/jpeg,image/png,image/webp" onChange={choose} disabled={disabled || busy} /><ImageIcon/><span>{value ? (en ? 'Change image' : 'Zmień zdjęcie') : (en ? 'Choose image' : 'Wybierz zdjęcie')}</span></label>
        {value && <button className="ih-thumbnail-remove" type="button" disabled={disabled || busy} onClick={() => { generation.current++; setError(''); onChange(null); }}>{en ? 'Remove thumbnail' : 'Usuń miniaturkę'}</button>}
        <p className="ih-thumbnail-format">JPG, PNG, WEBP · {en ? 'up to 10 MB' : 'do 10 MB'}</p>
      </div>
    </div>
    <p className="ih-thumbnail-feedback" role={error ? 'alert' : 'status'} aria-live={error ? 'assertive' : 'polite'}>{error || (busy ? (en ? 'Preparing image…' : 'Przygotowujemy zdjęcie…') : value ? (en ? 'Thumbnail ready. Save the listing to publish it.' : 'Miniaturka gotowa. Zapisz ogłoszenie, aby ją opublikować.') : '')}</p>
  </fieldset>;
}
