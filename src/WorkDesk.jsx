import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, FileText, FolderOpen, Grid2X2, MessageSquare, Plus, Search, X } from 'lucide-react';
import { conversationMessagePreview } from './ConversationCards';
import './Studio.css';
import './WorkDesk.css';

export default function WorkDesk({ rows, visible, user, filter, search, unreadOnly, sort, total, page, pageCount, pageSize, counts, loading, error, onRole, onSearch, onUnread, onSort, onPage, onReset, onOpen, loader, en = false }) {
  const t = (pl, english) => en ? english : pl;
  const heading = useRef(null), focusPage = useRef(false);
  const filtered = Boolean(search.trim() || filter !== 'all' || unreadOnly || sort !== 'recent');
  const count = value => loading ? '—' : new Intl.NumberFormat(en ? 'en' : 'pl').format(value);
  useEffect(() => {
    if (!focusPage.current) return;
    focusPage.current = false;
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView({ block: 'start', behavior: 'auto' });
  }, [page]);
  function changePage(value) { focusPage.current = true; onPage(value); }
  const shortcuts = [
    ['/account#account-jobs', FileText, t('Moje ogłoszenia', 'My listings'), t('Zlecenia, które publikujesz', 'The jobs you publish')],
    ['/services/mine', Grid2X2, t('Moje usługi', 'My services'), t('Oferta i dostępność', 'Your offer and availability')],
    ['/calendar', CalendarDays, t('Kalendarz', 'Calendar'), t('Terminy i plan dnia', 'Dates and daily plans')],
    ['/messages', MessageSquare, t('Wiadomości', 'Messages'), t('Wszystkie rozmowy', 'All conversations')],
  ];
  return <main className="ih-desk ih-work-hub" id="ih68-content" data-interface-release="work-hub-20261029">
    <header className="wd-heading">
      <div><p className="wd-eyebrow">{t('PANEL PRACY', 'WORKSPACE')}</p><h1>{t('Twoja praca', 'Your workspace')}</h1><p>{t('Współprace, do których chcesz wrócić.', 'The projects you want to come back to.')}</p></div>
      <Link to="/find-talent" className="wd-button is-primary"><Plus size={18} aria-hidden="true" />{t('Zleć pracę', 'Post a job')}</Link>
    </header>
    <nav className="wd-shortcuts" aria-label={t('Narzędzia pracy', 'Workspace tools')}>
      {shortcuts.map(([to, Icon, label, detail]) => <Link key={to} to={to}><Icon size={20} aria-hidden="true" /><span><strong>{label}</strong><small>{detail}</small></span><ArrowUpRight size={16} aria-hidden="true" /></Link>)}
    </nav>
    <div className="wd-layout">
      <section className="wd-register" aria-labelledby="wd-results-title">
        <div className="wd-register-heading"><h2 ref={heading} tabIndex={-1} id="wd-results-title">{t('Współprace', 'Projects')}<span>{count(total)}</span></h2><span className="wd-register-caption">{t('Rozmowy • ustalenia • materiały', 'Conversations • terms • files')}</span></div>
        <div className="wd-toolbar">
          <label className="wd-search"><Search size={19} aria-hidden="true" /><span className="wd-sr">{t('Szukaj współpracy lub osoby', 'Search for a project or person')}</span><input type="search" value={search} onChange={e => onSearch(e.target.value)} maxLength={160} placeholder={t('Projekt, osoba lub wiadomość', 'Project, person or message')} />{search && <button type="button" onClick={() => onSearch('')} aria-label={t('Wyczyść wyszukiwanie', 'Clear search')}><X size={17} aria-hidden="true" /></button>}</label>
          <label className="wd-sort"><span className="wd-sr">{t('Kolejność współprac', 'Project order')}</span><select value={sort} onChange={e => onSort(e.target.value)}><option value="recent">{t('Ostatnia aktywność', 'Latest activity')}</option><option value="oldest">{t('Najstarsza aktywność', 'Oldest activity')}</option><option value="name">{t('Nazwa A–Z', 'Name A–Z')}</option></select><ChevronDown size={15} aria-hidden="true" /></label>
        </div>
        <div className="wd-filterbar">
          <div className="wd-roles" role="group" aria-label={t('Twoja rola we współpracy', 'Your role in the project')}>
            {[["all", t('Wszystkie', 'All'), rows.length], ["client", t('Zlecam', 'Hiring'), counts.hiring], ["contractor", t('Realizuję', 'Providing'), counts.providing]].map(([value, label, number]) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => onRole(value)}>{label}<span>{count(number)}</span></button>)}
          </div>
          <button type="button" className="wd-unread" aria-pressed={unreadOnly} onClick={onUnread}><span aria-hidden="true" className="wd-unread-dot" />{t('Nieprzeczytane', 'Unread')}<span>{count(counts.unread)}</span></button>
        </div>
        {filtered && <div className="wd-active-filters"><span>{t('Lista uwzględnia wybrane filtry.', 'Your filters are applied.')}</span><button type="button" onClick={onReset}>{t('Wyczyść filtry', 'Clear filters')}<X size={14} aria-hidden="true" /></button></div>}
        <div className="wd-results" aria-busy={Boolean(loading)}>
          <p className="wd-sr" role="status">{loading ? t('Wczytywanie współprac.', 'Loading projects.') : error ? '' : `${t('Znalezione współprace', 'Matching projects')}: ${total}. ${t('Strona', 'Page')} ${page} ${t('z', 'of')} ${pageCount}.`}</p>
          {loading ? loader : error ? <div className="wd-notice" role="alert"><strong>{t('Nie udało się wczytać współprac.', 'Projects could not be loaded.')}</strong><p>{error}</p></div> : visible.length ? <>
            <div className="wd-columns" aria-hidden="true"><span>{t('Projekt i rozmowa', 'Project and conversation')}</span><span>{t('Twoja rola', 'Your role')}</span><span>{t('Aktywność', 'Activity')}</span><span /></div>
            <ul className="wd-list" aria-labelledby="wd-results-title">
              {visible.map((item, index) => {
                const name = item.otherProfile?.name || t('Użytkownik', 'User');
                const hiring = item.client_id === user?.id;
                const message = item.lastMessage;
                const preview = conversationMessagePreview(message?.content, en);
                const date = new Date(item.sortDate || item.created_at), validDate = !Number.isNaN(date.getTime());
                const title = item.job?.title || t('Zapytanie o współpracę', 'Project inquiry');
                return <li key={item.id} style={{ '--wd-delay': `${index * 65}ms` }}><Link to={'/chat/' + item.id} onClick={event => onOpen(event, item.id)} className={'wd-project' + (item.isUnread ? ' is-unread' : '')}>
                  <div className="wd-project-main"><span className="wd-avatar" aria-hidden="true">{item.otherProfile?.avatar_url ? <img src={item.otherProfile.avatar_url} alt="" loading="lazy" /> : Array.from(name)[0]?.toLocaleUpperCase()}</span><div className="wd-project-copy"><div className="wd-title-line"><h3 title={title}>{title}</h3>{item.isUnread && <span className="wd-new"><span className="wd-sr">{t('Nieprzeczytana wiadomość', 'Unread message')}</span></span>}</div><strong className="wd-person" title={name}>{name}</strong><p className="wd-preview">{preview ? (message?.sender_id === user?.id ? t('Ty: ', 'You: ') : '') + preview : t('Ustal szczegóły w rozmowie.', 'Discuss the details in the conversation.')}</p></div></div>
                  <span className={'wd-role'+(hiring?' is-client':'')}>{hiring ? t('Zlecam', 'Hiring') : t('Realizuję', 'Providing')}</span>
                  <time dateTime={validDate ? date.toISOString() : undefined} title={validDate ? date.toLocaleString(en ? 'en-GB' : 'pl-PL', { timeZone: 'Europe/Warsaw' }) : undefined}>{validDate ? date.toLocaleDateString(en ? 'en-GB' : 'pl-PL', { day: 'numeric', month: 'short', year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined, timeZone: 'Europe/Warsaw' }) : '—'}</time>
                  <span className="wd-open"><span>{t('Otwórz', 'Open')}</span><ArrowRight size={19} aria-hidden="true" /></span>
                </Link></li>;
              })}
            </ul>
            <nav className="wd-pagination" aria-label={t('Strony współprac', 'Project pages')}>
              <p>{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} {t('z', 'of')} {total}</p>
              {pageCount > 1 && <div><button type="button" disabled={page === 1} onClick={() => changePage(page - 1)} aria-label={t('Poprzednia strona', 'Previous page')}><ChevronLeft size={18} aria-hidden="true" /></button><span>{t('Strona', 'Page')} <strong>{page}</strong> / {pageCount}</span><button type="button" disabled={page === pageCount} onClick={() => changePage(page + 1)} aria-label={t('Następna strona', 'Next page')}><ChevronRight size={18} aria-hidden="true" /></button></div>}
            </nav>
          </> : <div className="wd-empty"><FolderOpen size={32} aria-hidden="true" /><h3>{rows.length ? unreadOnly && !search.trim() && filter === 'all' ? t('Wszystko przeczytane', 'You’re all caught up') : t('Brak pasujących współprac', 'No matching projects') : t('Tutaj zaczyna się współpraca', 'Your next project starts here')}</h3><p>{rows.length ? t('Zmień filtry, żeby wrócić do swoich rozmów.', 'Change the filters to find your conversations.') : t('Odpowiedz na zlecenie albo znajdź wykonawcę. Pierwsza rozmowa pojawi się na tej liście.', 'Reply to a job or find a freelancer. Your first conversation will appear here.')}</p>{rows.length ? <button type="button" className="wd-button" onClick={onReset}>{t('Pokaż wszystkie', 'Show all')}</button> : <Link to="/jobs" className="wd-button">{t('Znajdź zlecenie', 'Find a job')}<ArrowRight size={16} aria-hidden="true" /></Link>}</div>}
        </div>
      </section>
      <aside className="wd-sidebar" aria-label={t('Podsumowanie Twojej pracy', 'Your workspace summary')}>
        <div className="wd-overview"><span className="wd-eyebrow">{t('W SKRÓCIE', 'AT A GLANCE')}</span><h2>{t('Każda rozmowa to następny krok.', 'Every conversation is a next step.')}</h2><dl><div><dt>{t('Zlecasz pracę', 'You are hiring')}</dt><dd>{count(counts.hiring)}</dd></div><div><dt>{t('Realizujesz pracę', 'You are providing')}</dt><dd>{count(counts.providing)}</dd></div></dl></div>
        <div className="wd-next"><MessageSquare size={21} aria-hidden="true" /><h3>{loading ? t('Wczytuję rozmowy…', 'Loading conversations…') : counts.unread > 0 ? t('Ktoś do Ciebie napisał', 'Someone sent you a message') : t('Możesz wrócić do ustaleń', 'Come back to your plans')}</h3><p>{loading ? t('Za chwilę zobaczysz aktualną listę.', 'Your current list will appear shortly.') : counts.unread > 0 ? `${t('Rozmowy z nieprzeczytaną wiadomością', 'Conversations with unread messages')}: ${count(counts.unread)}.` : t('Otwórz współpracę, żeby przejrzeć rozmowę, materiały i uzgodniony plan.', 'Open a project to review the conversation, files and agreed plan.')}</p>{!loading && counts.unread > 0 ? <button type="button" disabled={unreadOnly} onClick={onUnread}>{unreadOnly?t('Widoczne na liście', 'Shown in the list'):t('Pokaż nieprzeczytane', 'Show unread')}<ArrowRight size={16} aria-hidden="true" /></button> : <Link to="/calendar">{t('Otwórz kalendarz', 'Open calendar')}<ArrowRight size={16} aria-hidden="true" /></Link>}</div>
      </aside>
    </div>
  </main>;
}
