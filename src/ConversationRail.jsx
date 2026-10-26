import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { WorkspaceAvatar, WorkspaceIcon, useWorkspaceCopy } from './Workspace';

// The rail owns navigation; the selected workspace always uses the remaining panel.
export default function ConversationRail({ otherName, avatarUrl, profileId, blocked, jobTitle, category,
  materialCount, accepted, termsPending, view, onView, onBack, backLabel, onOptions, optionsOpen,
  focusMode, onFocusMode, nextStep, paymentOverview, children }) {
  const t = useWorkspaceCopy();
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width:850px)').matches);
  const rail = useRef(null), main = useRef(null), mobileToggle = useRef(null), restoreFocus = useRef(true);
  const sections = [
    { value:'conversation', icon:'message', label:t('Rozmowa','Chat'), panel:'ih69-conversation-panel' },
    { value:'plan', icon:'jobs', label:t('Ustalenia','Terms'), panel:'ih68-room-plan' },
    { value:'files', icon:'files', label:t('Materiały','Materials'), panel:'ih68-room-files' },
    { value:'payment', icon:'lock', label:t('Płatność','Payment'), panel:'ih68-room-payment' },
  ];
  const activeLabel = sections.find(section => section.value === view)?.label || sections[0].label;
  const name = blocked ? t('Zablokowany użytkownik','Blocked user') : otherName;
  useEffect(() => {
    const query = window.matchMedia('(max-width:850px)');
    const update = () => { restoreFocus.current = false; setMobile(query.matches); setOpen(false); };
    query.addEventListener('change',update);
    return () => query.removeEventListener('change',update);
  }, []);
  useEffect(() => { restoreFocus.current = false; setOpen(false); }, [profileId, jobTitle]);
  useEffect(() => {
    if (!mobile || !open) return;
    const content = main.current, preferences = document.querySelector('.site-preferences');
    const background = [content,preferences].filter(Boolean).map(node => ({node,inert:node.inert}));
    background.forEach(({node}) => { node.inert = true; });
    const frame = requestAnimationFrame(() => rail.current?.querySelector('button')?.focus({preventScroll:true}));
    const keyboard = event => {
      if (event.defaultPrevented || event.target.closest?.('[role="dialog"]') && !rail.current?.contains(event.target)) return;
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); restoreFocus.current = true; setOpen(false); return; }
      if (event.key !== 'Tab') return;
      const controls = [...rail.current.querySelectorAll('button:not([disabled]),a[href]')].filter(node => node.getClientRects().length);
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && (document.activeElement === first || !rail.current.contains(document.activeElement))) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !rail.current.contains(document.activeElement))) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown',keyboard,true);
    return () => {
      cancelAnimationFrame(frame); document.removeEventListener('keydown',keyboard,true);
      background.forEach(({node,inert}) => { node.inert = inert; });
      if (restoreFocus.current) mobileToggle.current?.focus({preventScroll:true});
    };
  }, [mobile,open]);
  function toggle() { restoreFocus.current = true; setOpen(value => !value); }
  function select(value) { restoreFocus.current = false; onView(value); if (mobile) setOpen(false); }
  function options() { restoreFocus.current = false; if (mobile) setOpen(false); onOptions(); }
  return <div className="ih-conversation-shell" data-sidebar-open={open}>
    {mobile && open && <button type="button" className="ih-room-rail-scrim" tabIndex={-1} aria-label={t('Zamknij menu rozmowy','Close conversation menu')} onClick={toggle} />}
    <aside ref={rail} id="ih-conversation-sidebar" className="ih-room-rail" role={mobile && open ? 'dialog' : undefined}
      aria-modal={mobile && open ? true : undefined} aria-label={t('Menu rozmowy','Conversation menu')}>
      <div className="ih-room-rail-top"><button type="button" className="ih-rail-button ih-rail-toggle" onClick={toggle}
        aria-expanded={open} aria-controls="ih-conversation-sidebar" aria-label={open ? t('Zwiń menu rozmowy','Collapse conversation menu') : t('Rozwiń menu rozmowy','Expand conversation menu')}
        title={open ? t('Zwiń menu','Collapse menu') : t('Rozwiń menu','Expand menu')}><WorkspaceIcon kind={open ? 'back':'menu'} /><span className="ih-rail-copy">{t('Menu rozmowy','Conversation menu')}</span></button></div>
      <Link className="ih-rail-person" to={'/profile/'+profileId} aria-label={t('Profil: ','Profile: ')+name} title={name}>
        <WorkspaceAvatar name={name} url={blocked ? null:avatarUrl} small /><span className="ih-rail-copy"><strong>{name}</strong><small>{jobTitle || t('Rozmowa o projekcie','Project conversation')}</small></span>
      </Link>
      <nav className="ih-room-section-nav" aria-label={t('Rozmowa i współpraca','Conversation and project')}>
        {sections.map(section => <button key={section.value} type="button" className="ih-rail-button" aria-current={view === section.value ? 'page':undefined}
          aria-controls={section.panel} aria-label={section.label+(section.value === 'plan' && termsPending ? t(' — czeka na Twoją decyzję',' — your decision is needed'):'')}
          title={section.label} onClick={() => select(section.value)}>
          <WorkspaceIcon kind={section.icon}/><span className="ih-rail-copy">{section.label}</span>
          {section.value === 'plan' && termsPending && <i className="ih-rail-dot" aria-hidden="true"/>}
          {section.value === 'plan' && accepted && <WorkspaceIcon kind="check" className="ih-rail-copy ih-rail-check"/>}
          {section.value === 'files' && materialCount > 0 && <small className="ih-rail-count" aria-label={String(materialCount)}>{materialCount > 99 ? '99+':materialCount}</small>}
        </button>)}
      </nav>
      <div className="ih-rail-project ih-rail-copy"><p>{category}</p><dl>
        <div><dt>{t('Ustalenia','Terms')}</dt><dd>{accepted ? t('Zaakceptowane','Accepted'):nextStep?.title || t('Do uzgodnienia','To be agreed')}</dd></div>
        <div><dt>{t('Płatność','Payment')}</dt><dd>{paymentOverview?.label || t('Sprawdzanie…','Checking…')}</dd></div>
      </dl></div>
      <footer className="ih-room-rail-footer">
        <button type="button" className="ih-rail-button" onClick={onBack} aria-label={t('Wróć: ','Back to: ')+backLabel} title={backLabel}><WorkspaceIcon kind="back"/><span className="ih-rail-copy">{backLabel}</span></button>
        <button type="button" className={'ih-rail-button'+(focusMode ? ' ih68-focus-exit':'')} onClick={() => { restoreFocus.current = false; if (mobile) setOpen(false); onFocusMode(!focusMode); }} aria-label={focusMode ? t('Przywróć widok','Restore view'):t('Powiększ rozmowę','Expand conversation')} title={focusMode ? t('Przywróć widok','Restore view'):t('Powiększ rozmowę','Expand conversation')}><WorkspaceIcon kind={focusMode ? 'collapse':'expand'}/><span className="ih-rail-copy">{focusMode ? t('Przywróć widok','Restore view'):t('Powiększ rozmowę','Expand conversation')}</span></button>
        <button type="button" id="ih70-room-options" className="ih-rail-button" aria-haspopup="dialog" aria-expanded={optionsOpen} onClick={options} aria-label={t('Opcje rozmowy','Conversation options')} title={t('Opcje rozmowy','Conversation options')}><WorkspaceIcon kind="more"/><span className="ih-rail-copy">{t('Opcje rozmowy','Conversation options')}</span></button>
      </footer>
    </aside>
    <div ref={main} className="ih-room-main"><h1 className="ih-send-sr">{activeLabel+' · '+name}</h1>
      <header className="ih-room-mobilebar"><button type="button" className="ih68-icon-button" onClick={view === 'conversation' ? onBack:() => select('conversation')} aria-label={view === 'conversation' ? t('Wróć: ','Back to: ')+backLabel:t('Wróć do rozmowy','Back to conversation')}><WorkspaceIcon kind="back"/></button>
        {view === 'conversation' && <WorkspaceAvatar name={name} url={blocked ? null:avatarUrl} small/>}
        <strong>{view === 'conversation' ? name:activeLabel}</strong><button ref={mobileToggle} type="button" className="ih68-icon-button ih-room-menu-toggle" onClick={toggle} aria-expanded={open} aria-controls="ih-conversation-sidebar" aria-label={t('Otwórz projekt i opcje rozmowy','Open project and conversation options')}><WorkspaceIcon kind="down"/><span>{t('Projekt','Project')}</span></button>
      </header>
{children}
    </div>
  </div>;
}
