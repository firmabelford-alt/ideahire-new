import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BriefcaseBusiness, CalendarDays, ChevronDown, FileText, FolderOpen, Grid2X2, MessageSquare, Plus, Search, X } from 'lucide-react';
import { conversationMessagePreview } from './ConversationCards';
import './Studio.css';

export default function WorkDesk({ rows, visible, user, filter, search, counts, loading, error, onRole, onSearch, onReset, onOpen, loader, en = false }) {
  const t = (pl, english) => en ? english : pl;
  const [wide, setWide] = useState(() => typeof window === 'undefined' || window.matchMedia('(min-width:851px)').matches);
  useEffect(() => {
    const media = window.matchMedia('(min-width:851px)');
    const change = () => setWide(media.matches);
    change();
    media.addEventListener?.('change', change);
    return () => media.removeEventListener?.('change', change);
  }, []);
  return <main className="ih-desk" id="ih68-content" data-interface-release="studio-20261027">
    <div className="ih-desk-layout">
      <aside className="ih-desk-sidebar">
        <details className="ih-desk-navigation" open={wide}>
          <summary onClick={event => { if (wide) event.preventDefault(); }}><BriefcaseBusiness size={18} /><span>{t('Panel pracy', 'Workspace')}</span><ChevronDown size={16} /></summary>
          <div className="ih-desk-navigation-body">
            <Link to="/find-talent" className="ih-studio-button is-primary"><Plus size={18} />{t('Zleć pracę', 'Post a job')}</Link>
            <nav aria-label={t('Nawigacja pracy', 'Workspace navigation')}>
              <Link to="/work" aria-current="page"><FolderOpen size={19} /><span>{t('Współprace', 'Projects')}</span><span>{loading ? '—' : rows.length}</span></Link>
              <Link to="/account#account-jobs"><FileText size={19} /><span>{t('Moje zlecenia', 'My listings')}</span></Link>
              <Link to="/services/mine"><Grid2X2 size={19} /><span>{t('Moje usługi', 'My services')}</span></Link>
              <Link to="/calendar"><CalendarDays size={19} /><span>{t('Kalendarz', 'Calendar')}</span></Link>
              <Link to="/messages"><MessageSquare size={19} /><span>{t('Wiadomości', 'Messages')}</span>{counts.unread > 0 && <span className="ih-desk-unread">{counts.unread}</span>}</Link>
            </nav>
            <div className="ih-desk-explore"><span>{t('Kolejny krok', 'Next step')}</span><Link to="/jobs">{t('Znajdź zlecenie', 'Find a job')}<ArrowRight size={16} /></Link><Link to="/services/new">{t('Dodaj usługę', 'Add a service')}<Plus size={16} /></Link></div>
          </div>
        </details>
      </aside>
      <section className="ih-desk-main" aria-labelledby="ih-desk-title">
        <header className="ih-desk-heading"><div><p className="ih-studio-kicker">{t('Twoja praca', 'Your work')}</p><h1 id="ih-desk-title">{t('Współprace', 'Projects')}</h1><p>{t('Od pierwszej rozmowy do gotowego projektu.', 'From the first conversation to the finished project.')}</p></div><Link to="/calendar" className="ih-studio-icon-button" aria-label={t('Otwórz kalendarz', 'Open calendar')}><CalendarDays size={21} /></Link></header>
        <div className="ih-desk-toolbar">
          <div className="ih-desk-roles" role="group" aria-label={t('Filtruj według swojej roli', 'Filter by your role')}>
            {[["all", t('Wszystkie', 'All'), rows.length], ["client", t('Zlecam', 'Hiring'), counts.hiring], ["contractor", t('Realizuję', 'Providing'), counts.providing]].map(([value, label, count]) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => onRole(value)}>{label}<span>{loading ? '—' : count}</span></button>)}
          </div>
          <label className="ih-desk-search"><Search size={18} /><span className="ih-studio-sr">{t('Szukaj projektu lub osoby', 'Search for a project or person')}</span><input type="search" value={search} onChange={e => onSearch(e.target.value)} maxLength={160} placeholder={t('Projekt lub osoba', 'Project or person')} />{search && <button type="button" onClick={() => onSearch('')} aria-label={t('Wyczyść wyszukiwanie', 'Clear search')}><X size={17} /></button>}</label>
        </div>
        {loading ? loader : error ? <p className="ih-studio-notice" role="alert">{error}</p> : visible.length ? <div className="ih-desk-projects">
          {(search || filter !== 'all') && <p className="ih-desk-results" role="status">{t('Znalezione współprace', 'Matching projects')}: {visible.length}</p>}
          {visible.map(item => { const name = item.otherProfile?.name || t('Użytkownik', 'User'); const hiring = item.client_id === user?.id; const message = item.lastMessage; const preview = conversationMessagePreview(message?.content, en); const date = new Date(item.sortDate); return <Link key={item.id} to={'/chat/' + item.id} onClick={event => onOpen(event, item.id)} className={'ih-desk-project' + (item.isUnread ? ' is-unread' : '')}>
            <div className="ih-desk-project-heading"><span className="ih-desk-project-role">{hiring ? t('Zlecam', 'Hiring') : t('Realizuję', 'Providing')}</span>{item.isUnread && <span className="ih-desk-project-new"><i />{t('Nowa wiadomość', 'New message')}</span>}</div>
            <h2>{item.job?.title || t('Zapytanie o współpracę', 'Project inquiry')}</h2>
            <div className="ih-desk-person"><span className="ih-desk-avatar" aria-hidden="true">{item.otherProfile?.avatar_url ? <img src={item.otherProfile.avatar_url} alt="" loading="lazy" /> : Array.from(name)[0]}</span><strong>{name}</strong><p>{preview ? (message?.sender_id === user?.id ? t('Ty: ', 'You: ') : '') + preview : t('Otwórz rozmowę i ustal kolejny krok.', 'Open the conversation and agree on the next step.')}</p></div>
            <footer><time dateTime={item.sortDate || undefined}>{item.sortDate && !Number.isNaN(date.getTime()) ? date.toLocaleDateString(en ? 'en-GB' : 'pl-PL', { day: 'numeric', month: 'short' }) : ''}</time><span>{t('Otwórz projekt', 'Open project')}<ArrowRight size={17} /></span></footer>
          </Link>; })}
        </div> : <div className="ih-desk-empty"><FolderOpen size={35} /><h2>{rows.length ? t('Brak pasujących projektów', 'No matching projects') : t('Tu zaczyna się współpraca', 'This is where work begins')}</h2><p>{rows.length ? t('Zmień wyszukiwanie lub wybierz inną rolę.', 'Change the search or choose another role.') : t('Napisz do wykonawcy albo odpowiedz na zlecenie. Tutaj wrócisz do rozmowy, ustaleń i materiałów.', 'Contact a freelancer or reply to a job. Return here for conversations, terms and materials.')}</p>{rows.length ? <button type="button" className="ih-studio-button" onClick={onReset}>{t('Wyczyść filtry', 'Clear filters')}</button> : <Link to="/jobs" className="ih-studio-button is-primary">{t('Znajdź zlecenie', 'Find a job')}<ArrowRight size={17} /></Link>}</div>}
      </section>
    </div>
  </main>;
}
