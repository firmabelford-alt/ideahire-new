import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpDown, BriefcaseBusiness, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, FileText, FolderOpen, Grid2X2, MessageSquare, Plus, Search, X } from 'lucide-react';
import { conversationMessagePreview } from './ConversationCards';
import './Studio.css';
import './WorkDesk.css';

export default function WorkDesk({ rows, visible, user, filter, search, unreadOnly, sort, total, page, pageCount, pageSize, counts, loading, error, onRole, onSearch, onUnread, onSort, onPage, onReset, onOpen, loader, en = false }) {
  const t = (pl, english) => en ? english : pl;
  const [wide, setWide] = useState(() => typeof window === 'undefined' || window.matchMedia('(min-width:851px)').matches);
  const resultsHeading = useRef(null);
  const focusPage = useRef(false);
  const filtered = Boolean(search.trim() || filter !== 'all' || unreadOnly || sort !== 'recent');
  const count = value => loading ? '—' : new Intl.NumberFormat(en ? 'en' : 'pl', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
  useEffect(() => {
    const media = window.matchMedia('(min-width:851px)');
    const change = () => setWide(media.matches);
    change();
    media.addEventListener?.('change', change);
    return () => media.removeEventListener?.('change', change);
  }, []);
  useEffect(() => {
    if (!focusPage.current) return;
    focusPage.current = false;
    resultsHeading.current?.focus({ preventScroll: true });
    resultsHeading.current?.scrollIntoView({ block: 'start', behavior: 'auto' });
  }, [page]);
  function changePage(value) {
    focusPage.current = true;
    onPage(value);
  }
  return <main className="ih-desk ih-work-board" id="ih68-content" data-interface-release="work-board-20261028">
    <div className="ih-work-layout">
      <aside className="ih-work-sidebar">
        <details className="ih-work-menu" open={wide}>
          <summary onClick={event => { if (wide) event.preventDefault(); }}><BriefcaseBusiness size={18} aria-hidden="true" /><span>{t('Menu pracy', 'Workspace menu')}</span><ChevronDown size={16} aria-hidden="true" /></summary>
          <div className="ih-work-menu-body">
            <Link to="/find-talent" className="ih-work-button is-primary ih-work-mobile-cta"><Plus size={18} aria-hidden="true" />{t('Zleć pracę', 'Post a job')}</Link>
            <nav aria-label={t('Nawigacja pracy', 'Workspace navigation')}>
              <Link to="/work" aria-current="page"><FolderOpen size={18} aria-hidden="true" /><span>{t('Współprace', 'Projects')}</span><span className="ih-work-menu-count">{count(rows.length)}</span></Link>
              <Link to="/account#account-jobs"><FileText size={18} aria-hidden="true" /><span>{t('Moje zlecenia', 'My listings')}</span></Link>
              <Link to="/services/mine"><Grid2X2 size={18} aria-hidden="true" /><span>{t('Moje usługi', 'My services')}</span></Link>
              <Link to="/calendar"><CalendarDays size={18} aria-hidden="true" /><span>{t('Kalendarz', 'Calendar')}</span></Link>
              <Link to="/messages"><MessageSquare size={18} aria-hidden="true" /><span>{t('Wiadomości', 'Messages')}</span></Link>
            </nav>
            <div className="ih-work-explore"><span>{t('Rozwijaj swoją pracę', 'Keep moving forward')}</span><Link to="/jobs">{t('Znajdź zlecenie', 'Find a job')}<ArrowRight size={16} aria-hidden="true" /></Link><Link to="/services/new">{t('Dodaj usługę', 'Add a service')}<Plus size={16} aria-hidden="true" /></Link></div>
          </div>
        </details>
      </aside>
      <section className="ih-work-main" aria-labelledby="ih-work-title">
        <header className="ih-work-heading">
          <div><p className="ih-work-eyebrow">{t('Panel pracy', 'Workspace')}</p><h1 id="ih-work-title">{t('Współprace', 'Projects')}</h1><p>{t('Rozmowy, ustalenia i materiały w jednym miejscu.', 'Conversations, terms and materials in one place.')}</p></div>
          <div className="ih-work-heading-actions"><Link to="/calendar" className="ih-work-button is-icon" aria-label={t('Otwórz kalendarz', 'Open calendar')} title={t('Kalendarz', 'Calendar')}><CalendarDays size={19} aria-hidden="true" /></Link><Link to="/find-talent" className="ih-work-button is-primary"><Plus size={18} aria-hidden="true" />{t('Zleć pracę', 'Post a job')}</Link></div>
        </header>
        <div className="ih-work-controls">
          <label className="ih-work-search"><Search size={19} aria-hidden="true" /><span className="ih-work-sr">{t('Szukaj projektu lub osoby', 'Search for a project or person')}</span><input type="search" value={search} onChange={e => onSearch(e.target.value)} maxLength={160} placeholder={t('Szukaj projektu lub osoby…', 'Search for a project or person…')} />{search && <button type="button" onClick={() => onSearch('')} aria-label={t('Wyczyść wyszukiwanie', 'Clear search')}><X size={17} aria-hidden="true" /></button>}</label>
          <div className="ih-work-filter-row">
            <div className="ih-work-roles" role="group" aria-label={t('Filtruj według swojej roli', 'Filter by your role')}>
              {[["all", t('Wszystkie', 'All'), rows.length], ["client", t('Zlecam', 'Hiring'), counts.hiring], ["contractor", t('Realizuję', 'Providing'), counts.providing]].map(([value, label, number]) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => onRole(value)}>{label}<span>{count(number)}</span></button>)}
            </div>
          </div>
        </div>
        <div className="ih-work-results-bar">
          <h2 ref={resultsHeading} tabIndex={-1} id="ih-work-results-title">{t('Lista współprac', 'Project list')}<span>{count(total)}</span></h2>
          <button type="button" className="ih-work-unread-filter" aria-pressed={unreadOnly} onClick={onUnread}><MessageSquare size={16} aria-hidden="true" />{t('Nieprzeczytane', 'Unread')}<span>{count(counts.unread)}</span></button>
          <label className="ih-work-sort"><ArrowUpDown size={15} aria-hidden="true" /><span className="ih-work-sr">{t('Sortuj współprace według ostatniej aktywności lub nazwy', 'Sort projects by latest activity or name')}</span><select value={sort} onChange={event => onSort(event.target.value)}><option value="recent">{t('Najnowsze', 'Latest first')}</option><option value="oldest">{t('Najstarsze', 'Oldest first')}</option><option value="name">{t('Nazwa A–Z', 'Name A–Z')}</option></select><ChevronDown size={14} aria-hidden="true" /></label>
          {filtered && <button type="button" className="ih-work-clear" onClick={onReset}><X size={14} aria-hidden="true" />{t('Wyczyść filtry', 'Clear filters')}</button>}
        </div>
        <div className="ih-work-results" aria-busy={Boolean(loading)}>
          <p className="ih-work-sr" role="status">{loading ? t('Wczytywanie współprac.', 'Loading projects.') : error ? '' : `${t('Znalezione współprace', 'Matching projects')}: ${total}. ${t('Strona', 'Page')} ${page} ${t('z', 'of')} ${pageCount}.`}</p>
          {loading ? loader : error ? <div className="ih-work-notice" role="alert"><strong>{t('Nie udało się wczytać współprac.', 'Projects could not be loaded.')}</strong><p>{error}</p></div> : visible.length ? <>
            <ul className="ih-work-projects" aria-labelledby="ih-work-results-title">
              {visible.map((item, index) => {
                const name = item.otherProfile?.name || t('Użytkownik', 'User');
                const hiring = item.client_id === user?.id;
                const message = item.lastMessage;
                const preview = conversationMessagePreview(message?.content, en);
                const date = new Date(item.sortDate || item.created_at);
                const validDate = !Number.isNaN(date.getTime());
                const title = item.job?.title || t('Zapytanie o współpracę', 'Project inquiry');
                return <li key={item.id} className="ih-work-project-item" style={{ '--work-item-delay': `${index * 35}ms` }}><Link to={'/chat/' + item.id} onClick={event => onOpen(event, item.id)} className={'ih-work-card' + (item.isUnread ? ' is-unread' : '')}>
                  <div className="ih-work-card-top"><span className="ih-work-role">{hiring ? <BriefcaseBusiness size={14} aria-hidden="true" /> : <FolderOpen size={14} aria-hidden="true" />}{hiring ? t('Zlecam', 'Hiring') : t('Realizuję', 'Providing')}</span>{item.isUnread && <span className="ih-work-new"><i aria-hidden="true" />{t('Nieprzeczytane', 'Unread')}</span>}</div>
                  <h3 title={title}>{title}</h3>
                  <div className="ih-work-person"><span className="ih-work-avatar" aria-hidden="true">{item.otherProfile?.avatar_url ? <img src={item.otherProfile.avatar_url} alt="" loading="lazy" /> : Array.from(name)[0]?.toLocaleUpperCase()}</span><div><strong title={name}>{name}</strong><p className="ih-work-preview">{preview ? (message?.sender_id === user?.id ? t('Ty: ', 'You: ') : '') + preview : t('Ustal szczegóły w rozmowie.', 'Discuss the details in the conversation.')}</p></div></div>
                  <div className="ih-work-card-bottom"><time dateTime={validDate ? date.toISOString() : undefined} title={validDate ? date.toLocaleString(en ? 'en-GB' : 'pl-PL', { timeZone: 'Europe/Warsaw' }) : undefined}>{validDate ? date.toLocaleDateString(en ? 'en-GB' : 'pl-PL', { day: 'numeric', month: 'short', year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined, timeZone: 'Europe/Warsaw' }) : '—'}</time><span>{t('Otwórz projekt', 'Open project')}<ArrowRight size={17} aria-hidden="true" /></span></div>
                </Link></li>;
              })}
            </ul>
            {pageCount > 1 && <nav className="ih-work-pagination" aria-label={t('Strony współprac', 'Project pages')}>
              <p>{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} {t('z', 'of')} {total}</p>
              <div><button type="button" className="ih-work-button" disabled={page === 1} onClick={() => changePage(page - 1)} aria-label={t('Poprzednia strona', 'Previous page')}><ChevronLeft size={18} aria-hidden="true" /></button><span>{t('Strona', 'Page')} <strong>{page}</strong> / {pageCount}</span><button type="button" className="ih-work-button" disabled={page === pageCount} onClick={() => changePage(page + 1)} aria-label={t('Następna strona', 'Next page')}><ChevronRight size={18} aria-hidden="true" /></button></div>
            </nav>}
          </> : <div className="ih-work-empty"><span className="ih-work-empty-icon">{unreadOnly ? <MessageSquare size={28} aria-hidden="true" /> : <FolderOpen size={28} aria-hidden="true" />}</span><h3>{rows.length ? unreadOnly && !search.trim() && filter === 'all' ? t('Wszystko przeczytane', 'You’re all caught up') : t('Brak pasujących współprac', 'No matching projects') : t('Zacznij pierwszą współpracę', 'Start your first project')}</h3><p>{rows.length ? t('Możesz wyczyścić filtry i wrócić do pełnej listy.', 'Clear the filters to return to the full list.') : t('Znajdź wykonawcę lub odpowiedz na zlecenie. Rozmowy i ustalenia znajdziesz tutaj.', 'Find a freelancer or reply to a job. Your conversations and terms will be here.')}</p>{rows.length ? <button type="button" className="ih-work-button" onClick={onReset}>{t('Pokaż wszystkie współprace', 'Show all projects')}</button> : <div className="ih-work-empty-actions"><Link to="/find-talent" className="ih-work-button is-primary">{t('Znajdź wykonawcę', 'Find a freelancer')}<ArrowRight size={16} aria-hidden="true" /></Link><Link to="/jobs" className="ih-work-button">{t('Znajdź zlecenie', 'Find a job')}</Link></div>}</div>}
        </div>
      </section>
    </div>
  </main>;
}
