/* P69 — a dedicated inbox and project conversation, built for touch. */
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSitePreferences } from './Preferences';
import { WorkspaceAvatar, WorkspaceArtwork, WorkspaceIcon, WorkspaceLoading, useWorkspaceCopy, useWorkspaceDetails, useWorkspaceListNavigation, workspaceDate } from './Workspace';
export function WorkspaceInbox({
  user,
  conversations = [],
  visibleConversations = [],
  loading,
  errorMessage,
  search,
  setSearch,
  inboxFilter,
  setInboxFilter,
  unreadCount
}) {
  const t = useWorkspaceCopy();
  const en = useSitePreferences().language === 'en';
  const location = useLocation(),
    navigate = useNavigate();
  const open = useWorkspaceListNavigation(loading);
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    setSearch(p.get('q') || '');
    setInboxFilter(p.get('unread') === '1' ? 'unread' : 'all');
  }, [location.search, setSearch, setInboxFilter]);
  function update(key, value) {
    const p = new URLSearchParams(location.search);
    if (value) p.set(key, value);else p.delete(key);
    if (key === 'q') setSearch(value);else setInboxFilter(value === '1' ? 'unread' : 'all');
    navigate({
      pathname: '/messages',
      search: p.toString() ? '?' + p : ''
    }, {
      replace: true,
      state: {}
    });
  }
  function date(value) {
    const d = new Date(value);
    return !value || Number.isNaN(d.getTime()) ? '' : d.toDateString() === new Date().toDateString() ? d.toLocaleTimeString(en ? 'en-GB' : 'pl-PL', {
      hour: '2-digit',
      minute: '2-digit'
    }) : workspaceDate(value, en);
  }
  return <main className="ih68-page ih68-mailbox" id="ih68-content">
    <header className="ih68-mailbox-heading"><div className="ih68-page-heading"><p className="ih68-overline">IdeaHire / {t('Kontakt', 'Conversations')}</p><h1>{t('Wiadomości', 'Messages')}</h1><p>{t('Wybierz rozmowę. Wszystko o projekcie znajdziesz w środku.', 'Choose a conversation. All project details are inside.')}</p></div><Link to="/freelancers" className="ih68-primary ih68-new-conversation" aria-label={t('Nowa rozmowa — znajdź wykonawcę', 'New conversation — find a freelancer')}><WorkspaceIcon kind="plus" /><span>{t('Nowa', 'New')}</span></Link></header>
    <div className="ih69-inbox-surface">
      <div className="ih68-mailbox-toolbar"><label className="ih68-search"><WorkspaceIcon kind="search" /><span className="ih68-sr-only">{t('Szukaj rozmowy', 'Search conversations')}</span><input type="search" maxLength={160} placeholder={t('Szukaj osoby lub projektu', 'Search people or projects')} value={search} onChange={e => update('q', e.target.value)} /></label><div className="ih69-mail-filters" role="group" aria-label={t('Filtr rozmów', 'Conversation filter')}><button type="button" aria-pressed={inboxFilter !== 'unread'} onClick={() => update('unread', '')}>{t('Wszystkie', 'All')}</button><button type="button" aria-pressed={inboxFilter === 'unread'} onClick={() => update('unread', inboxFilter === 'unread' ? '' : '1')}>{t('Nieprzeczytane', 'Unread')}{unreadCount > 0 && <span>{unreadCount}</span>}</button></div></div>
      <section className="ih68-mailbox-list" aria-label={t('Lista rozmów', 'Conversation list')}>{loading ? <WorkspaceLoading /> : errorMessage ? <p className="ih68-feedback" role="alert">{errorMessage}</p> : !visibleConversations.length ? <div className="ih68-start-empty"><WorkspaceArtwork variant="empty" /><div><h2>{conversations.length ? t('Brak pasujących rozmów', 'No matching conversations') : t('Tutaj zaczyna się współpraca.', 'This is where collaboration begins.')}</h2><p>{conversations.length ? t('Zmień wyszukiwanie lub wyłącz filtr.', 'Change your search or turn off the filter.') : t('Napisz do wykonawcy albo odpowiedz na zlecenie.', 'Contact a freelancer or reply to a job.')}</p>{conversations.length ? <button type="button" className="ih68-secondary" onClick={() => {
              setSearch('');
              setInboxFilter('all');
              navigate('/messages', {
                replace: true
              });
            }}>{t('Pokaż wszystkie', 'Show all')}</button> : <Link to="/freelancers" className="ih68-secondary">{t('Znajdź wykonawcę', 'Find a freelancer')}<WorkspaceIcon kind="arrow" /></Link>}</div></div> : visibleConversations.map(item => {
          const name = item.otherProfile?.name || t('Użytkownik', 'User');
          const message = item.lastMessage,
            text = String(message?.content || '').trim();
          const preview = message ? (message.sender_id === user?.id ? t('Ty: ', 'You: ') : '') + (text || t('Przesłano materiały', 'Materials shared')) : t('Ustalcie pierwsze szczegóły.', 'Discuss the first details.');
          return <Link key={item.id} to={'/chat/' + item.id} onClick={e => open(e, item.id)} className={'ih68-mail-row' + (item.isUnread ? ' is-unread' : '')}>
          <WorkspaceAvatar name={name} url={item.otherProfile?.avatar_url} />
          <div className="ih68-mail-copy"><div className="ih68-mail-person"><strong>{name}</strong><time dateTime={item.sortDate || undefined}>{date(item.sortDate)}</time></div><h2>{item.job?.title || t('Zapytanie o współpracę', 'Project inquiry')}</h2><p>{preview}</p></div>
          <span className="ih68-mail-end">{item.isUnread ? <i className="ih68-dot" aria-label={t('Nieprzeczytana rozmowa', 'Unread conversation')} /> : <WorkspaceIcon kind="next" />}</span>
        </Link>;
        })}</section>
    </div>
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
    {!messages.length ? <div className="ih68-thread-empty"><WorkspaceArtwork variant="empty" /><h2>{t('Od czego zaczynamy?', 'Where shall we start?')}</h2><p>{t('Zapytaj o zakres, termin albo dostępność.', 'Ask about scope, a deadline or availability.')}</p></div> : <div className="ih68-thread-inner">{messages.map((message, index) => {
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
  const t = useWorkspaceCopy(),
    frameRef = useRef(null),
    menuRef = useRef(null),
    [projectOpen, setProjectOpen] = useState(false),
    projectTriggerRef = useRef(null),
    projectPanelRef = useRef(null);
  const {
    theme,
    setTheme,
    language,
    setLanguage
  } = useSitePreferences();
  useEffect(() => {
    if (!projectOpen) return;
    const outside = event => {
      if (!projectPanelRef.current?.contains(event.target) && !projectTriggerRef.current?.contains(event.target)) setProjectOpen(false);
    };
    const escape = event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        setProjectOpen(false);
        projectTriggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape, true);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape, true);
    };
  }, [projectOpen]);
  useWorkspaceDetails(menuRef);
  useEffect(() => {
    setProjectOpen(false);
  }, [profileId, jobTitle, view]);
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
      const returnFocus = before?.isConnected && before !== document.body && before.getClientRects().length ? before : frame?.querySelector('.ih68-room-options>summary');
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
  const closeMenu = () => menuRef.current?.removeAttribute('open');
  return <>
    {focusMode && createPortal(<div className="ih68-focus-scrim" aria-hidden="true" />, document.body)}
    <main ref={frameRef} id="ih68-content" data-view={view} role={focusMode ? 'dialog' : undefined} aria-modal={focusMode ? true : undefined} aria-label={t('Rozmowa IdeaHire', 'IdeaHire conversation')} className={'ih68-room' + (focusMode ? ' is-focus' : '') + (planPinned ? ' has-pinned-plan' : '')}>
      {loading ? <WorkspaceLoading /> : !hasConversation ? <section className="ih68-room-error"><h1>{t('Nie można otworzyć rozmowy', 'Unable to open this conversation')}</h1><p role="alert">{errorMessage}</p><button className="ih68-secondary" type="button" onClick={onBack}><WorkspaceIcon kind="back" />{backLabel}</button></section> : <>
        <header className="ih68-room-header">
          <button className="ih68-room-back ih68-icon-button" type="button" onClick={() => view === 'conversation' ? onBack() : onView('conversation')} aria-label={view === 'conversation' ? t('Wróć: ', 'Back to: ') + backLabel : t('Wróć do rozmowy', 'Back to conversation')}><WorkspaceIcon kind="back" /></button>
          <Link className="ih69-person-avatar" to={'/profile/' + profileId} aria-label={t('Profil: ', 'Profile: ') + otherName}><WorkspaceAvatar name={otherName} url={blocked ? null : avatarUrl} small /></Link>
          <div className="ih68-room-person"><Link to={'/profile/' + profileId}><h1>{blocked ? t('Zablokowany użytkownik', 'Blocked user') : otherName}</h1></Link><button ref={projectTriggerRef} className="ih68-project-trigger" type="button" aria-expanded={projectOpen} aria-controls="ih68-project-details" onClick={() => setProjectOpen(v => !v)}><span>{jobTitle || t('Zapytanie o współpracę', 'Project inquiry')}</span><WorkspaceIcon kind="down" /></button></div>
          <div className="ih68-room-header-tools">{focusMode && <button type="button" className="ih68-focus-exit ih68-icon-button" aria-label={t('Przywróć zwykły widok', 'Restore normal view')} onClick={() => onFocusMode(false)}><WorkspaceIcon kind="collapse" /></button>}
            <details ref={menuRef} className="ih68-room-options ih68-popover"><summary aria-label={t('Opcje rozmowy', 'Conversation options')}><WorkspaceIcon kind="more" /></summary><nav aria-label={t('Działania w rozmowie', 'Conversation actions')}>
              <Link to="/account" onClick={closeMenu}><WorkspaceIcon kind="home" />{t('Moje konto', 'My account')}</Link>
              <Link to="/messages" onClick={closeMenu}><WorkspaceIcon kind="message" />{t('Wszystkie rozmowy', 'All conversations')}</Link>
              <div className="ih69-menu-separator" />
              <button className="ih68-expand-option" type="button" onClick={() => {
                  closeMenu();
                  onFocusMode(!focusMode);
                }}><WorkspaceIcon kind={focusMode ? 'collapse' : 'expand'} />{focusMode ? t('Przywróć widok', 'Restore view') : t('Powiększ rozmowę', 'Expand conversation')}</button>
              <Link to={'/profile/' + profileId} onClick={closeMenu}><WorkspaceIcon kind="profile" />{t('Profil i opcje blokowania', 'Profile and blocking options')}</Link>
              <button type="button" disabled={!canDispute} onClick={() => {
                  closeMenu();
                  onDispute();
                }}><WorkspaceIcon kind="lock" />{t('Zgłoś problem ze współpracą', 'Report a project issue')}</button>
              <Link to="/privacy-center" onClick={closeMenu}><WorkspaceIcon kind="settings" />{t('Prywatność i dane', 'Privacy & data')}</Link>
              <button type="button" disabled={hiding} className="is-danger" onClick={() => {
                  closeMenu();
                  onHide();
                }}><WorkspaceIcon kind="close" />{hiding ? t('Ukrywanie…', 'Hiding…') : t('Ukryj rozmowę z listy', 'Hide conversation from list')}</button>
              <div className="ih69-menu-separator" />
              <div className="ih69-room-preferences"><button type="button" onClick={() => setTheme(v => v === 'dark' ? 'light' : 'dark')}><WorkspaceIcon kind="palette" />{theme === 'dark' ? t('Włącz tryb jasny', 'Use light mode') : t('Włącz tryb ciemny', 'Use dark mode')}</button><div role="group" aria-label={t('Język', 'Language')}><button type="button" aria-pressed={language === 'pl'} onClick={() => setLanguage('pl')}>PL</button><button type="button" aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>EN</button><Link to="/account#account-templates" onClick={closeMenu}>{t('Motyw strony', 'Site theme')}<WorkspaceIcon kind="diagonal" /></Link></div></div>
            </nav></details>
          </div>
        </header>
        <div className="ih69-room-views" role="tablist" aria-label={t('Widoki projektu', 'Project views')} onKeyDown={event => {
          const tabs = ['conversation', 'files', 'plan'];
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
          event.preventDefault();
          const index = tabs.indexOf(view);
          const next = event.key === 'Home' ? tabs[0] : event.key === 'End' ? tabs[2] : tabs[(index + (event.key === 'ArrowRight' ? 1 : 2)) % 3];
          onView(next);
          requestAnimationFrame(() => document.getElementById('ih69-tab-' + next)?.focus({
            preventScroll: true
          }));
        }}>
          {[['conversation', t('Rozmowa', 'Conversation'), 'message'], ['files', t('Materiały', 'Materials'), 'files'], ['plan', t('Ustalenia', 'Terms'), 'jobs']].map(([value, label, icon]) => <button key={value} id={'ih69-tab-' + value} role="tab" aria-selected={view === value} aria-controls={value === 'conversation' ? 'ih69-conversation-panel' : 'ih68-room-' + value} tabIndex={view === value ? 0 : -1} type="button" onClick={() => onView(value)}><WorkspaceIcon kind={icon} /><span>{label}</span>{value === 'files' && materialCount > 0 && <small>{materialCount}</small>}{value === 'plan' && accepted && <i className="ih68-dot" aria-label={t('Ustalenia zaakceptowane', 'Terms accepted')} />}</button>)}
        </div>
        <section ref={projectPanelRef} hidden={!projectOpen} className="ih68-project-details" id="ih68-project-details" aria-label={t('Szczegóły projektu', 'Project details')}><header><div><p className="ih68-overline">{category}</p><h2>{jobTitle}</h2></div><button className="ih68-icon-button" type="button" aria-label={t('Zamknij szczegóły projektu', 'Close project details')} onClick={() => {
              setProjectOpen(false);
              projectTriggerRef.current?.focus();
            }}><WorkspaceIcon kind="close" /></button></header><div className="ih68-project-amount"><span>{accepted ? t('Uzgodniona cena', 'Agreed price') : t('Proponowany budżet', 'Proposed budget')}</span><strong>{budget}</strong></div>{projectDetails}</section>
        {disputePanel}
        <div className={'ih68-room-body' + (planPinned ? ' is-split' : '')}>
          <section className="ih68-correspondence" id="ih69-conversation-panel" role="tabpanel" aria-labelledby="ih69-tab-conversation" hidden={view !== 'conversation'}>{thread}{composer}</section>
          <section hidden={view !== 'files'} className="ih68-room-page ih69-materials-page" id="ih68-room-files" tabIndex={-1} role="tabpanel" aria-labelledby="ih69-tab-files">{view === 'files' && materials}</section>
          <section hidden={view !== 'plan' && !planPinned} className={'ih68-room-page ih68-terms' + (planPinned ? ' is-pinned' : '')} id="ih68-room-plan" tabIndex={-1} role={planPinned ? 'region' : 'tabpanel'} aria-labelledby="ih69-tab-plan">{(view === 'plan' || planPinned) && <><header className="ih68-room-page-heading"><div><h2>{t('Ustalenia', 'Terms')}</h2><p>{t('Zakres pracy, warunki i rozliczenie.', 'Scope, terms and payment.')}</p></div>{planPinned ? <button type="button" className="ih68-text-link" onClick={onClosePlan}><WorkspaceIcon kind="close" />{t('Zamknij', 'Close')}</button> : <button type="button" className="ih68-pin-option ih68-text-link" onClick={onPinPlan}><WorkspaceIcon kind="pin" />{t('Przy rozmowie', 'Beside conversation')}</button>}</header>{plan}</>}</section>
        </div>
        {reportDialog}
      </>}
    </main>
  </>;
}
