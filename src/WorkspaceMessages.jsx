/* One conversation surface; project actions keep their existing permissions. */
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSitePreferences } from './Preferences';
import { SubpageHeading } from './Subpages';
import { WorkspaceSheet, WorkspaceDisplaySettings } from './WorkspaceFlow';
import { WorkspaceAvatar, WorkspaceConversationRows, WorkspaceIcon, WorkspaceLoading, useWorkspaceCopy } from './Workspace';
export function WorkspaceInbox({
  user, conversations = [], visibleConversations = [], loading, errorMessage,
  search, setSearch, inboxFilter, setInboxFilter, unreadCount,
}) {
  const t = useWorkspaceCopy();
  const location = useLocation();
  const navigate = useNavigate();
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
  function reset() {
    setSearch('');
    setInboxFilter('all');
    navigate('/messages', { replace: true });
  }
  return <main className="ih68-page ih72-inbox" id="ih68-content">
    <SubpageHeading title={t('Wiadomości', 'Messages')} actions={<Link to="/freelancers" className="ih72-new-conversation"><WorkspaceIcon kind="plus" /><span>{t('Nowa rozmowa', 'New conversation')}</span></Link>} />
    <div className="ih79-inbox-layout ih-inbox-single"><div className="ih79-inbox-list">
    <div className="ih72-list-toolbar">
      <div className="ih72-filters" role="group" aria-label={t('Filtr rozmów', 'Conversation filter')}>
        <button type="button" aria-pressed={inboxFilter === 'all'} onClick={() => update('unread', '')}>{t('Wszystkie', 'All')}{!loading && <span>{conversations.length}</span>}</button>
        <button type="button" aria-pressed={inboxFilter === 'unread'} onClick={() => update('unread', '1')}>{t('Nieprzeczytane', 'Unread')}{unreadCount > 0 && <span>{unreadCount}</span>}</button>
      </div>
      <label className="ih72-search"><span className="ih68-sr-only">{t('Szukaj osoby, projektu lub wiadomości', 'Search people, projects or messages')}</span><WorkspaceIcon kind="search" /><input type="search" maxLength={160} value={search} onChange={event => update('q', event.target.value)} placeholder={t('Szukaj w rozmowach', 'Search conversations')} />{search && <button type="button" aria-label={t('Wyczyść wyszukiwanie', 'Clear search')} onClick={() => update('q', '')}><WorkspaceIcon kind="close" /></button>}</label>
    </div>
    <section className="ih72-inbox-content" aria-label={t('Lista rozmów', 'Conversation list')}>
      {loading ? <WorkspaceLoading /> : errorMessage ? <p className="ih68-feedback" role="alert">{errorMessage}</p> : visibleConversations.length ?
        <WorkspaceConversationRows conversations={visibleConversations} user={user} loading={loading} /> :
        <div className="ih79-empty"><h2>{conversations.length ? t('Brak pasujących rozmów', 'No matching conversations') : t('Brak rozmów', 'No conversations')}</h2><p>{conversations.length ? t('Zmień wyszukiwanie lub pokaż wszystkie rozmowy.', 'Change your search or show all conversations.') : t('Znajdź wykonawcę albo odpowiedz na zlecenie. Wiadomości znajdziesz tutaj.', 'Find a freelancer or reply to a job. Your messages will appear here.')}</p>{conversations.length ? <button type="button" className="ih68-secondary" onClick={reset}>{t('Pokaż wszystkie', 'Show all')}</button> : <Link to="/freelancers" className="ih68-primary">{t('Znajdź wykonawcę', 'Find a freelancer')}<WorkspaceIcon kind="arrow" /></Link>}</div>}
    </section>
    </div></div>
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
  const scrollCallback = useRef(onScroll);
  scrollCallback.current = onScroll;
  useEffect(() => {
    const pageScroll = () => {
      const room = optionsRoot.current?.closest('.ih-message-workspace');
      if (!room || room.classList.contains('is-focus') || !window.matchMedia('(min-width:851px)').matches) return;
      if (room.dataset.view === 'conversation' && document.scrollingElement) {
        scrollCallback.current?.({ currentTarget: document.scrollingElement });
      }
    };
    window.addEventListener('scroll', pageScroll, { passive: true });
    return () => window.removeEventListener('scroll', pageScroll);
  }, []);
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
          const admin = message.sender_role === 'admin';
          const authorName = admin ? t('Administrator IdeaHire', 'IdeaHire administrator') : otherName;
          const previous = messages[index - 1];
          const day = !previous || new Date(previous.created_at).toDateString() !== new Date(message.created_at).toDateString();
          const followup = !day && previous.sender_id === message.sender_id && new Date(message.created_at) - new Date(previous.created_at) < 300000;
          return <React.Fragment key={message.id}>{day && <div className="ih68-day"><time dateTime={message.created_at}>{new Date(message.created_at).toLocaleDateString(en ? 'en-GB' : 'pl-PL', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}</time></div>}
        <article className={'ih68-message' + (own ? ' is-own' : ' is-received') + (followup ? ' is-followup' : '')} aria-label={admin ? authorName : own ? t('Twoja wiadomość', 'Your message') : otherName}>
          {!own && !followup && <strong className="ih69-message-author">{authorName}</strong>}
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
  const maximum = parseFloat(getComputedStyle(field).maxHeight);
  const limit = Number.isFinite(maximum) ? maximum : Infinity;
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
  profileId,
  recipientName
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
    {!blocked && <p className="ih-compose-recipient">{t('Wiadomość do', 'Message to')} <strong>{recipientName}</strong></p>}
    {blocked ? <p className="ih68-block-note"><WorkspaceIcon kind="lock" /><span>{blockedByMe ? t('Rozmowa jest zablokowana. Możesz odblokować osobę na jej profilu.', 'This conversation is blocked. You can unblock the person on their profile.') : t('Wysyłanie wiadomości w tej rozmowie jest wyłączone.', 'Sending messages in this conversation is disabled.')}{blockedByMe && <Link to={'/profile/' + profileId}>{t('Otwórz profil', 'Open profile')}</Link>}</span></p> :
      <form className="ih68-composer ih72-composer" onSubmit={onSubmit} aria-busy={sending}>
        <button type="button" className="ih68-attach" onClick={onMaterials} disabled={sending}
          aria-label={t('Dodaj plik lub link do tej rozmowy', 'Add a file or link to this conversation')} title={t('Dodaj plik lub link', 'Add a file or link')}><WorkspaceIcon kind="attachment" /><span className="ih-compose-action-label">{t('Plik lub link', 'File or link')}</span></button>
        <label className="ih68-sr-only" htmlFor="ih68-message-draft">{t('Treść wiadomości', 'Message text')}</label>
        <textarea id="ih68-message-draft" ref={composerRef} rows={1} value={draft} maxLength={4000} aria-describedby="ih-compose-keyboard-help"
          placeholder={t('Napisz wiadomość…', 'Write a message…')} disabled={sending}
          onChange={event => setDraft(event.target.value)} onKeyDown={event => {
            if (event.isComposing || event.nativeEvent?.isComposing) return;
            if (event.key === 'Enter' && !event.shiftKey && !window.matchMedia?.('(pointer: coarse)').matches) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }} />
        <button type="submit" className="ih68-send" disabled={sending || !draft.trim()}
          aria-label={sending ? t('Wysyłanie wiadomości', 'Sending message') : t('Wyślij wiadomość', 'Send message')}
          title={sending ? t('Wysyłanie…', 'Sending…') : t('Wyślij', 'Send')}><span className="ih-compose-action-label">{sending ? t('Wysyłanie…', 'Sending…') : t('Wyślij', 'Send')}</span><WorkspaceIcon kind="send" /></button>
      </form>}
    {!blocked && <><p id="ih-compose-keyboard-help" className="ih68-sr-only">{t('Na komputerze Enter wysyła, a Shift + Enter dodaje nową linię.', 'On desktop, Enter sends and Shift + Enter adds a new line.')}</p>{draft.length >= 3200 && <p className="ih-compose-count" aria-label={t('Liczba znaków wiadomości', 'Message character count')}>{draft.length.toLocaleString()} / 4 000</p>}</>}
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
  category,
  materialCount,
  accepted,
  view,
  onView,
  focusMode,
  onFocusMode,
  onBack,
  backLabel,
  onHide,
  hiding,
  onDispute,
  canDispute,
  projectDetails,
  projectPlan,
  nextStep,
  thread,
  composer,
  materials,
  plan,
  payment,
  paymentOverview,
  disputePanel,
  reportDialog,
  projectAction
}) {
  const t = useWorkspaceCopy();
  const frameRef = useRef(null);
  const [optionsOpen, setOptionsOpen] = useState(false);
  useLayoutEffect(() => {
    let task = 0,
      scrollTask = 0;
    const viewport = window.visualViewport,
      element = frameRef.current;
    function measure() {
      task = 0;
      if (!element) return;
      if (!focusMode && window.matchMedia?.('(min-width:851px)').matches) {
        element.style.removeProperty('--ih68-room-height');
        element.style.removeProperty('top');
        element.classList.remove('is-keyboard');
        return;
      }
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
  const closeMenu = () => setOptionsOpen(false);
  const showPlan = view === 'plan';
  const closeContext = () => onView('conversation');
  return <>
    {focusMode && createPortal(<div className="ih68-focus-scrim" aria-hidden="true" />, document.body)}
    <main ref={frameRef} id="ih68-content" data-view={view}
      role={focusMode ? 'dialog' : undefined} aria-modal={focusMode ? true : undefined}
      aria-label={t('Rozmowa IdeaHire', 'IdeaHire conversation')}
      className={'ih68-room ih72-room ih-structured-room ih-message-workspace ih-chat-workspace' + (focusMode ? ' is-focus' : '')}>
      {loading ? <WorkspaceLoading /> : !hasConversation ?
        <section className="ih68-room-error"><h1>{t('Nie można otworzyć rozmowy', 'Unable to open this conversation')}</h1><p role="alert">{errorMessage}</p><button type="button" className="ih68-secondary" onClick={onBack}><WorkspaceIcon kind="back" />{backLabel}</button></section> : <>
        <header className="ih68-room-header">
          <button type="button" className="ih68-room-back ih68-icon-button" onClick={onBack} aria-label={t('Wróć: ', 'Back to: ') + backLabel}><WorkspaceIcon kind="back" /></button>
          <Link className="ih69-person-avatar" to={'/profile/' + profileId} aria-label={t('Profil: ', 'Profile: ') + otherName}><WorkspaceAvatar name={otherName} url={blocked ? null : avatarUrl} small /></Link>
          <div className="ih68-room-person"><Link to={'/profile/' + profileId}><h1>{blocked ? t('Zablokowany użytkownik', 'Blocked user') : otherName}</h1></Link><p className="ih72-room-context">{jobTitle || t('Zapytanie o współpracę', 'Project inquiry')}</p></div>
          <div className="ih68-room-header-tools">
            {focusMode && <button type="button" className="ih68-focus-exit ih68-icon-button" aria-label={t('Przywróć widok', 'Restore view')} onClick={() => onFocusMode(false)}><WorkspaceIcon kind="collapse" /></button>}
            <button type="button" id="ih70-room-options" className="ih68-icon-button" aria-haspopup="dialog" aria-expanded={optionsOpen} aria-label={t('Opcje rozmowy', 'Conversation options')} onClick={() => setOptionsOpen(true)}><WorkspaceIcon kind="more" /></button>
          </div>
        </header>
        <nav className="ih72-room-nav" aria-label={t('Rozmowa i współpraca', 'Conversation and project')}>
          <button type="button" aria-current={view === 'conversation' ? 'page' : undefined} aria-controls="ih69-conversation-panel" onClick={() => onView('conversation')}><WorkspaceIcon kind="message" /><span>{t('Rozmowa', 'Chat')}</span></button>
          <button type="button" aria-current={view === 'plan' ? 'page' : undefined} aria-controls="ih68-room-plan" onClick={() => onView('plan')}><WorkspaceIcon kind="jobs" /><span>{t('Ustalenia', 'Terms')}</span>{accepted && <WorkspaceIcon kind="check" className="ih72-terms-check" aria-label={t('Warunki zaakceptowane', 'Terms accepted')} aria-hidden="false" />}</button>
          <button type="button" aria-current={view === 'files' ? 'page' : undefined} aria-controls="ih68-room-files" onClick={() => onView('files')}><WorkspaceIcon kind="files" /><span>{t('Pliki', 'Files')}</span>{materialCount > 0 && <small>{materialCount}</small>}</button>
          <button type="button" aria-current={view === 'payment' ? 'page' : undefined} aria-controls="ih68-room-payment" onClick={() => onView('payment')}><WorkspaceIcon kind="lock" /><span>{t('Płatność', 'Payment')}</span></button>
        <button type="button" className={'ih-room-payment-status ih-message-payment-control is-' + (paymentOverview?.tone || 'neutral')} onClick={() => onView('payment')} aria-controls="ih68-room-payment">
          <span>{t('Status płatności', 'Payment status')}</span><strong role="status" aria-live="polite" aria-atomic="true">{paymentOverview?.label || t('Sprawdzanie…', 'Checking…')}</strong><WorkspaceIcon kind="next" />
        </button>
        </nav>
        {disputePanel}
        <div className="ih68-room-body">
          <section className="ih68-correspondence" id="ih69-conversation-panel" aria-label={t('Rozmowa', 'Conversation')} hidden={view !== 'conversation'}>
            {nextStep && <aside className="ih-chat-next-step" aria-label={t('Co dalej', 'Next step')}><div><strong>{nextStep.title}</strong><p>{nextStep.description}</p></div><button type="button" onClick={nextStep.onAction}>{nextStep.actionLabel}<WorkspaceIcon kind="next" /></button></aside>}
            {thread}{composer}
          </section>
          <section hidden={view !== 'files'} className="ih68-room-page ih69-materials-page" id="ih68-room-files" tabIndex={-1} aria-label={t('Materiały projektu', 'Project materials')}>
            <header className="ih72-panel-heading"><div><button type="button" className="ih72-panel-back" onClick={closeContext}><WorkspaceIcon kind="back" />{t('Wróć do rozmowy', 'Back to conversation')}</button><h2>{t('Materiały', 'Materials')}</h2><p>{t('Pliki, linki i przekazane rezultaty w jednym miejscu.', 'Files, links and delivered work in one place.')}</p></div></header>{materials}
          </section>
          <section hidden={!showPlan} className="ih68-room-page ih68-terms" id="ih68-room-plan" tabIndex={-1} aria-label={t('Ustalenia', 'Terms')}>
            {showPlan && <><header className="ih72-panel-heading"><div><button type="button" className="ih72-panel-back" onClick={closeContext}><WorkspaceIcon kind="back" />{t('Wróć do rozmowy', 'Back to conversation')}</button><h2>{t('Ustalenia projektu', 'Project terms')}</h2><p>{t('Zakres, cena, termin i poprawki. Każda propozycja wymaga akceptacji obu stron.', 'Scope, price, deadline and revisions. Each proposal needs both parties’ acceptance.')}</p></div></header>
              {projectAction}
              {plan}
              <details className="ih72-project-description ih-chat-source"><summary>{t('Pierwotny opis i dodatkowy plan', 'Original brief and additional plan')}<WorkspaceIcon kind="down" /></summary><div><h3>{jobTitle || t('Zapytanie o współpracę', 'Project inquiry')}</h3>{category && <p>{category}</p>}{projectDetails}{projectPlan}</div></details>
            </>}
          </section>
          <section hidden={view !== 'payment'} className="ih68-room-page ih-room-payment-page" id="ih68-room-payment" tabIndex={-1} aria-label={t('Płatność', 'Payment')}>
            {view === 'payment' && <><header className="ih72-panel-heading"><div><button type="button" className="ih72-panel-back" onClick={closeContext}><WorkspaceIcon kind="back" />{t('Wróć do rozmowy', 'Back to conversation')}</button><h2>{t('Płatność', 'Payment')}</h2><p>{t('Bieżący status płatności i rozliczenia tego projektu.', 'The current payment and settlement status for this project.')}</p></div></header>{payment}</>}
          </section>
        </div>
        <WorkspaceSheet open={optionsOpen} onClose={closeMenu} title={t('Opcje rozmowy', 'Conversation options')}>
          <nav className="ih70-menu-list">
            <Link to={'/profile/' + profileId} className="ih70-menu-link" onClick={closeMenu}><WorkspaceIcon kind="profile" /><span>{t('Profil i opcje blokowania', 'Profile and blocking options')}</span><WorkspaceIcon kind="next" /></Link>
            <button type="button" className="ih70-menu-link" disabled={!canDispute} onClick={() => { closeMenu(); onDispute(); }}><WorkspaceIcon kind="lock" /><span>{t('Zgłoś problem ze współpracą', 'Report a project issue')}</span></button>
            <button type="button" className="ih70-menu-link" disabled={hiding} onClick={() => { closeMenu(); onHide(); }}><WorkspaceIcon kind="close" /><span>{hiding ? t('Ukrywanie…', 'Hiding…') : t('Ukryj rozmowę z listy', 'Hide conversation from list')}</span></button>
            <Link to="/work" className="ih70-menu-link" onClick={closeMenu}><WorkspaceIcon kind="work" /><span>{t('Moja praca', 'My work')}</span><WorkspaceIcon kind="next" /></Link>
            <Link to="/messages" className="ih70-menu-link" onClick={closeMenu}><WorkspaceIcon kind="message" /><span>{t('Wszystkie rozmowy', 'All conversations')}</span><WorkspaceIcon kind="next" /></Link>
            <Link to="/account" className="ih70-menu-link" onClick={closeMenu}><WorkspaceIcon kind="home" /><span>{t('Moje konto', 'My account')}</span><WorkspaceIcon kind="next" /></Link>
            <Link to="/privacy-center" className="ih70-menu-link" onClick={closeMenu}><WorkspaceIcon kind="lock" /><span>{t('Prywatność i dane', 'Privacy & data')}</span><WorkspaceIcon kind="next" /></Link>
            <button type="button" className="ih70-menu-link ih68-expand-option" onClick={() => { closeMenu(); onFocusMode(!focusMode); }}><WorkspaceIcon kind={focusMode ? 'collapse' : 'expand'} /><span>{focusMode ? t('Przywróć widok', 'Restore view') : t('Powiększ rozmowę', 'Expand conversation')}</span></button>
            <WorkspaceDisplaySettings onNavigate={closeMenu} />
          </nav>
        </WorkspaceSheet>
        {reportDialog}
      </>}
    </main>
  </>;
}
