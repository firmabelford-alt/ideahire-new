/* P70 — single-purpose mobile screens and supporting controls on demand. */
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSitePreferences } from './Preferences';
import { WorkspaceSheet, WorkspaceTaskLink } from './WorkspaceFlow';
import { WorkspaceAvatar, WorkspaceIcon, WorkspaceLoading, useWorkspaceCopy, useWorkspaceListNavigation, workspaceDate } from './Workspace';
export function WorkspaceInbox({ user, conversations = [], visibleConversations = [], loading, errorMessage, search, setSearch, inboxFilter, setInboxFilter, unreadCount }) {
  const t = useWorkspaceCopy();
  const en = useSitePreferences().language === 'en';
  const location = useLocation(), navigate = useNavigate();
  const open = useWorkspaceListNavigation(loading);
  const [filtersOpen, setFiltersOpen] = useState(false);
  useEffect(() => { const p = new URLSearchParams(location.search); setSearch(p.get('q') || ''); setInboxFilter(p.get('unread') === '1' ? 'unread' : 'all'); },[location.search,setSearch,setInboxFilter]);
  function update(key,value) { const p = new URLSearchParams(location.search); if(value) p.set(key,value); else p.delete(key); if(key === 'q') setSearch(value); else setInboxFilter(value === '1' ? 'unread' : 'all'); navigate({pathname:'/messages',search:p.toString() ? '?' + p : ''},{replace:true,state:{}}); }
  function reset() { setSearch(''); setInboxFilter('all'); navigate('/messages',{replace:true}); }
  function date(value) { const d = new Date(value); return !value || Number.isNaN(d.getTime()) ? '' : d.toDateString() === new Date().toDateString() ? d.toLocaleTimeString(en ? 'en-GB' : 'pl-PL',{hour:'2-digit',minute:'2-digit'}) : workspaceDate(value,en); }
  return <main className="ih68-page ih68-mailbox ih70-list-page" id="ih68-content">
    <header className="ih70-list-heading"><h1>{t('Wiadomości','Messages')}</h1><Link to="/freelancers" className="ih68-primary" aria-label={t('Nowa rozmowa — znajdź wykonawcę','New conversation — find a freelancer')}><WorkspaceIcon kind="plus" /><span>{t('Nowa','New')}</span></Link></header>
    <div className="ih70-list-controls"><p>{unreadCount > 0 ? t('Nieprzeczytane: ','Unread: ') + unreadCount : t('Twoje rozmowy','Your conversations')}</p><button type="button" className="ih70-filter-button" aria-haspopup="dialog" onClick={() => setFiltersOpen(true)}><WorkspaceIcon kind="search" />{t('Szukaj','Search')}{(search || inboxFilter === 'unread') && <i className="ih68-dot" />}</button></div>
    {(search || inboxFilter === 'unread') && <div className="ih70-applied-filter"><span>{search ? t('Szukasz: ','Searching: ') + search : t('Tylko nieprzeczytane','Unread only')}</span><button type="button" onClick={reset}>{t('Wyczyść','Clear')}</button></div>}
    <section className="ih68-mailbox-list" aria-label={t('Lista rozmów','Conversation list')}>{loading ? <WorkspaceLoading /> : errorMessage ? <p className="ih68-feedback" role="alert">{errorMessage}</p> : !visibleConversations.length ? <div className="ih70-empty"><WorkspaceIcon kind="message" /><h2>{conversations.length ? t('Brak pasujących rozmów','No matching conversations') : t('Jeszcze bez rozmów','No conversations yet')}</h2><p>{conversations.length ? t('Zmień wyszukiwanie lub filtr.','Change your search or filter.') : t('Napisz do wykonawcy albo odpowiedz na zlecenie.','Contact a freelancer or reply to a job.')}</p>{conversations.length ? <button type="button" className="ih68-secondary" onClick={reset}>{t('Pokaż wszystkie','Show all')}</button> : <Link to="/freelancers" className="ih68-primary">{t('Znajdź wykonawcę','Find a freelancer')}<WorkspaceIcon kind="arrow" /></Link>}</div> : visibleConversations.map(item => {
      const name = item.otherProfile?.name || t('Użytkownik','User');
      const message = item.lastMessage;
      const preview = message ? (message.sender_id === user?.id ? t('Ty: ','You: ') : '') + (String(message.content || '').trim() || t('Przesłano materiały','Materials shared')) : '';
      return <Link key={item.id} to={'/chat/' + item.id} onClick={event => open(event,item.id)} className={'ih68-mail-row' + (item.isUnread ? ' is-unread' : '')}><WorkspaceAvatar name={name} url={item.otherProfile?.avatar_url} /><div className="ih68-mail-copy"><div className="ih68-mail-person"><strong>{name}</strong><time dateTime={item.sortDate || undefined}>{date(item.sortDate)}</time></div><h2>{item.job?.title || t('Zapytanie o współpracę','Project inquiry')}</h2>{preview && <p>{preview}</p>}</div><span className="ih68-mail-end">{item.isUnread ? <i className="ih68-dot" aria-label={t('Nieprzeczytana rozmowa','Unread conversation')} /> : <WorkspaceIcon kind="next" />}</span></Link>;
    })}</section>
    <WorkspaceSheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title={t('Znajdź rozmowę','Find a conversation')}><div className="ih70-filter-fields"><label className="ih70-field"><span>{t('Osoba lub projekt','Person or project')}</span><input type="search" maxLength={160} placeholder={t('Wpisz nazwę','Enter a name')} value={search} onChange={event => update('q',event.target.value)} data-sheet-focus /></label><fieldset><legend>{t('Pokaż','Show')}</legend>{[['all',t('Wszystkie rozmowy','All conversations')],['unread',t('Tylko nieprzeczytane','Unread only')]].map(([value,label]) => <label key={value}><input type="radio" name="ih70-inbox-filter" checked={inboxFilter === value} onChange={() => update('unread',value === 'unread' ? '1' : '')} /><span>{label}</span></label>)}</fieldset><button type="button" className="ih68-primary ih70-sheet-done" onClick={() => setFiltersOpen(false)}>{t('Pokaż rozmowy','Show conversations')}<WorkspaceIcon kind="arrow" /></button></div></WorkspaceSheet>
  </main>;
}

export function WorkspaceThread({
  messages,
  user,
  otherName,
  lastReadOwnMessageId,
  renderContent,
  onReport,
  viewportRef,
  onScroll,
  showLatest,
  onLatest
}) {
  const t = useWorkspaceCopy();
  const en = useSitePreferences().language === 'en';
  const optionsRoot = useRef(null);
  useEffect(() => {
    const close = event => {
      optionsRoot.current?.querySelectorAll('.ih68-message-options[open]').forEach(details => {
        if (event.type === 'keydown' && event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          details.removeAttribute('open');
          details.querySelector('summary')?.focus();
        } else if (event.type === 'pointerdown' && !details.contains(event.target)) details.removeAttribute('open');
      });
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close, true);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close, true);
    };
  }, []);
  return <div ref={optionsRoot} className="ih68-thread-wrap"><div ref={viewportRef} className="ih68-thread" role="log" aria-label={t('Historia rozmowy', 'Conversation history')} aria-live="polite" aria-relevant="additions text" onScroll={onScroll} tabIndex={0}>
    {!messages.length ? <div className="ih68-thread-empty"><WorkspaceIcon kind="message" /><h2>{t('Napisz pierwszą wiadomość.', 'Write the first message.')}</h2><p>{t('Zapytaj o termin lub opisz, co jest do zrobienia.', 'Ask about availability or describe the work.')}</p></div> : <div className="ih68-thread-inner">{messages.map((message, index) => {
          const own = message.sender_id === user?.id;
          const previous = messages[index - 1];
          const day = !previous || new Date(previous.created_at).toDateString() !== new Date(message.created_at).toDateString();
          const followup = !day && previous.sender_id === message.sender_id && new Date(message.created_at) - new Date(previous.created_at) < 300000;
          return <React.Fragment key={message.id}>{day && <div className="ih68-day"><time dateTime={message.created_at}>{new Date(message.created_at).toLocaleDateString(en ? 'en-GB' : 'pl-PL', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}</time></div>}
        <article className={'ih68-message' + (own ? ' is-own' : ' is-received') + (followup ? ' is-followup' : '')} aria-label={own ? t('Twoja wiadomość', 'Your message') : otherName}>
          {!own && !followup && <strong className="ih69-message-author">{otherName}</strong>}
          <div className="ih68-message-content">{renderContent(message)}</div>
          <footer className="ih69-message-meta"><time dateTime={message.created_at}>{new Date(message.created_at).toLocaleTimeString(en ? 'en-GB' : 'pl-PL', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</time>{message.id === lastReadOwnMessageId && <span className="ih68-read-receipt"><WorkspaceIcon kind="check" />{t('Wyświetlono', 'Seen')}</span>}{!own && message.moderation_status !== 'hidden' && <details className="ih68-message-options"><summary aria-label={t('Opcje wiadomości', 'Message options')}><WorkspaceIcon kind="more" /></summary><button type="button" onClick={e => {
                    e.currentTarget.closest('details')?.removeAttribute('open');
                    onReport(message.id);
                  }}>{t('Zgłoś wiadomość', 'Report message')}</button></details>}</footer>
        </article>
      </React.Fragment>;
        })}</div>}
  </div>{showLatest && <button type="button" className="ih68-latest" onClick={onLatest}><WorkspaceIcon kind="down" />{t('Najnowsze wiadomości', 'Latest messages')}</button>}</div>;
}
function fitWorkspaceDraft(field) {
  if (!field || !field.getClientRects().length) return;
  const limit = Math.min(128, parseFloat(getComputedStyle(field).maxHeight) || 128);
  field.style.setProperty('height', 'auto', 'important');
  const height = field.scrollHeight;
  field.style.setProperty('height', Math.min(height, limit) + 'px', 'important');
  field.style.overflowY = height > limit ? 'auto' : 'hidden';
}
export function WorkspaceComposer({
  draft,
  setDraft,
  sending,
  blocked,
  composerRef,
  onSubmit,
  onMaterials,
  errorMessage,
  blockedByMe,
  profileId
}) {
  const t = useWorkspaceCopy();
  useLayoutEffect(() => {
    fitWorkspaceDraft(composerRef.current);
  }, [draft, composerRef]);
  useEffect(() => {
    const field = composerRef.current;
    if (!field) return;
    let task = 0;
    const fit = () => {
      cancelAnimationFrame(task);
      task = requestAnimationFrame(() => fitWorkspaceDraft(field));
    };
    const observer = window.ResizeObserver ? new ResizeObserver(fit) : null;
    observer?.observe(field);
    observer?.observe(field.parentElement);
    window.addEventListener('resize', fit);
    window.visualViewport?.addEventListener('resize', fit);
    return () => {
      cancelAnimationFrame(task);
      observer?.disconnect();
      window.removeEventListener('resize', fit);
      window.visualViewport?.removeEventListener('resize', fit);
    };
  }, [composerRef, blocked]);
  return <div className="ih68-composer-area">
    {errorMessage && <p className="ih68-feedback" role="alert">{errorMessage}</p>}
    {blocked ? <p className="ih68-block-note"><WorkspaceIcon kind="lock" /><span>{blockedByMe ? t('Rozmowa jest zablokowana. Możesz odblokować osobę na jej profilu.', 'This conversation is blocked. You can unblock the person on their profile.') : t('Wysyłanie wiadomości w tej rozmowie jest wyłączone.', 'Sending messages in this conversation is disabled.')}{blockedByMe && <Link to={'/profile/' + profileId}>{t('Otwórz profil', 'Open profile')}</Link>}</span></p> : <form className="ih68-composer" onSubmit={onSubmit}>
      <label className="ih68-sr-only" htmlFor="ih68-message-draft">{t('Treść wiadomości', 'Message text')}</label>
      <textarea id="ih68-message-draft" ref={composerRef} rows={1} value={draft} maxLength={4000} placeholder={t('Napisz wiadomość…', 'Write a message…')} disabled={sending} onChange={e => setDraft(e.target.value)} onKeyDown={e => {
        if (e.isComposing || e.nativeEvent?.isComposing) return;
        if (e.key === 'Enter' && !e.shiftKey && !window.matchMedia?.('(pointer: coarse)').matches) {
          e.preventDefault();
          e.currentTarget.form?.requestSubmit();
        }
      }} />
      <div className="ih68-compose-tools"><button type="button" className="ih68-attach" onClick={onMaterials} disabled={sending}><WorkspaceIcon kind="attachment" /><span>{t('Dodaj plik lub link', 'Add a file or link')}</span></button><button type="submit" className="ih68-send" disabled={sending || !draft.trim()} aria-label={sending ? t('Wysyłanie wiadomości', 'Sending message') : t('Wyślij wiadomość', 'Send message')}><span>{sending ? t('Wysyłanie…', 'Sending…') : t('Wyślij', 'Send')}</span><WorkspaceIcon kind="send" /></button></div>
    </form>}
    <p className="ih68-compose-hint">{t('Enter wysyła · Shift + Enter dodaje linię', 'Enter to send · Shift + Enter for a new line')}</p>
  </div>;
}
export function WorkspaceConversation({
  loading,
  errorMessage,
  hasConversation,
  otherName,
  avatarUrl,
  profileId,
  blocked,
  jobTitle,
  budget,
  category,
  materialCount,
  accepted,
  view,
  onView,
  focusMode,
  onFocusMode,
  planPinned,
  onPinPlan,
  onClosePlan,
  onBack,
  backLabel,
  onHide,
  hiding,
  onDispute,
  canDispute,
  projectDetails,
  thread,
  composer,
  materials,
  plan,
  disputePanel,
  reportDialog
}) {
  const t = useWorkspaceCopy();
  const frameRef = useRef(null);
  const [optionsOpen, setOptionsOpen] = useState(false), [optionsMore, setOptionsMore] = useState(false);
  const {theme,setTheme,language,setLanguage} = useSitePreferences();
  useLayoutEffect(() => {
    let task = 0,
      scrollTask = 0;
    const viewport = window.visualViewport,
      element = frameRef.current;
    function measure() {
      task = 0;
      if (!element) return;
      const narrow = window.matchMedia?.('(max-width:850px)').matches,
        inset = focusMode ? narrow ? 0 : 16 : 0,
        top = focusMode || narrow ? inset : Math.max(0, element.getBoundingClientRect().top - (viewport?.offsetTop || 0)),
        bottom = focusMode ? inset : narrow ? 0 : 24,
        height = Math.max(160, Math.floor((viewport?.height || window.innerHeight) - top - bottom));
      const thread = element.querySelector('.ih68-thread');
      const atEnd = thread && thread.scrollHeight - thread.scrollTop - thread.clientHeight < 100;
      element.style.setProperty('--ih68-room-height', height + 'px');
      if (focusMode || narrow) element.style.setProperty('top', (viewport?.offsetTop || 0) + inset + 'px', 'important');else element.style.removeProperty('top');
      element.classList.toggle('is-keyboard', narrow && document.activeElement?.id === 'ih68-message-draft' && height < 460);
      if (atEnd) {
        cancelAnimationFrame(scrollTask);
        scrollTask = requestAnimationFrame(() => {
          thread.scrollTop = thread.scrollHeight;
        });
      }
    }
    const schedule = () => {
        if (!task) task = requestAnimationFrame(measure);
      },
      observer = window.ResizeObserver ? new ResizeObserver(schedule) : null,
      header = document.querySelector('.ih68-header');
    if (header) observer?.observe(header);
    window.addEventListener('resize', schedule);
    document.addEventListener('focusin', schedule);
    document.addEventListener('focusout', schedule);
    viewport?.addEventListener('resize', schedule);
    viewport?.addEventListener('scroll', schedule);
    schedule();
    return () => {
      observer?.disconnect();
      cancelAnimationFrame(task);
      cancelAnimationFrame(scrollTask);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('focusin', schedule);
      document.removeEventListener('focusout', schedule);
      viewport?.removeEventListener('resize', schedule);
      viewport?.removeEventListener('scroll', schedule);
    };
  }, [focusMode]);
  useEffect(() => {
    if (!focusMode) return;
    const frame = frameRef.current,
      header = document.querySelector('.ih68-header'),
      inert = header?.inert,
      before = document.activeElement,
      overflow = document.body.style.getPropertyValue('overflow'),
      priority = document.body.style.getPropertyPriority('overflow');
    if (header) header.inert = true;
    document.body.style.setProperty('overflow', 'hidden', 'important');
    const raf = requestAnimationFrame(() => frame?.querySelector('.ih68-focus-exit')?.focus({
      preventScroll: true
    }));
    function keyboard(e) {
      const dialog = e.target.closest?.('[role="dialog"]');
      if (e.defaultPrevented || dialog && dialog !== frame) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onFocusMode(false);
        return;
      }
      if (e.key !== 'Tab') return;
      const all = [...(frame?.querySelectorAll('a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),summary,[tabindex="0"]') || [])].filter(n => n.tabIndex >= 0 && !n.closest('[hidden],[inert]') && n.getClientRects().length > 0),
        first = all[0],
        last = all.at(-1);
      if (!first) return;
      if (e.shiftKey && (document.activeElement === first || !frame.contains(document.activeElement))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !frame.contains(document.activeElement))) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', keyboard);
    return () => {
      cancelAnimationFrame(raf);
      if (header) header.inert = !!inert;
      if (overflow) document.body.style.setProperty('overflow', overflow, priority);else document.body.style.removeProperty('overflow');
      document.removeEventListener('keydown', keyboard);
      const returnFocus = before?.isConnected && before !== document.body && before.getClientRects().length ? before : frame?.querySelector('#ih70-room-options');
      returnFocus?.focus?.({
        preventScroll: true
      });
    };
  }, [focusMode, onFocusMode]);
  useEffect(() => {
    if (!planPinned) return;
    const media = window.matchMedia?.('(max-width:1399px)'),
      update = () => {
        if (media?.matches) onView('plan');
      };
    update();
    media?.addEventListener?.('change', update);
    return () => media?.removeEventListener?.('change', update);
  }, [planPinned, onView]);
  const labels = {project:t('Projekt','Project'),files:t('Materiały','Materials'),plan:t('Ustalenia','Terms')};
  const closeMenu = () => setOptionsOpen(false);
  return <>
    {focusMode && createPortal(<div className="ih68-focus-scrim" aria-hidden="true" />,document.body)}
    <main ref={frameRef} id="ih68-content" data-view={view} role={focusMode ? 'dialog' : undefined} aria-modal={focusMode ? true : undefined} aria-label={t('Rozmowa IdeaHire','IdeaHire conversation')} className={'ih68-room ih70-room' + (focusMode ? ' is-focus' : '') + (planPinned ? ' has-pinned-plan' : '')}>
      {loading ? <WorkspaceLoading /> : !hasConversation ? <section className="ih68-room-error"><h1>{t('Nie można otworzyć rozmowy','Unable to open this conversation')}</h1><p role="alert">{errorMessage}</p><button type="button" className="ih68-secondary" onClick={onBack}><WorkspaceIcon kind="back" />{backLabel}</button></section> : <>
        <header className="ih68-room-header">
          <button type="button" className="ih68-room-back ih68-icon-button" onClick={() => view === 'conversation' ? onBack() : onView(view === 'project' ? 'conversation' : 'project')} aria-label={view === 'conversation' ? t('Wróć: ','Back to: ') + backLabel : view === 'project' ? t('Wróć do rozmowy','Back to conversation') : t('Wróć do projektu','Back to project')}><WorkspaceIcon kind="back" /></button>
          {view === 'conversation' && <Link className="ih69-person-avatar" to={'/profile/' + profileId} aria-label={t('Profil: ','Profile: ') + otherName}><WorkspaceAvatar name={otherName} url={blocked ? null : avatarUrl} small /></Link>}
          <div className="ih68-room-person">{view === 'conversation' ? <Link to={'/profile/' + profileId}><h1>{blocked ? t('Zablokowany użytkownik','Blocked user') : otherName}</h1></Link> : <h1>{labels[view]}</h1>}<p className="ih70-room-context">{view === 'conversation' ? jobTitle || t('Zapytanie o współpracę','Project inquiry') : otherName}</p></div>
          {view === 'conversation' && <button type="button" className="ih70-project-open" onClick={() => onView('project')}><WorkspaceIcon kind="files" /><span>{t('Projekt','Project')}</span></button>}
          <div className="ih68-room-header-tools">{focusMode && <button type="button" className="ih68-focus-exit ih68-icon-button" aria-label={t('Przywróć widok','Restore view')} onClick={() => onFocusMode(false)}><WorkspaceIcon kind="collapse" /></button>}<button type="button" id="ih70-room-options" className="ih68-icon-button ih70-options-trigger" aria-haspopup="dialog" aria-label={t('Opcje rozmowy','Conversation options')} onClick={() => { setOptionsMore(false); setOptionsOpen(true); }}><WorkspaceIcon kind="more" /></button></div>
        </header>
        {disputePanel}
        <div className={'ih68-room-body' + (planPinned ? ' is-split' : '')}>
          <section className="ih68-correspondence" id="ih69-conversation-panel" aria-label={t('Rozmowa','Conversation')} hidden={view !== 'conversation'}>{thread}{composer}</section>
          <section className="ih68-room-page ih70-project-page" id="ih68-room-project" tabIndex={-1} aria-label={t('Projekt','Project')} hidden={view !== 'project'}>{view === 'project' && <>
            <header className="ih70-project-heading"><p>{category}</p><h2>{jobTitle || t('Zapytanie o współpracę','Project inquiry')}</h2></header>
            <div className="ih70-project-price"><span>{accepted ? t('Uzgodniona cena','Agreed price') : t('Proponowany budżet','Proposed budget')}</span><strong>{budget}</strong></div>
            <nav className="ih70-project-choices" aria-label={t('Wybierz część projektu','Choose project details')}>
              <WorkspaceTaskLink as="button" type="button" onClick={() => onView('files')} title={t('Materiały','Materials')} detail={materialCount ? t('Elementy: ','Items: ') + materialCount : t('Pliki, linki i przekazana praca.','Files, links and delivered work.')} icon={<WorkspaceIcon kind="attachment" />} trailing={<WorkspaceIcon kind="next" />} />
              <WorkspaceTaskLink as="button" type="button" onClick={() => onView('plan')} title={t('Ustalenia i płatność','Terms & payment')} detail={accepted ? t('Warunki zaakceptowane','Terms accepted') : t('Zakres, cena i warunki współpracy.','Scope, price and project terms.')} icon={<WorkspaceIcon kind="jobs" />} trailing={<WorkspaceIcon kind="next" />} />
            </nav>
            <details className="ih70-project-brief"><summary>{t('Opis projektu','Project description')}<WorkspaceIcon kind="down" /></summary><div>{projectDetails}</div></details>
          </>}</section>
          <section hidden={view !== 'files'} className="ih68-room-page ih69-materials-page" id="ih68-room-files" tabIndex={-1} aria-label={t('Materiały projektu','Project materials')}>{view === 'files' && materials}</section>
          <section hidden={view !== 'plan' && !planPinned} className={'ih68-room-page ih68-terms' + (planPinned ? ' is-pinned' : '')} id="ih68-room-plan" tabIndex={-1} aria-label={t('Ustalenia i płatność','Terms and payment')}>{(view === 'plan' || planPinned) && <><header className="ih68-room-page-heading"><div>{planPinned && <h2>{t('Ustalenia','Terms')}</h2>}<p>{t('Zakres pracy, warunki i rozliczenie.','Scope, terms and payment.')}</p></div>{planPinned ? <button type="button" className="ih68-text-link" onClick={onClosePlan}><WorkspaceIcon kind="close" />{t('Zamknij','Close')}</button> : <button type="button" className="ih68-pin-option ih68-text-link" onClick={onPinPlan}><WorkspaceIcon kind="pin" />{t('Przy rozmowie','Beside conversation')}</button>}</header>{plan}</>}</section>
        </div>
        <WorkspaceSheet open={optionsOpen} onClose={closeMenu} title={optionsMore ? t('Ustawienia rozmowy','Conversation settings') : t('Opcje rozmowy','Conversation options')} onBack={optionsMore ? () => setOptionsMore(false) : undefined}>
          <nav className="ih70-menu-list">{optionsMore ? <>
            <Link to="/account" className="ih70-menu-link" onClick={closeMenu}><WorkspaceIcon kind="home" /><span>{t('Moje konto','My account')}</span><WorkspaceIcon kind="next" /></Link>
            <Link to="/messages" className="ih70-menu-link" onClick={closeMenu}><WorkspaceIcon kind="message" /><span>{t('Wszystkie rozmowy','All conversations')}</span><WorkspaceIcon kind="next" /></Link>
            <Link to="/privacy-center" className="ih70-menu-link" onClick={closeMenu}><WorkspaceIcon kind="lock" /><span>{t('Prywatność i dane','Privacy & data')}</span><WorkspaceIcon kind="next" /></Link>
            <button type="button" className="ih70-menu-link ih68-expand-option" onClick={() => { closeMenu(); onFocusMode(!focusMode); }}><WorkspaceIcon kind={focusMode ? 'collapse' : 'expand'} /><span>{focusMode ? t('Przywróć widok','Restore view') : t('Powiększ rozmowę','Expand conversation')}</span></button>
            <button type="button" className="ih70-menu-link" onClick={() => setTheme(v => v === 'dark' ? 'light' : 'dark')}><WorkspaceIcon kind="palette" /><span>{theme === 'dark' ? t('Włącz tryb jasny','Use light mode') : t('Włącz tryb ciemny','Use dark mode')}</span></button>
            <div className="ih70-language" role="group" aria-label={t('Język','Language')}><button type="button" aria-pressed={language === 'pl'} onClick={() => setLanguage('pl')}>Polski</button><button type="button" aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>English</button><Link to="/account#account-templates" onClick={closeMenu}>{t('Motyw','Theme')}<WorkspaceIcon kind="diagonal" /></Link></div>
          </> : <>
            <button type="button" className="ih70-menu-link" onClick={() => { closeMenu(); onView('project'); }}><WorkspaceIcon kind="files" /><span>{t('Projekt, materiały i ustalenia','Project, materials and terms')}</span><WorkspaceIcon kind="next" /></button>
            <Link to={'/profile/' + profileId} className="ih70-menu-link" onClick={closeMenu}><WorkspaceIcon kind="profile" /><span>{t('Profil i opcje blokowania','Profile and blocking options')}</span><WorkspaceIcon kind="next" /></Link>
            <button type="button" className="ih70-menu-link" disabled={!canDispute} onClick={() => { closeMenu(); onDispute(); }}><WorkspaceIcon kind="lock" /><span>{t('Zgłoś problem ze współpracą','Report a project issue')}</span></button>
            <button type="button" className="ih70-menu-link" disabled={hiding} onClick={() => { closeMenu(); onHide(); }}><WorkspaceIcon kind="close" /><span>{hiding ? t('Ukrywanie…','Hiding…') : t('Ukryj rozmowę z listy','Hide conversation from list')}</span></button>
            <button type="button" className="ih70-menu-link ih70-menu-secondary" onClick={() => setOptionsMore(true)}><WorkspaceIcon kind="settings" /><span>{t('Ustawienia i pozostałe strony','Settings and more pages')}</span><WorkspaceIcon kind="next" /></button>
          </>}</nav>
        </WorkspaceSheet>
        {reportDialog}
      </>}
    </main>
  </>;

}
