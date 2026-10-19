/* P68 — separate mailbox and correspondence room. */
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSitePreferences } from './Preferences';
import { WorkspaceAvatar, WorkspaceIcon, WorkspaceLoading, useWorkspaceCopy, useWorkspaceDetails, useWorkspaceListNavigation, workspaceDate } from './Workspace';
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
  const t = useWorkspaceCopy(),
    en = useSitePreferences().language === 'en',
    location = useLocation(),
    navigate = useNavigate(),
    open = useWorkspaceListNavigation(loading);
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
  return <main className="ih68-page ih68-mailbox" id="ih68-content"><header className="ih68-mailbox-heading"><div className="ih68-page-heading"><p className="ih68-overline">{t('Twoje rozmowy', 'Your conversations')}</p><h1>{t('Wiadomości', 'Messages')}</h1><p>{t('Rozmowy o Twoich projektach.', 'Conversations about your projects.')}</p></div><Link to="/freelancers" className="ih68-secondary ih68-new-conversation" aria-label={t('Nowa rozmowa — znajdź wykonawcę', 'New conversation — find a freelancer')}><WorkspaceIcon kind="plus" /><span>{t('Nowa rozmowa', 'New conversation')}</span></Link></header><div className="ih68-mailbox-toolbar"><label className="ih68-search"><WorkspaceIcon kind="search" /><span className="ih68-sr-only">{t('Szukaj rozmowy', 'Search conversations')}</span><input type="search" maxLength={160} placeholder={t('Osoba lub projekt', 'Person or project')} value={search} onChange={e => update('q', e.target.value)} /></label><button type="button" className="ih68-unread-filter" aria-pressed={inboxFilter === 'unread'} onClick={() => update('unread', inboxFilter === 'unread' ? '' : '1')}><span className="ih68-filter-check" aria-hidden="true">{inboxFilter === 'unread' && <WorkspaceIcon kind="check" />}</span>{t('Nieprzeczytane', 'Unread')}{unreadCount > 0 && <span className="ih68-unread-count">{unreadCount}</span>}</button></div><section className="ih68-mailbox-list" aria-label={t('Lista rozmów', 'Conversation list')}>{loading ? <WorkspaceLoading /> : errorMessage ? <p className="ih68-feedback" role="alert">{errorMessage}</p> : !visibleConversations.length ? <div className="ih68-start-empty"><WorkspaceIcon kind="message" /><h2>{conversations.length ? t('Brak pasujących rozmów', 'No matching conversations') : t('Tu zacznie się rozmowa.', 'Your conversations start here.')}</h2><p>{conversations.length ? t('Zmień wyszukiwanie lub wyłącz filtr.', 'Change your search or turn off the filter.') : t('Napisz do wykonawcy albo odpowiedz na zlecenie. Wątki pojawią się w tym miejscu.', 'Contact a freelancer or reply to a job. Your conversations will appear here.')}</p>{conversations.length ? <button type="button" className="ih68-secondary" onClick={() => {
          setSearch('');
          setInboxFilter('all');
          navigate('/messages', {
            replace: true
          });
        }}>{t('Pokaż wszystkie', 'Show all')}</button> : <Link to="/freelancers" className="ih68-primary">{t('Znajdź wykonawcę', 'Find a freelancer')}<WorkspaceIcon kind="arrow" /></Link>}</div> : visibleConversations.map(item => {
        const name = item.otherProfile?.name || t('Użytkownik', 'User'),
          message = item.lastMessage,
          text = String(message?.content || '').trim(),
          preview = message ? (message.sender_id === user?.id ? t('Ty: ', 'You: ') : '') + (text || t('Przesłano materiały', 'Materials shared')) : t('Rozmowa jest otwarta. Ustalcie szczegóły.', 'The conversation is open. Discuss the details.');
        return <Link key={item.id} to={'/chat/' + item.id} onClick={e => open(e, item.id)} className={'ih68-mail-row' + (item.isUnread ? ' is-unread' : '')}><WorkspaceAvatar name={name} url={item.otherProfile?.avatar_url} /><div className="ih68-mail-copy"><div className="ih68-mail-person"><strong>{name}</strong>{item.isUnread && <i className="ih68-dot" aria-label={t('Nieprzeczytana rozmowa', 'Unread conversation')} />}</div><h2>{item.job?.title || t('Zapytanie o współpracę', 'Project inquiry')}</h2><p>{preview}</p></div><div className="ih68-mail-end"><time dateTime={item.sortDate || undefined}>{date(item.sortDate)}</time><WorkspaceIcon kind="arrow" /></div></Link>;
      })}</section>{!loading && conversations.length > 0 && <p className="ih68-list-footnote" aria-live="polite">{t('Widoczne rozmowy: ', 'Conversations shown: ') + visibleConversations.length}</p>}</main>;
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
  const t = useWorkspaceCopy(),
    en = useSitePreferences().language === 'en';
  return <div className="ih68-thread-wrap"><div ref={viewportRef} className="ih68-thread" role="log" aria-label={t('Historia rozmowy', 'Conversation history')} aria-live="polite" aria-relevant="additions text" onScroll={onScroll}>{!messages.length ? <div className="ih68-thread-empty"><WorkspaceIcon kind="message" /><h2>{t('Napisz pierwszą wiadomość.', 'Write your first message.')}</h2><p>{t('Możesz zapytać o zakres, termin albo dostępność.', 'Ask about the scope, deadline or availability.')}</p></div> : <div className="ih68-thread-inner">{messages.map((message, index) => {
          const own = message.sender_id === user?.id,
            day = index === 0 || new Date(messages[index - 1].created_at).toDateString() !== new Date(message.created_at).toDateString();
          return <React.Fragment key={message.id}>{day && <div className="ih68-day"><time dateTime={message.created_at}>{new Date(message.created_at).toLocaleDateString(en ? 'en-GB' : 'pl-PL', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}</time></div>}<article className={'ih68-message' + (own ? ' is-own' : ' is-received')} aria-label={own ? t('Twoja wiadomość', 'Your message') : otherName}><header><strong>{own ? t('Ty', 'You') : otherName}</strong><time dateTime={message.created_at}>{new Date(message.created_at).toLocaleTimeString(en ? 'en-GB' : 'pl-PL', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</time></header><div className="ih68-message-content">{renderContent(message)}</div>{!own && message.moderation_status !== 'hidden' && <details className="ih68-message-options"><summary aria-label={t('Opcje wiadomości', 'Message options')}><WorkspaceIcon kind="more" /></summary><button type="button" onClick={e => {
                  e.currentTarget.closest('details')?.removeAttribute('open');
                  onReport(message.id);
                }}>{t('Zgłoś wiadomość', 'Report message')}</button></details>}</article>{message.id === lastReadOwnMessageId && <p className="ih68-read-receipt"><WorkspaceIcon kind="check" />{t('Wyświetlono', 'Seen')}</p>}</React.Fragment>;
        })}</div>}</div>{showLatest && <button type="button" className="ih68-latest" onClick={onLatest}>{t('Najnowsze wiadomości', 'Latest messages')}<WorkspaceIcon kind="down" /></button>}</div>;
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
  useEffect(() => {
    if (!draft && composerRef.current) {
      composerRef.current.style.setProperty('height', 'auto', 'important');
      composerRef.current.style.overflowY = 'hidden';
    }
  }, [draft, composerRef]);
  return <div className="ih68-composer-area">{errorMessage && <p className="ih68-feedback" role="alert">{errorMessage}</p>}{blocked && <p className="ih68-block-note">{blockedByMe ? t('Zablokowałeś tę osobę. Aby odblokować rozmowę, przejdź do jej profilu.', 'You blocked this person. Open their profile to unblock the conversation.') : t('Ta osoba zablokowała Twój profil. Wysyłanie wiadomości jest wyłączone.', 'This person blocked your profile. Sending messages is disabled.')}{blockedByMe && <Link to={'/profile/' + profileId}>{t('Otwórz profil', 'Open profile')}</Link>}</p>}<form className="ih68-composer" onSubmit={onSubmit}><label className="ih68-sr-only" htmlFor="ih68-message-draft">{t('Treść wiadomości', 'Message text')}</label><textarea id="ih68-message-draft" ref={composerRef} rows={1} value={draft} maxLength={4000} placeholder={t('Napisz wiadomość…', 'Write a message…')} disabled={sending || blocked} onChange={e => setDraft(e.target.value)} onInput={e => {
        const field = e.currentTarget;
        field.style.setProperty('height', 'auto', 'important');
        field.style.setProperty('height', Math.min(field.scrollHeight, 144) + 'px', 'important');
        field.style.overflowY = field.scrollHeight > 144 ? 'auto' : 'hidden';
      }} onKeyDown={e => {
        if (e.isComposing || e.nativeEvent?.isComposing) return;
        if (e.key === 'Enter' && !e.shiftKey && !window.matchMedia?.('(pointer: coarse)').matches) {
          e.preventDefault();
          e.currentTarget.form?.requestSubmit();
        }
      }} /><div className="ih68-compose-tools"><button type="button" className="ih68-attach" onClick={onMaterials} disabled={blocked}><WorkspaceIcon kind="attachment" /><span>{t('Dodaj materiały', 'Add materials')}</span></button><button type="submit" className="ih68-send" disabled={sending || !draft.trim() || blocked} aria-label={sending ? t('Wysyłanie wiadomości', 'Sending message') : t('Wyślij wiadomość', 'Send message')}><span>{sending ? t('Wysyłanie…', 'Sending…') : t('Wyślij', 'Send')}</span><WorkspaceIcon kind="send" /></button></div></form><p className="ih68-compose-hint">{t('Enter wysyła · Shift + Enter dodaje linię', 'Enter to send · Shift + Enter for a new line')}</p></div>;
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
    [projectOpen, setProjectOpen] = useState(false);
  useWorkspaceDetails(menuRef);
  useEffect(() => {
    setProjectOpen(false);
  }, [profileId, jobTitle, view]);
  useLayoutEffect(() => {
    let task = 0;
    const viewport = window.visualViewport,
      element = frameRef.current;
    function measure() {
      task = 0;
      if (!element) return;
      const narrow = window.matchMedia?.('(max-width:700px)').matches,
        inset = focusMode ? narrow ? 0 : 16 : 0,
        top = focusMode ? inset : Math.max(0, element.getBoundingClientRect().top - (viewport?.offsetTop || 0)),
        bottom = focusMode ? inset : narrow ? 0 : 24,
        height = Math.max(160, Math.floor((viewport?.height || window.innerHeight) - top - bottom));
      element.style.setProperty('--ih68-room-height', height + 'px');
      if (focusMode) element.style.setProperty('top', (viewport?.offsetTop || 0) + inset + 'px', 'important');else element.style.removeProperty('top');
      element.classList.toggle('is-keyboard', height < 460);
    }
    const schedule = () => {
        if (!task) task = requestAnimationFrame(measure);
      },
      observer = window.ResizeObserver ? new ResizeObserver(schedule) : null,
      header = document.querySelector('.ih68-header');
    if (header) observer?.observe(header);
    window.addEventListener('resize', schedule);
    viewport?.addEventListener('resize', schedule);
    viewport?.addEventListener('scroll', schedule);
    schedule();
    return () => {
      observer?.disconnect();
      cancelAnimationFrame(task);
      window.removeEventListener('resize', schedule);
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
  return <>{focusMode && createPortal(<div className="ih68-focus-scrim" aria-hidden="true" />, document.body)}<main ref={frameRef} id="ih68-content" role={focusMode ? 'dialog' : undefined} aria-modal={focusMode ? true : undefined} aria-label={t('Rozmowa IdeaHire', 'IdeaHire conversation')} className={'ih68-room' + (focusMode ? ' is-focus' : '') + (planPinned ? ' has-pinned-plan' : '')}>{loading ? <WorkspaceLoading /> : !hasConversation ? <section className="ih68-room-error"><h1>{t('Nie można otworzyć rozmowy', 'Unable to open this conversation')}</h1><p role="alert">{errorMessage}</p><button className="ih68-secondary" type="button" onClick={onBack}><WorkspaceIcon kind="back" />{backLabel}</button></section> : <><header className="ih68-room-header"><button className="ih68-room-back" type="button" onClick={onBack} aria-label={t('Wróć: ', 'Back to: ') + backLabel}><WorkspaceIcon kind="back" /><span>{backLabel}</span></button><Link className="ih68-room-person" to={'/profile/' + profileId}><WorkspaceAvatar name={otherName} url={blocked ? null : avatarUrl} small /><span><h1>{blocked ? t('Zablokowany użytkownik', 'Blocked user') : otherName}</h1><small>{t('Zobacz profil', 'View profile')}</small></span></Link><div className="ih68-room-header-tools">{focusMode && <button type="button" className="ih68-focus-exit ih68-icon-button" aria-label={t('Przywróć zwykły widok', 'Restore normal view')} onClick={() => onFocusMode(false)}><WorkspaceIcon kind="collapse" /></button>}<details ref={menuRef} className="ih68-room-options ih68-popover"><summary aria-label={t('Opcje rozmowy', 'Conversation options')}><WorkspaceIcon kind="more" /></summary><nav><button className="ih68-expand-option" type="button" onClick={() => {
                  closeMenu();
                  onFocusMode(!focusMode);
                }}><WorkspaceIcon kind={focusMode ? 'collapse' : 'expand'} />{focusMode ? t('Przywróć widok', 'Restore view') : t('Powiększ rozmowę', 'Expand conversation')}</button><Link to={'/profile/' + profileId} onClick={closeMenu}><WorkspaceIcon kind="profile" />{t('Profil i opcje blokowania', 'Profile and blocking options')}</Link><button type="button" disabled={!canDispute} onClick={() => {
                  closeMenu();
                  onDispute();
                }}><WorkspaceIcon kind="lock" />{t('Zgłoś problem ze współpracą', 'Report a project issue')}</button><Link to="/privacy-center" onClick={closeMenu}><WorkspaceIcon kind="settings" />{t('Prywatność i dane', 'Privacy & data')}</Link><button type="button" disabled={hiding} className="is-danger" onClick={() => {
                  closeMenu();
                  onHide();
                }}><WorkspaceIcon kind="close" />{hiding ? t('Ukrywanie…', 'Hiding…') : t('Ukryj rozmowę z listy', 'Hide conversation from list')}</button></nav></details></div></header><div className="ih68-room-context"><button className="ih68-project-trigger" type="button" aria-expanded={projectOpen} aria-controls="ih68-project-details" onClick={() => setProjectOpen(v => !v)}><span>{jobTitle || t('Zapytanie o współpracę', 'Project inquiry')}</span><WorkspaceIcon kind="down" /></button><div className="ih68-room-tools">{view === 'conversation' ? <><button type="button" onClick={() => onView('files')}><WorkspaceIcon kind="attachment" /><span>{t('Materiały', 'Materials')}</span>{materialCount > 0 && <b>{materialCount}</b>}</button><button type="button" onClick={() => onView('plan')}><WorkspaceIcon kind="jobs" /><span>{t('Ustalenia', 'Terms')}</span>{accepted && <WorkspaceIcon kind="check" />}</button></> : <button className="ih68-return-conversation" type="button" onClick={() => onView('conversation')}><WorkspaceIcon kind="back" /><span>{t('Wróć do rozmowy', 'Back to conversation')}</span></button>}</div></div>{projectOpen && <section className="ih68-project-details" id="ih68-project-details"><header><div><span className="ih68-overline">{category}</span><h2>{jobTitle}</h2></div><span className="ih68-project-amount"><small>{accepted ? t('Uzgodniona cena', 'Agreed price') : t('Proponowany budżet', 'Proposed budget')}</small><strong>{budget}</strong></span></header>{projectDetails}</section>}{disputePanel}<div className={'ih68-room-body' + (planPinned ? ' is-split' : '')}><section className="ih68-correspondence" hidden={view !== 'conversation'} aria-label={t('Rozmowa', 'Conversation')}>{thread}{composer}</section>{view === 'files' && <section className="ih68-room-page" id="ih68-room-files" tabIndex={-1} aria-labelledby="ih68-materials-title"><header className="ih68-room-page-heading"><div><p className="ih68-overline">{t('Wspólna przestrzeń', 'Shared workspace')}</p><h2 id="ih68-materials-title">{t('Materiały projektu', 'Project materials')}</h2><p>{t('Pliki, linki i przekazana praca w jednym miejscu.', 'Files, links and delivered work in one place.')}</p></div></header>{materials}</section>}{(view === 'plan' || planPinned) && <section className={'ih68-room-page ih68-terms' + (planPinned ? ' is-pinned' : '')} id="ih68-room-plan" tabIndex={-1} aria-labelledby="ih68-terms-title"><header className="ih68-room-page-heading"><div><p className="ih68-overline">{t('Szczegóły współpracy', 'Project details')}</p><h2 id="ih68-terms-title">{t('Ustalenia i rozliczenie', 'Terms and payment')}</h2></div>{planPinned ? <button type="button" className="ih68-text-link" onClick={onClosePlan}><WorkspaceIcon kind="close" />{t('Zamknij', 'Close')}</button> : <button type="button" className="ih68-pin-option ih68-text-link" onClick={onPinPlan}><WorkspaceIcon kind="pin" />{t('Pokaż przy rozmowie', 'Show beside conversation')}</button>}</header>{plan}</section>}</div>{reportDialog}</>}</main></>;
}
