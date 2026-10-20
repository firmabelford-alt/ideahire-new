/* P70 — show a single task and reveal supporting controls when requested. */
import React, { useId, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { useSitePreferences } from './Preferences';

export function WorkspaceSheet({ open, onClose, title, children, id, onBack }) {
  const generated = useId();
  const titleId = generated + '-title';
  const dialogRef = useRef(null);
  const fromOutside = useRef(false);
  const closing = useRef(null);
  const en = useSitePreferences().language === 'en';
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    const before = document.activeElement;
    const overflow = document.body.style.getPropertyValue('overflow');
    const priority = document.body.style.getPropertyPriority('overflow');
    if (!dialog.open) dialog.showModal();
    const entrance = !window.matchMedia('(prefers-reduced-motion:reduce)').matches && dialog.animate?.(
      [{ opacity: 0, translate: '0 8px' }, { opacity: 1, translate: '0 0' }],
      { duration: 240, easing: 'cubic-bezier(.22,.7,.25,1)' }
    );
    document.body.style.setProperty('overflow', 'hidden', 'important');
    const viewport = window.visualViewport;
    function measure() {
      const height = viewport?.height || window.innerHeight;
      dialog.style.setProperty('--ih70-sheet-height', Math.max(160, height - 16) + 'px');
      dialog.style.setProperty('bottom', Math.max(0, window.innerHeight - height - (viewport?.offsetTop || 0)) + 'px', 'important');
    }
    measure();
    viewport?.addEventListener('resize', measure);
    viewport?.addEventListener('scroll', measure);
    window.addEventListener('resize', measure);
    return () => {
      viewport?.removeEventListener('resize', measure);
      viewport?.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
      entrance?.cancel?.();
      if (closing.current) { closing.current.onfinish = null; closing.current.cancel(); closing.current = null; }
      if (dialog.open) dialog.close();
      if (overflow) document.body.style.setProperty('overflow', overflow, priority);
      else document.body.style.removeProperty('overflow');
      if (before?.isConnected && before.getClientRects().length) before.focus?.({ preventScroll: true });
    };
  }, [open]);
  useLayoutEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      const dialog = dialogRef.current;
      (dialog?.querySelector('[data-sheet-focus]') || dialog?.querySelector('h2'))?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [open, title]);
  function outside(event) {
    const box = event.currentTarget.getBoundingClientRect();
    return event.target === event.currentTarget && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom);
  }
  function close() {
    const dialog = dialogRef.current;
    if (closing.current) return;
    if (!dialog?.open || !dialog.animate || window.matchMedia('(prefers-reduced-motion:reduce)').matches) { onClose(); return; }
    const style = getComputedStyle(dialog);
    const animation = dialog.animate([{ opacity: style.opacity, translate: style.translate }, { opacity: 0, translate: '0 8px' }], { duration: 180, easing: 'cubic-bezier(.22,.7,.25,1)', fill: 'forwards' });
    closing.current = animation;
    animation.onfinish = () => onClose();
  }
  return createPortal(<dialog ref={dialogRef} id={id} className="ih70-sheet" role="dialog" aria-modal="true" aria-labelledby={titleId} onCancel={event => { event.preventDefault(); close(); }} onPointerDown={event => { fromOutside.current = outside(event); }} onPointerUp={event => { if (fromOutside.current && outside(event)) close(); fromOutside.current = false; }}>
    <header className="ih70-sheet-heading">{onBack && <button className="ih81-sheet-back" type="button" onClick={onBack}>{en ? 'Back' : 'Wstecz'}</button>}<h2 id={titleId} tabIndex={-1}>{title}</h2><button type="button" onClick={close} aria-label={en ? 'Close' : 'Zamknij'}><X size={22} strokeWidth={1.7} aria-hidden="true" /></button></header>
    <div className="ih70-sheet-body">{children}</div>
  </dialog>, document.body);
}

export function WorkspaceTaskLink({ as: Element = 'a', title, detail, icon, trailing, ...props }) {
  return <Element {...props} className={'ih70-task-link' + (props.className ? ' ' + props.className : '')}>
    {icon && <span className="ih70-task-icon">{icon}</span>}
    <span className="ih70-task-copy"><strong>{title}</strong>{detail && <span>{detail}</span>}</span>
    {trailing && <span className="ih70-task-end">{trailing}</span>}
  </Element>;
}

export function WorkspaceDisplaySettings({ onNavigate, limited = false }) {
  const { theme, setTheme, language, setLanguage } = useSitePreferences();
  const en = language === 'en';
  return <details className="ih70-display"><summary>{en ? 'Appearance & language' : 'Wygląd i język'}</summary><div className="ih70-display-controls"><button type="button" aria-pressed={theme === 'dark'} onClick={() => setTheme(value => value === 'dark' ? 'light' : 'dark')}><span>{en ? 'Dark mode' : 'Tryb ciemny'}</span><span aria-hidden="true">{theme === 'dark' ? '✓' : '○'}</span></button><div role="group" aria-label={en ? 'Language' : 'Język'}><button type="button" aria-pressed={!en} onClick={() => setLanguage('pl')}>Polski</button><button type="button" aria-pressed={en} onClick={() => setLanguage('en')}>English</button></div><Link to={limited ? '/account' : '/account#account-templates'} onClick={onNavigate}>{en ? 'Site theme' : 'Motyw strony'}</Link></div></details>;
}
