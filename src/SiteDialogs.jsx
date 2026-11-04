import React, { useEffect, useId, useLayoutEffect, useRef, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, ArrowRight, X } from 'lucide-react';

const requests = [];
const listeners = new Set();
const publish = () => listeners.forEach(listener => listener());
const subscribe = listener => { listeners.add(listener); return () => listeners.delete(listener); };
const snapshot = () => requests[0] || null;

function request(kind, message, options = {}) {
  // A second click while a confirmation is pending must not repeat the action.
  if (requests.some(item => item.kind === kind && item.message === String(message))) return Promise.resolve(false);
  return new Promise(resolve => { requests.push({ kind, message: String(message), options, resolve }); publish(); });
}
export const confirmAction = (message, options) => request('confirm', message, options);
export const notifyAction = (message, options) => request('notice', message, options);

/** Native modal semantics: focus containment, Escape and inert background. */
export function SiteModal({ open, onClose, title, children, className = '', en = false, role = 'dialog', describedBy }) {
  const id = useId();
  const dialogRef = useRef(null), outside = useRef(false);
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    const before = document.activeElement;
    const overflow = document.body.style.getPropertyValue('overflow');
    const priority = document.body.style.getPropertyPriority('overflow');
    dialog.showModal();
    document.body.style.setProperty('overflow', 'hidden', 'important');
    (dialog.querySelector('[data-modal-focus]') || dialog.querySelector('h2'))?.focus({ preventScroll: true });
    return () => {
      dialog.close();
      if (overflow) document.body.style.setProperty('overflow', overflow, priority);
      else document.body.style.removeProperty('overflow');
      if (before?.isConnected && before.getClientRects().length) before.focus?.({ preventScroll: true });
    };
  }, [open]);
  if (!open) return null;
  function isOutside(event) {
    const box = event.currentTarget.getBoundingClientRect();
    return event.target === event.currentTarget && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom);
  }
  return createPortal(<dialog ref={dialogRef} className={'ih-site-modal ' + className} role={role} aria-modal="true" aria-labelledby={id} aria-describedby={describedBy}
    onCancel={event => { event.preventDefault(); onClose(); }}
    onKeyDown={event => { if (event.key === 'Escape') event.stopPropagation(); }}
    onPointerDown={event => { outside.current = isOutside(event); }}
    onPointerUp={event => { if (outside.current && isOutside(event)) onClose(); outside.current = false; }}>
    <header className="ih-site-modal-heading"><h2 id={id} tabIndex={-1}>{title}</h2><button type="button" className="ih-modal-close" onClick={onClose} aria-label={en ? 'Close' : 'Zamknij'}><X size={20} aria-hidden="true" /></button></header>
    {children}
  </dialog>, document.body);
}

export default function SiteDialogs({ language, translate }) {
  const item = useSyncExternalStore(subscribe, snapshot, () => null);
  const descriptionId = useId();
  const en = language === 'en';
  useEffect(() => {
    const cancel = () => { requests.splice(0).forEach(item => item.resolve(false)); publish(); };
    window.addEventListener('popstate', cancel);
    window.addEventListener('pagehide', cancel);
    return () => { window.removeEventListener('popstate', cancel); window.removeEventListener('pagehide', cancel); };
  }, []);
  if (!item) return null;
  const text = value => en ? translate(value) : value;
  const confirm = item.kind === 'confirm';
  function finish(value) {
    if (requests[0] !== item) return;
    requests.shift(); item.resolve(value); publish();
  }
  return <SiteModal key={item.message} open onClose={() => finish(false)} en={en} role="alertdialog" describedBy={descriptionId} className="ih-confirmation"
    title={text(item.options.title || (confirm ? (en ? 'Confirm action' : 'Potwierdź działanie') : (en ? 'IdeaHire update' : 'Informacja IdeaHire')))}>
    <div className="ih-confirmation-copy"><AlertCircle size={22} aria-hidden="true" /><p id={descriptionId}>{text(item.message)}</p></div>
    <footer className="ih-modal-actions">{confirm && <button type="button" data-modal-focus onClick={() => finish(false)}>{en ? 'Cancel' : 'Anuluj'}</button>}
      <button type="button" className="is-primary" data-modal-focus={confirm ? undefined : true} onClick={() => finish(true)}>{text(item.options.confirmLabel || (confirm ? (en ? 'Confirm' : 'Potwierdź') : (en ? 'Got it' : 'Rozumiem')))}<ArrowRight size={17} aria-hidden="true" /></button></footer>
  </SiteModal>;
}
