import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSitePreferences } from './Preferences';
import { WorkspaceDisplaySettings } from './WorkspaceFlow';
import { useWorkspaceCopy, useWorkspaceListNavigation } from './Workspace';

export function ConversationGlyph({ kind = 'arrow', ...props }) {
  const paths = {
    arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
    back: <path d="M20 12H5m6-6-6 6 6 6" />,
    chat: <><path d="M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 3V6a2 2 0 0 1 1-2Z" /><path d="M8 9h9M8 13h6" /></>,
    terms: <><path d="M7 3h10l3 3v15H4V3h3Zm7 0v5h6" /><path d="M8 12h8M8 16h5" /></>,
    files: <><path d="M3 7V4h7l3 3h8v13H3V7Z" /><path d="M7 12h10M7 16h6" /></>,
    payment: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18m-5 5h2M7 15h3" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
    plus: <path d="M12 4v16M4 12h16" />, close: <path d="m6 6 12 12M18 6 6 18" />,
    more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" /></>,
    profile: <><circle cx="12" cy="7" r="4" /><path d="M4 21v-3a8 8 0 0 1 16 0v3" /></>,
    expand: <path d="M4 9V4h5m6 0h5v5m0 6v5h-5M9 20H4v-5" />,
    collapse: <path d="M9 3v6H3m12-6v6h6m-6 12v-6h6M3 15h6v6" />,
    down: <path d="m5 9 7 7 7-7" />,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 4m0 4h.01" /></>,
  };
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}>{paths[kind] || paths.arrow}</svg>;
}

function ConversationAvatar({ name = '', url, small = false }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);
  const initials = String(name || '').trim().split(/\s+/).slice(0, 2).map(word => Array.from(word)[0] || '').join('').toLocaleUpperCase();
  return <span className={'ihm-avatar' + (small ? ' is-small' : '')} aria-hidden="true">{url && !failed ? <img src={url} alt="" decoding="async" onError={() => setFailed(true)} /> : <span>{initials || 'IH'}</span>}</span>;
}

function ConversationLoading({ label }) {
  const t = useWorkspaceCopy();
  return <p className="ihm-loading" role="status"><span aria-hidden="true" /><span>{label || t('Wczytywanie rozmów…', 'Loading conversations…')}</span></p>;
}
function ConversationEmpty({ title, children, action, kind = 'chat' }) {
  return <div className="ihm-empty"><ConversationGlyph kind={kind} /><h2>{title}</h2>{children && <p>{children}</p>}{action}</div>;
}

export function WorkspaceInbox({ user, conversations = [], visibleConversations = [], loading, errorMessage, search, setSearch, inboxFilter, setInboxFilter, unreadCount }) {
  const t = useWorkspaceCopy(), en = useSitePreferences().language === 'en';
  const location = useLocation(), navigate = useNavigate(), openConversation = useWorkspaceListNavigation(loading);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearch(params.get('q') || '');
    setInboxFilter(params.get('unread') === '1' ? 'unread' : 'all');
  }, [location.search, setSearch, setInboxFilter]);
  function update(key, value) {
    const params = new URLSearchParams(location.search);
    if (value) params.set(key, value); else params.delete(key);
    if (key === 'q') setSearch(value); else setInboxFilter(value === '1' ? 'unread' : 'all');
    navigate({ pathname: '/messages', search: params.toString() ? '?' + params : '' }, { replace: true, state: {} });
  }
  function reset() { setSearch(''); setInboxFilter('all'); navigate('/messages', { replace: true }); }
  function date(value) {
    const d = new Date(value);
    return !value || Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(en ? 'en-GB' : 'pl-PL', { day: 'numeric', month: 'short' });
  }
  return <main id="ih68-content" className="ihm-app ihm-inbox">
    <header className="ihm-inbox-heading"><div><p>{t('Kontakt z klientami i wykonawcami', 'Conversations with clients and freelancers')}</p><h1>{t('Wiadomości', 'Messages')}</h1></div><Link to="/freelancers" className="ihm-button ihm-button-dark"><ConversationGlyph kind="plus" />{t('Rozpocznij rozmowę', 'Start a conversation')}</Link></header>
    <section className="ihm-inbox-surface" aria-label={t('Twoje rozmowy', 'Your conversations')}>
      <div className="ihm-inbox-tools"><label className="ihm-search"><ConversationGlyph kind="search" /><span className="ihm-sr">{t('Szukaj osoby, projektu lub wiadomości', 'Search people, projects or messages')}</span><input type="search" value={search} maxLength={160} placeholder={t('Znajdź rozmowę…', 'Find a conversation…')} onChange={event => update('q', event.target.value)} />{search && <button type="button" onClick={() => update('q', '')} aria-label={t('Wyczyść wyszukiwanie', 'Clear search')}><ConversationGlyph kind="close" /></button>}</label>
        <div className="ihm-filters" role="group" aria-label={t('Pokaż rozmowy', 'Show conversations')}><button type="button" aria-pressed={inboxFilter === 'all'} onClick={() => update('unread', '')}>{t('Wszystkie', 'All')}<span>{conversations.length}</span></button><button type="button" aria-pressed={inboxFilter === 'unread'} onClick={() => update('unread', '1')}>{t('Nieprzeczytane', 'Unread')}<span>{unreadCount || 0}</span></button></div>
      </div>
      {!loading && visibleConversations.length > 0 && <div className="ihm-list-labels" aria-hidden="true"><span>{t('Osoba', 'Person')}</span><span>{t('Projekt i ostatnia wiadomość', 'Project and last message')}</span><span>{t('Aktualizacja', 'Updated')}</span></div>}
      {loading ? <ConversationLoading /> : errorMessage ? <p className="ihm-feedback" role="alert">{errorMessage}</p> : visibleConversations.length ? <div className="ihm-conversation-list">{visibleConversations.map(item => {
        const name = item.otherProfile?.name || t('Użytkownik', 'User'), message = item.lastMessage;
        const preview = message ? (message.sender_id === user?.id ? t('Ty: ', 'You: ') : '') + (String(message.content || '').trim() || t('Przesłano materiały', 'Materials shared')) : t('Napisz pierwszą wiadomość', 'Write the first message');
        return <Link key={item.id} to={'/chat/' + item.id} onClick={event => openConversation(event, item.id)} className={'ihm-conversation-link' + (item.isUnread ? ' is-unread' : '')}>
          <span className="ihm-list-person"><ConversationAvatar name={name} url={item.otherProfile?.avatar_url} /><strong>{name}</strong>{item.isUnread && <span className="ihm-unread-dot" aria-label={t('Nieprzeczytana rozmowa', 'Unread conversation')} />}</span>
          <div className="ihm-list-preview"><span>{item.job?.title || t('Zapytanie o współpracę', 'Project inquiry')}</span><p>{preview}</p></div><time dateTime={item.sortDate || undefined}>{date(item.sortDate)}</time><ConversationGlyph kind="arrow" />
        </Link>;
      })}</div> : <ConversationEmpty title={conversations.length ? t('Brak pasujących rozmów', 'No matching conversations') : t('Tutaj zaczyna się rozmowa', 'Start a conversation here')} action={conversations.length ? <button type="button" className="ihm-button" onClick={reset}>{t('Pokaż wszystkie rozmowy', 'Show all conversations')}</button> : <Link to="/freelancers" className="ihm-button">{t('Przejdź do wykonawców', 'Browse freelancers')}<ConversationGlyph /></Link>}>{conversations.length ? t('Zmień wpisaną frazę lub wybierz wszystkie rozmowy.', 'Try a different search or show all conversations.') : t('Wybierz wykonawcę i opisz, czego potrzebujesz. Rozmowę i dalsze ustalenia znajdziesz tutaj.', 'Choose a freelancer and describe what you need. Your conversation and project terms will appear here.')}</ConversationEmpty>}
    </section>
  </main>;
}

export function WorkspaceThread({ messages, user, otherName, lastReadOwnMessageId, renderContent, onReport, viewportRef, onScroll, showLatest, onLatest }) {
  const t = useWorkspaceCopy(), en = useSitePreferences().language === 'en';
  const root = useRef(null), scrollCallback = useRef(onScroll);
  scrollCallback.current = onScroll;
  useEffect(() => {
    const pageScroll = () => {
      const room = root.current?.closest('.ihm-room');
      if (room && !room.classList.contains('is-expanded') && window.matchMedia('(min-width:851px)').matches && room.dataset.view === 'conversation' && document.scrollingElement) scrollCallback.current?.({ currentTarget: document.scrollingElement });
    };
    window.addEventListener('scroll', pageScroll, { passive: true });
    return () => window.removeEventListener('scroll', pageScroll);
  }, []);
  useEffect(() => {
    function close(event) {
      root.current?.querySelectorAll('.ihm-message-menu[open]').forEach(details => {
        if (event.type === 'keydown' && event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); details.removeAttribute('open'); details.querySelector('summary')?.focus(); }
        else if (event.type === 'pointerdown' && !details.contains(event.target)) details.removeAttribute('open');
      });
    }
    document.addEventListener('pointerdown', close); document.addEventListener('keydown', close, true);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', close, true); };
  }, []);
  return <div className="ihm-thread-holder" ref={root}><div className="ihm-thread" ref={viewportRef} role="log" tabIndex={0} aria-label={t('Historia rozmowy', 'Conversation history')} aria-live="polite" aria-relevant="additions text" onScroll={onScroll}>
    {!messages.length ? <ConversationEmpty title={t('Powiedz, czego potrzebujesz', 'Describe what you need')}>{t('Napisz do drugiej strony. Możesz opisać projekt, zapytać o dostępność lub dołączyć materiały.', 'Message the other person. Describe the project, ask about availability or add materials.')}</ConversationEmpty> : <div className="ihm-message-list">{messages.map((message, index) => {
      const own = message.sender_id === user?.id, author = message.sender_role === 'admin' ? t('Administrator IdeaHire', 'IdeaHire administrator') : own ? t('Ty', 'You') : otherName;
      const timestamp = new Date(message.created_at), previous = messages[index - 1];
      const day = !previous || new Date(previous.created_at).toDateString() !== timestamp.toDateString();
      const followup = !day && previous.sender_id === message.sender_id && timestamp - new Date(previous.created_at) < 300000;
      const validDate = Number.isFinite(timestamp.getTime());
      return <React.Fragment key={message.id}>{day && validDate && <div className="ihm-day"><time dateTime={message.created_at}>{timestamp.toLocaleDateString(en ? 'en-GB' : 'pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}</time></div>}
        <article className={'ihm-message' + (own ? ' is-own' : '') + (followup ? ' is-followup' : '')} aria-label={own ? t('Twoja wiadomość', 'Your message') : author}>
          <header><strong>{author}</strong>{validDate && <time dateTime={message.created_at}>{timestamp.toLocaleTimeString(en ? 'en-GB' : 'pl-PL', { hour: '2-digit', minute: '2-digit' })}</time>}</header>
          <div className="ihm-message-body">{renderContent(message)}</div>
          {(message.id === lastReadOwnMessageId || !own && message.moderation_status !== 'hidden') && <footer>{message.id === lastReadOwnMessageId && <span className="ihm-seen"><ConversationGlyph kind="check" />{t('Wyświetlono', 'Seen')}</span>}{!own && message.moderation_status !== 'hidden' && <details className="ihm-message-menu"><summary aria-label={t('Opcje wiadomości', 'Message options')}><ConversationGlyph kind="more" /></summary><button type="button" onClick={event => { event.currentTarget.closest('details')?.removeAttribute('open'); onReport(message.id); }}>{t('Zgłoś wiadomość', 'Report message')}</button></details>}</footer>}
        </article>
      </React.Fragment>;
    })}</div>}
  </div>{showLatest && <button type="button" className="ihm-latest" onClick={onLatest}><ConversationGlyph kind="down" />{t('Najnowsza wiadomość', 'Latest message')}</button>}</div>;
}

function fitDraft(field) {
  if (!field || !field.getClientRects().length) return;
  const maximum = parseFloat(getComputedStyle(field).maxHeight), limit = Number.isFinite(maximum) ? maximum : 176;
  field.style.setProperty('height', 'auto', 'important');
  const height = field.scrollHeight;
  field.style.setProperty('height', Math.min(height, limit) + 'px', 'important');
  field.style.setProperty('overflow-y', height > limit ? 'auto' : 'hidden', 'important');
}
export function WorkspaceComposer({ draft, setDraft, sending, blocked, composerRef, onSubmit, onMaterials, errorMessage, blockedByMe, profileId, recipientName }) {
  const t = useWorkspaceCopy();
  useLayoutEffect(() => fitDraft(composerRef.current), [draft, composerRef, blocked]);
  useEffect(() => {
    const field = composerRef.current;
    if (!field) return;
    let frame = 0;
    const resize = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(() => fitDraft(field)); };
    const observer = window.ResizeObserver ? new ResizeObserver(resize) : null;
    observer?.observe(field.parentElement);
    window.addEventListener('resize', resize); window.visualViewport?.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(frame); observer?.disconnect(); window.removeEventListener('resize', resize); window.visualViewport?.removeEventListener('resize', resize); };
  }, [composerRef, blocked]);
  return <div className="ihm-composer-area">
    {errorMessage && <p className="ihm-feedback" role="alert">{errorMessage}</p>}
    {blocked ? <div className="ihm-blocked"><ConversationGlyph kind="lock" /><p>{blockedByMe ? t('Rozmowa jest zablokowana. Możesz odblokować osobę na jej profilu.', 'This conversation is blocked. You can unblock the person on their profile.') : t('Wysyłanie wiadomości jest wyłączone.', 'Sending messages is disabled.')}{blockedByMe && <Link to={'/profile/' + profileId}>{t('Otwórz profil', 'Open profile')}</Link>}</p></div> : <>
      <form className="ihm-composer" onSubmit={onSubmit} aria-busy={sending}>
        <button type="button" className="ihm-attach" onClick={onMaterials} disabled={sending} aria-label={t('Dodaj materiały do rozmowy', 'Add conversation materials')} title={t('Dodaj plik, link lub tekst', 'Add a file, link or text')}><ConversationGlyph kind="plus" /></button>
        <label htmlFor="ihm-draft" className="ihm-sr">{t('Wiadomość do: ', 'Message to: ') + recipientName}</label>
        <textarea id="ihm-draft" ref={composerRef} rows={1} value={draft} maxLength={4000} disabled={sending} aria-describedby="ihm-compose-help" placeholder={t('Napisz do ', 'Message ') + recipientName + '…'} onChange={event => setDraft(event.target.value)} onKeyDown={event => {
          if (event.isComposing || event.nativeEvent?.isComposing) return;
          if (event.key === 'Enter' && !event.shiftKey && !window.matchMedia?.('(pointer: coarse)').matches) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); }
        }} />
        <button type="submit" className="ihm-send" disabled={sending || !draft.trim()} aria-label={sending ? t('Wysyłanie wiadomości', 'Sending message') : t('Wyślij wiadomość', 'Send message')}><span>{sending ? t('Wysyłanie…', 'Sending…') : t('Wyślij', 'Send')}</span><ConversationGlyph kind="arrow" /></button>
      </form><p id="ihm-compose-help" className="ihm-sr">{t('Na komputerze Enter wysyła, a Shift + Enter dodaje linię.', 'On desktop, Enter sends and Shift + Enter adds a line.')}</p>{draft.length >= 3200 && <p className="ihm-draft-count">{draft.length.toLocaleString()} / 4 000</p>}
    </>}
  </div>;
}

function ConversationDialog({ open, onClose, title, children }) {
  const ref = useRef(null), outside = useRef(false), titleId = useId(), t = useWorkspaceCopy();
  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const before = document.activeElement, overflow = document.body.style.getPropertyValue('overflow'), priority = document.body.style.getPropertyPriority('overflow');
    if (!dialog.open) dialog.showModal();
    document.body.style.setProperty('overflow', 'hidden', 'important');
    dialog.querySelector('h2')?.focus({ preventScroll: true });
    return () => { if (dialog.open) dialog.close(); if (overflow) document.body.style.setProperty('overflow', overflow, priority); else document.body.style.removeProperty('overflow'); if (before?.isConnected) before.focus?.({ preventScroll: true }); };
  }, [open]);
  function isOutside(event) { const box = event.currentTarget.getBoundingClientRect(); return event.target === event.currentTarget && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom); }
  return <dialog ref={ref} className="ihm-options-dialog" aria-modal="true" aria-labelledby={titleId} onCancel={event => { event.preventDefault(); event.stopPropagation(); onClose(); }} onPointerDown={event => { outside.current = isOutside(event); }} onPointerUp={event => { if (outside.current && isOutside(event)) onClose(); outside.current = false; }}><header><h2 id={titleId} tabIndex={-1}>{title}</h2><button type="button" onClick={onClose} aria-label={t('Zamknij', 'Close')}><ConversationGlyph kind="close" /></button></header><div>{children}</div></dialog>;
}

export function WorkspaceConversation({ loading, errorMessage, hasConversation, otherName, avatarUrl, profileId, blocked, jobTitle, category, materialCount, accepted, view, onView, focusMode, onFocusMode, onBack, backLabel, onHide, hiding, onDispute, canDispute, projectDetails, projectPlan, nextStep, thread, composer, materials, plan, payment, paymentOverview, disputePanel, reportDialog, projectAction, helpUrl }) {
  const t = useWorkspaceCopy(), frameRef = useRef(null);
  const [optionsOpen, setOptionsOpen] = useState(false), [navigationOpen, setNavigationOpen] = useState(false);
  const views = [['conversation', 'chat', t('Rozmowa', 'Conversation')], ['plan', 'terms', t('Warunki', 'Terms')], ['files', 'files', t('Materiały', 'Materials')], ['payment', 'payment', t('Rozliczenie', 'Payment')]];
  const selectedLabel = views.find(item => item[0] === view)?.[2] || views[0][2];
  function selectView(value) { setNavigationOpen(false); onView(value); }
  useLayoutEffect(() => {
    const dock = document.getElementById('ih64-lucyna');
    if (!dock) return;
    const before = dock.style.getPropertyValue('--ih84-safe-bottom');
    const priority = dock.style.getPropertyPriority('--ih84-safe-bottom');
    let previous;
    const restore = () => { if (before) dock.style.setProperty('--ih84-safe-bottom', before, priority); else dock.style.removeProperty('--ih84-safe-bottom'); };
    const reserve = () => {
      const composerArea = frameRef.current?.querySelector('.ihm-composer-area');
      const inset = window.matchMedia('(max-width:850px)').matches && view === 'conversation' && composerArea ? Math.ceil(composerArea.getBoundingClientRect().height) + 8 : null;
      if (inset === previous) return;
      previous = inset;
      if (inset === null) restore(); else dock.style.setProperty('--ih84-safe-bottom', inset + 'px');
      window.dispatchEvent(new Event('resize'));
    };
    const observer = window.ResizeObserver ? new ResizeObserver(reserve) : null;
    const composerArea = frameRef.current?.querySelector('.ihm-composer-area');
    if (composerArea) observer?.observe(composerArea);
    window.addEventListener('resize', reserve); reserve();
    return () => { observer?.disconnect(); window.removeEventListener('resize', reserve); restore(); window.dispatchEvent(new Event('resize')); };
  }, [view, hasConversation, focusMode]);
  useLayoutEffect(() => {
    let task = 0, scrollTask = 0;
    const viewport = window.visualViewport, element = frameRef.current;
    function measure() {
      task = 0;
      if (!element) return;
      const narrow = window.matchMedia('(max-width:850px)').matches;
      if (!focusMode && !narrow) { element.style.removeProperty('--ihm-room-height'); element.style.removeProperty('top'); element.classList.remove('is-keyboard'); return; }
      const inset = focusMode && !narrow ? 12 : 0, height = Math.max(160, Math.floor((viewport?.height || window.innerHeight) - 2 * inset));
      const log = element.querySelector('.ihm-thread'), atEnd = log && log.scrollHeight - log.scrollTop - log.clientHeight < 100;
      element.style.setProperty('--ihm-room-height', height + 'px');
      element.style.setProperty('top', (viewport?.offsetTop || 0) + inset + 'px', 'important');
      element.classList.toggle('is-keyboard', narrow && document.activeElement?.id === 'ihm-draft' && height < 460);
      if (atEnd) { cancelAnimationFrame(scrollTask); scrollTask = requestAnimationFrame(() => { log.scrollTop = log.scrollHeight; }); }
    }
    const schedule = () => { if (!task) task = requestAnimationFrame(measure); };
    window.addEventListener('resize', schedule); document.addEventListener('focusin', schedule); document.addEventListener('focusout', schedule); viewport?.addEventListener('resize', schedule); viewport?.addEventListener('scroll', schedule); schedule();
    return () => { cancelAnimationFrame(task); cancelAnimationFrame(scrollTask); window.removeEventListener('resize', schedule); document.removeEventListener('focusin', schedule); document.removeEventListener('focusout', schedule); viewport?.removeEventListener('resize', schedule); viewport?.removeEventListener('scroll', schedule); };
  }, [focusMode]);
  useEffect(() => {
    if (!focusMode) return;
    const frame = frameRef.current, header = document.querySelector('.ih68-header'), inert = header?.inert, before = document.activeElement;
    const overflow = document.body.style.getPropertyValue('overflow'), priority = document.body.style.getPropertyPriority('overflow');
    if (header) header.inert = true;
    document.body.style.setProperty('overflow', 'hidden', 'important');
    const raf = requestAnimationFrame(() => frame?.querySelector('.ihm-focus-exit')?.focus({ preventScroll: true }));
    function keyboard(event) {
      const dialog = event.target.closest?.('dialog[open], [role="dialog"]');
      if (event.defaultPrevented || dialog && dialog !== frame) return;
      if (event.key === 'Escape') { event.preventDefault(); onFocusMode(false); return; }
      if (event.key !== 'Tab') return;
      const all = [...(frame?.querySelectorAll('a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),summary,[tabindex="0"]') || [])].filter(node => node.tabIndex >= 0 && !node.closest('[hidden],[inert],dialog:not([open])') && node.getClientRects().length > 0);
      const first = all[0], last = all.at(-1);
      if (!first) return;
      if (event.shiftKey && (document.activeElement === first || !frame.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !frame.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener('keydown', keyboard);
    return () => { cancelAnimationFrame(raf); if (header) header.inert = !!inert; if (overflow) document.body.style.setProperty('overflow', overflow, priority); else document.body.style.removeProperty('overflow'); document.removeEventListener('keydown', keyboard); const target = before?.isConnected && before.getClientRects().length ? before : frame?.querySelector('#ihm-room-options'); target?.focus?.({ preventScroll: true }); };
  }, [focusMode, onFocusMode]);
  function navigation() { return <nav className="ihm-project-nav" aria-label={t('Obszary współpracy', 'Project areas')}>{views.map(([key, icon, label]) => <button type="button" key={key} aria-current={view === key ? 'page' : undefined} aria-controls={key === 'conversation' ? 'ihm-conversation-panel' : 'ihm-panel-' + key} onClick={() => selectView(key)}><ConversationGlyph kind={icon} /><span>{label}</span>{key === 'files' && materialCount > 0 && <small>{materialCount}</small>}{key === 'plan' && accepted && <span className="ihm-nav-complete" aria-label={t('Warunki zaakceptowane', 'Terms accepted')}><ConversationGlyph kind="check" /></span>}</button>)}</nav>; }
  return <main ref={frameRef} id="ih68-content" data-view={view} className={'ihm-app ihm-room' + (focusMode ? ' is-expanded' : '')} role={focusMode ? 'dialog' : undefined} aria-modal={focusMode ? true : undefined} aria-label={t('Rozmowa IdeaHire', 'IdeaHire conversation')}>
    {loading ? <ConversationLoading label={t('Otwieranie rozmowy…', 'Opening conversation…')} /> : !hasConversation ? <ConversationEmpty title={t('Nie można otworzyć rozmowy', 'Unable to open this conversation')} action={<button type="button" className="ihm-button" onClick={onBack}><ConversationGlyph kind="back" />{backLabel}</button>}>{errorMessage}</ConversationEmpty> : <>
      <aside className="ihm-rail"><button type="button" className="ihm-rail-back" onClick={onBack}><ConversationGlyph kind="back" /><span>{backLabel}</span></button><div className="ihm-project-label"><span>{t('Projekt', 'Project')}</span><p>{jobTitle || t('Zapytanie o współpracę', 'Project inquiry')}</p></div>{navigation()}{nextStep && <section className="ihm-next-step"><span>{t('Następny krok', 'Next step')}</span><strong>{nextStep.title}</strong><p>{nextStep.description}</p><button type="button" onClick={nextStep.onAction}>{nextStep.actionLabel}<ConversationGlyph /></button></section>}<div className="ihm-rail-footer">{helpUrl && <a href={helpUrl}><ConversationGlyph kind="help" />{t('Centrum pomocy', 'Help centre')}</a>}<Link to="/privacy-center">{t('Prywatność i dane', 'Privacy & data')}</Link></div></aside>
      <div className="ihm-workspace"><header className="ihm-room-header"><div className="ihm-identity"><button type="button" className="ihm-mobile-back" onClick={onBack} aria-label={t('Wróć: ', 'Back to: ') + backLabel}><ConversationGlyph kind="back" /></button><Link to={'/profile/' + profileId} className="ihm-profile-avatar" aria-label={t('Profil: ', 'Profile: ') + otherName}><ConversationAvatar name={otherName} url={blocked ? null : avatarUrl} small /></Link><div><Link to={'/profile/' + profileId}><h1>{blocked ? t('Zablokowany użytkownik', 'Blocked user') : otherName}</h1></Link><p>{jobTitle || t('Zapytanie o współpracę', 'Project inquiry')}</p></div></div>
        <div className="ihm-header-actions"><div className="ihm-context-controls"><button type="button" className="ihm-mobile-view" aria-haspopup="dialog" aria-expanded={navigationOpen} onClick={() => setNavigationOpen(true)}>{selectedLabel}<ConversationGlyph kind="down" /></button><button type="button" className={'ihm-payment-state is-' + (paymentOverview?.tone || 'neutral')} onClick={() => selectView('payment')} aria-label={t('Status płatności: ', 'Payment status: ') + (paymentOverview?.label || t('Sprawdzanie', 'Checking'))}><i aria-hidden="true" /><span role="status" aria-live="polite" aria-atomic="true">{paymentOverview?.label || t('Sprawdzanie…', 'Checking…')}</span></button></div>{focusMode && <button type="button" className="ihm-icon-button ihm-focus-exit" onClick={() => onFocusMode(false)} aria-label={t('Przywróć widok', 'Restore view')}><ConversationGlyph kind="collapse" /></button>}<button type="button" id="ihm-room-options" className="ihm-icon-button ihm-options-trigger" aria-label={t('Opcje rozmowy', 'Conversation options')} aria-haspopup="dialog" aria-expanded={optionsOpen} onClick={() => setOptionsOpen(true)}><ConversationGlyph kind="more" /></button></div>
      </header>{disputePanel}
        <div className="ihm-room-content"><section id="ihm-conversation-panel" className="ihm-correspondence" hidden={view !== 'conversation'} aria-label={t('Rozmowa', 'Conversation')}>{thread}{composer}</section>
          <section id="ihm-panel-plan" className="ihm-panel" hidden={view !== 'plan'} tabIndex={-1} aria-label={t('Warunki współpracy', 'Project terms')}>{view === 'plan' && <><header className="ihm-panel-heading"><h2>{t('Warunki współpracy', 'Project terms')}</h2><p>{t('Jedna propozycja. Ten sam zakres, cena i termin dla obu stron.', 'One proposal. The same scope, price and deadline for both parties.')}</p></header>{projectAction}{plan}<details className="ihm-source-brief"><summary>{t('Wróć do opisu zapytania i planu', 'View the original brief and plan')}<ConversationGlyph kind="down" /></summary><div><h3>{jobTitle || t('Zapytanie o współpracę', 'Project inquiry')}</h3>{category && <p>{category}</p>}{projectDetails}{projectPlan}</div></details></>}</section>
          <section id="ihm-panel-files" className="ihm-panel ihm-materials-panel" hidden={view !== 'files'} tabIndex={-1} aria-label={t('Materiały projektu', 'Project materials')}><header className="ihm-panel-heading"><h2>{t('Materiały projektu', 'Project materials')}</h2><p>{t('To, co wysyłasz i otrzymujesz w tej rozmowie.', 'Everything you send and receive in this conversation.')}</p></header>{materials}</section>
          <section id="ihm-panel-payment" className="ihm-panel ihm-payment-panel" hidden={view !== 'payment'} tabIndex={-1} aria-label={t('Rozliczenie', 'Payment')}>{view === 'payment' && <><header className="ihm-panel-heading"><h2>{t('Rozliczenie projektu', 'Project payment')}</h2><p>{t('Aktualny status i kwoty powiązane z Waszymi ustaleniami.', 'The current status and amounts linked to your agreed terms.')}</p></header>{payment}</>}</section>
        </div>
      </div>
      <ConversationDialog open={navigationOpen} onClose={() => setNavigationOpen(false)} title={t('Przejdź do', 'Go to')}>{navigation()}{nextStep && <p className="ihm-mobile-step">{nextStep.title}</p>}</ConversationDialog>
      <ConversationDialog open={optionsOpen} onClose={() => setOptionsOpen(false)} title={t('Opcje rozmowy', 'Conversation options')}><nav className="ihm-options-list"><Link to={'/profile/' + profileId} onClick={() => setOptionsOpen(false)}><ConversationGlyph kind="profile" />{t('Profil i opcje blokowania', 'Profile and blocking options')}<ConversationGlyph /></Link><button type="button" disabled={!canDispute} onClick={() => { setOptionsOpen(false); onDispute(); }}><ConversationGlyph kind="help" />{t('Zgłoś problem ze współpracą', 'Report a project issue')}</button><button type="button" onClick={() => { setOptionsOpen(false); onFocusMode(!focusMode); }}><ConversationGlyph kind={focusMode ? 'collapse' : 'expand'} />{focusMode ? t('Przywróć widok', 'Restore view') : t('Skup się na rozmowie', 'Focus on the conversation')}</button><button type="button" disabled={hiding} onClick={() => { setOptionsOpen(false); onHide(); }}><ConversationGlyph kind="close" />{hiding ? t('Ukrywanie…', 'Hiding…') : t('Ukryj rozmowę z listy', 'Hide conversation from list')}</button><Link to="/messages" onClick={() => setOptionsOpen(false)}><ConversationGlyph kind="chat" />{t('Wszystkie rozmowy', 'All conversations')}</Link><WorkspaceDisplaySettings onNavigate={() => setOptionsOpen(false)} /></nav></ConversationDialog>{reportDialog}
    </>}
  </main>;
}
