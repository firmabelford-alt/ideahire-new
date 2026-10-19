/* P71 — an open desk, direct actions and visible navigation. */
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ArrowUpRight, ArrowUp, Bell, BriefcaseBusiness, CalendarDays, Check, ChevronDown, ChevronRight, FileText, FolderOpen, Wallet, Home, Image, LayoutGrid, LogOut, Menu, MessageSquare, MoreHorizontal, Palette, Paperclip, Play, Plus, Search, Settings, ShieldCheck, SlidersHorizontal, UserRound, X, Maximize2, Minimize2, Pin } from 'lucide-react';
import { BrandSignature } from './Brand';
import LucynaSymbol from './LucynaSymbol';
import { useSitePreferences } from './Preferences';
import { IdeaHirePromoFilm } from './App';
import { WorkspaceSheet, WorkspaceDisplaySettings } from './WorkspaceFlow';
import './Workspace.css';
import './WorkspaceAccount.css';
import './WorkspaceMessages.css';
import './WorkspaceCatalog.css';
export function useWorkspaceCopy() {
  const en = useSitePreferences().language === 'en';
  return (pl, english) => en ? english : pl;
}
export function WorkspaceIcon({
  kind = 'arrow',
  ...props
}) {
  const Icon = {
    home: Home,
    work: BriefcaseBusiness,
    message: MessageSquare,
    calendar: CalendarDays,
    jobs: FileText,
    services: LayoutGrid,
    people: UserRound,
    profile: UserRound,
    portfolio: Image,
    settings: Settings,
    palette: Palette,
    payouts: Wallet,
    arrow: ArrowRight,
    back: ArrowLeft,
    diagonal: ArrowUpRight,
    send: ArrowUp,
    plus: Plus,
    close: X,
    search: Search,
    down: ChevronDown,
    next: ChevronRight,
    files: FolderOpen,
    bell: Bell,
    lock: ShieldCheck,
    play: Play,
    check: Check,
    more: MoreHorizontal,
    attachment: Paperclip,
    filter: SlidersHorizontal,
    expand: Maximize2,
    collapse: Minimize2,
    pin: Pin,
    menu: Menu,
    logout: LogOut
  }[kind] || ArrowRight;
  return <Icon size={20} strokeWidth={1.65} aria-hidden="true" focusable="false" {...props} />;
}
export function WorkspaceAvatar({
  name = '',
  url,
  small = false
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);
  return <span className={'ih68-avatar' + (small ? ' is-small' : '')} aria-hidden="true">{url && !failed ? <img src={url} alt="" loading="lazy" onError={() => setFailed(true)} /> : Array.from(name.trim() || 'I')[0].toLocaleUpperCase()}</span>;
}
export function workspaceDate(value, en = false) {
  const date = new Date(value);
  return value && !Number.isNaN(date.getTime()) ? date.toLocaleDateString(en ? 'en-GB' : 'pl-PL', {
    day: 'numeric',
    month: 'short'
  }) : '';
}
export function useWorkspaceDetails(ref) {
  useEffect(() => {
    const outside = e => {
      if (!ref.current?.contains(e.target)) ref.current?.removeAttribute('open');
    };
    const key = e => {
      if (e.key === 'Escape' && ref.current?.open) {
        e.preventDefault();
        ref.current.removeAttribute('open');
        ref.current.querySelector('summary')?.focus();
      }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', key);
    };
  }, [ref]);
}
export function useWorkspaceListNavigation(loading = false) {
  const location = useLocation(),
    navigate = useNavigate();
  useEffect(() => {
    const top = location.state?.workspaceRestoreScrollY;
    if (loading || !Number.isFinite(top)) return;
    const frame = requestAnimationFrame(() => window.scrollTo({
      top,
      behavior: 'instant'
    }));
    return () => cancelAnimationFrame(frame);
  }, [loading, location.key, location.state?.workspaceRestoreScrollY]);
  return (e, id) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate('/chat/' + id, {
      state: {
        workspaceReturn: location.pathname + location.search,
        workspaceScrollY: window.scrollY
      }
    });
  };
}
export function WorkspaceNavigation({ name, avatarUrl, onLogout, limited, hasMessages, hasNotifications, hasDisputes, moderationNotice, helpUrl, assistantEnabled, onAssistantOpen }) {
  const t = useWorkspaceCopy();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const view = location.pathname.startsWith('/chat/') ? 'chat' : location.pathname === '/messages' ? 'messages' : location.pathname === '/account' ? 'account' : location.pathname === '/work' ? 'work' : 'catalog';
  useLayoutEffect(() => {
    document.body.classList.add('ih68-workspace');
    document.body.dataset.ih68View = view;
    return () => { document.body.classList.remove('ih68-workspace'); delete document.body.dataset.ih68View; };
  }, [view]);
  useLayoutEffect(() => {
    const main = document.querySelector('#root main');
    if (!main) return;
    const id = main.id, tab = main.getAttribute('tabindex');
    if (!id) main.id = 'ih68-content';
    if (tab == null) main.tabIndex = -1;
    return () => { if (!id) main.removeAttribute('id'); if (tab == null) main.removeAttribute('tabindex'); };
  }, [location.pathname]);
  useEffect(() => setOpen(false), [location.pathname, location.hash, location.search]);
  const primary = limited
    ? [['/account', t('Konto', 'Account'), 'profile'], ['/jobs', t('Zlecenia', 'Jobs'), 'jobs'], ['/services', t('Usługi', 'Services'), 'services']]
    : [['/account', t('Konto', 'Account'), 'home'], ['/work', t('Praca', 'Work'), 'work'], ['/messages', t('Wiadomości', 'Messages'), 'message']];
  const current = to => to === '/messages' ? view === 'chat' || view === 'messages' : location.pathname === to;
  const extras = [['/', t('Strona główna', 'Site home'), 'home'], ['/jobs', t('Przeglądaj zlecenia', 'Browse jobs'), 'jobs'], ['/freelancers', t('Freelancerzy', 'Freelancers'), 'people'], ['/services', t('Usługi', 'Services'), 'services'], ['/calendar', t('Kalendarz', 'Calendar'), 'calendar'], ...(!limited ? [['/notifications', t('Powiadomienia', 'Notifications'), 'bell'], ['/disputes', t('Sprawy i zgłoszenia', 'Disputes & reports'), 'lock']] : []), ['/privacy-center', t('Prywatność i dane', 'Privacy & data'), 'lock']];
  return <>
    <a className="ih68-skip" href="#ih68-content">{t('Przejdź do treści', 'Skip to content')}</a>
    <header className="navbar account-navbar ih68-header ih71-header" data-workspace-release="P71">
      <div className="ih68-header-inner">
        <Link to="/" className="ih68-brand" aria-label={t('IdeaHire — strona główna', 'IdeaHire — site home')}><BrandSignature /></Link>
        <nav className="ih68-top-nav ih71-primary-nav" aria-label={t('Panel konta', 'Account navigation')}>
          {primary.map(([to,label,icon]) => <Link key={to} to={to} className="ih68-top-link" aria-current={current(to) ? 'page' : undefined}><WorkspaceIcon kind={icon} /><span>{label}</span>{to === '/messages' && hasMessages && <i className="ih68-dot" />}</Link>)}
        </nav>
        <div className="ih68-header-actions">
          {!limited && <Link className="ih68-notifications" to="/notifications" aria-label={t(hasNotifications ? 'Nowe powiadomienia' : 'Powiadomienia', hasNotifications ? 'New notifications' : 'Notifications')}><WorkspaceIcon kind="bell" />{hasNotifications && <i className="ih68-dot" />}</Link>}
          <button type="button" className="ih68-menu-trigger" aria-haspopup="dialog" aria-controls="ih70-account-menu" aria-expanded={open} aria-label={t('Pozostałe strony i ustawienia', 'More pages and settings')} onClick={() => setOpen(true)}><span className="ih68-desktop-avatar"><WorkspaceAvatar name={name} url={avatarUrl} small /></span><span className="ih68-phone-menu"><WorkspaceIcon kind="menu" /></span><WorkspaceIcon kind="down" /></button>
        </div>
      </div>
    </header>
    <WorkspaceSheet id="ih70-account-menu" open={open} onClose={() => setOpen(false)} title={t('Menu IdeaHire', 'IdeaHire menu')}>
      <nav className="ih70-menu-list" aria-label={t('Pozostałe strony', 'More pages')}>
        {extras.map(([to,label,icon]) => <Link key={to} to={to} onClick={() => setOpen(false)} className="ih70-menu-link" aria-current={current(to) ? 'page' : undefined}><WorkspaceIcon kind={icon} /><span>{label}</span>{((to === '/notifications' && hasNotifications) || (to === '/disputes' && hasDisputes)) && <i className="ih68-dot" />}<WorkspaceIcon kind="next" /></Link>)}
        {assistantEnabled && <Link to="/lucyna" className="ih70-menu-link" data-no-route-transition="true" onClick={event => { setOpen(false); onAssistantOpen?.(event); }}><LucynaSymbol /><span>Lucyna AI</span><WorkspaceIcon kind="next" /></Link>}
        <a className="ih70-menu-link" href={helpUrl}><WorkspaceIcon kind="message" /><span>{t('Centrum pomocy', 'Help centre')}</span><WorkspaceIcon kind="next" /></a>
        {moderationNotice && <Link to="/account-status" className="ih70-menu-link" onClick={() => setOpen(false)}><WorkspaceIcon kind="lock" /><span>{t('Status konta', 'Account status')}</span><WorkspaceIcon kind="next" /></Link>}
        <WorkspaceDisplaySettings limited={limited} onNavigate={() => setOpen(false)} />
        <button type="button" className="ih70-menu-link ih70-signout" onClick={() => { setOpen(false); onLogout(); }}><WorkspaceIcon kind="logout" /><span>{t('Wyloguj się', 'Sign out')}</span></button>
      </nav>
    </WorkspaceSheet>
  </>;
}
export function WorkspaceSectionNav({ sections, active, onSelect }) {
  const t = useWorkspaceCopy();
  const group = ['profile','expertise','portfolio'].includes(active) ? ['profile','expertise','portfolio'] : ['preferences','templates','payouts'].includes(active) ? ['preferences','templates','payouts'] : [];
  const labels = { profile:t('Dane','Details'), expertise:t('Specjalizacje','Skills'), portfolio:'Portfolio', preferences:t('Ustawienia','Settings'), templates:t('Wygląd','Appearance'), payouts:t('Wypłaty','Payouts') };
  return group.length ? <nav className="ih71-related-nav" aria-label={t('Sekcje konta','Account sections')}>{sections.filter(s => group.includes(s.key)).map(section => <button type="button" key={section.key} aria-current={active === section.key ? 'page' : undefined} onClick={() => onSelect(section)}>{labels[section.key]}</button>)}</nav> : null;
}
export function WorkspaceLoading() {
  const t = useWorkspaceCopy();
  return <p className="ih68-loading" role="status">{t('Ładowanie…', 'Loading…')}</p>;
}
function RecentRows({
  conversations,
  user,
  loading = false,
  preview = true
}) {
  const t = useWorkspaceCopy();
  const en = useSitePreferences().language === 'en';
  const open = useWorkspaceListNavigation(loading);
  return <div className="ih68-work-list">{conversations.map(item => {
      const name = item.otherProfile?.name || t('Użytkownik', 'User');
      const message = item.lastMessage;
      const last = String(message?.content || '').trim();
      return <Link className={'ih68-work-row' + (item.isUnread ? ' is-unread' : '')} key={item.id} to={'/chat/' + item.id} onClick={e => open(e, item.id)}>
      <WorkspaceAvatar name={name} url={item.otherProfile?.avatar_url} />
      <div className="ih68-work-row-copy">
        <div className="ih69-row-person"><span>{name}</span><time dateTime={item.sortDate || undefined}>{workspaceDate(item.sortDate, en)}</time></div>
        <strong>{item.job?.title || t('Zapytanie o współpracę', 'Project inquiry')}</strong>
        {preview && <p>{message ? (message.sender_id === user?.id ? t('Ty: ', 'You: ') : '') + (last || t('Przesłano materiały', 'Materials shared')) : item.client_id === user?.id ? t('Zlecasz ten projekt', 'You are hiring for this project') : t('Realizujesz ten projekt', 'You are providing this project')}</p>}
      </div>
      <div className="ih68-row-end">{item.isUnread && <i className="ih68-dot" aria-label={t('Nowa wiadomość', 'New message')} />}<WorkspaceIcon kind="next" /></div>
    </Link>;
    })}</div>;
}
function IntroFilm() {
  const t = useWorkspaceCopy();
  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  const [origin, setOrigin] = useState(null);
  return <><button ref={ref} className="ih68-film-link" type="button" onClick={() => {
      setOrigin(ref.current?.getBoundingClientRect() || null);
      setOpen(true);
    }}><WorkspaceIcon kind="play" /><span>{t('Jak działa IdeaHire', 'How IdeaHire works')}</span></button>{open && <IdeaHirePromoFilm origin={origin} onClose={() => setOpen(false)} />}</>;
}
export function WorkspaceDashboard({ name, avatarUrl, specialtyCount = 0, portfolioCount = 0, sections, onSelect, inbox }) {
  const t = useWorkspaceCopy();
  const conversations = inbox?.conversations || [];
  const unread = conversations.filter(item => item.isUnread).length;
  const select = key => onSelect(sections.find(section => section.key === key));
  return <div className="ih71-dashboard">
    <header className="ih71-desk-heading"><div><h1 id="ih68-home-title" tabIndex={-1}>{t('Moje konto','My account')}</h1><p>{name || 'IdeaHire'}</p></div>{inbox?.user?.id && <Link to={'/profile/' + inbox.user.id} className="ih71-own-avatar" aria-label={t('Zobacz swój profil','View your profile')}><WorkspaceAvatar name={name} url={avatarUrl} /></Link>}</header>
    <div className="ih71-desk-grid">
      <section className="ih71-desk-work"><div className="ih71-module-heading"><h2>{t('Moja praca','My work')}</h2><Link to="/work">{t('Projekty','Projects')}<WorkspaceIcon kind="next" /></Link></div><WorkspaceWorkActions /><nav className="ih71-discover-links" aria-label={t('Szukaj na platformie','Browse the platform')}><Link to="/jobs"><WorkspaceIcon kind="search" />{t('Zlecenia','Browse jobs')}</Link><Link to="/freelancers">{t('Wykonawcy','Freelancers')}<WorkspaceIcon kind="diagonal" /></Link></nav></section>
      <section className="ih71-profile-module"><div className="ih71-module-heading"><h2>{t('Mój profil','My profile')}</h2>{inbox?.user?.id && <Link to={'/profile/' + inbox.user.id}>{t('Zobacz','View')}<WorkspaceIcon kind="diagonal" /></Link>}</div><div className="ih71-direct-list">
        <button type="button" onClick={() => select('profile')}><WorkspaceIcon kind="profile" /><span>{t('Edytuj profil','Edit profile')}</span><WorkspaceIcon kind="next" /></button>
        <button type="button" onClick={() => select('expertise')}><WorkspaceIcon kind="services" /><span>{t('Specjalizacje','Skills & expertise')}</span>{specialtyCount > 0 && <small>{specialtyCount}</small>}<WorkspaceIcon kind="next" /></button>
        <button type="button" onClick={() => select('portfolio')}><WorkspaceIcon kind="portfolio" /><span>Portfolio</span>{portfolioCount > 0 && <small>{portfolioCount}</small>}<WorkspaceIcon kind="next" /></button>
      </div></section>
      <section className="ih71-desk-messages"><div className="ih71-module-heading"><h2>{t('Ostatnie rozmowy','Recent conversations')}{unread > 0 && <span className="ih71-unread-count" aria-label={t('Nieprzeczytane: ','Unread: ') + unread}>{unread}</span>}</h2><Link to="/messages">{t('Wszystkie','All')}<WorkspaceIcon kind="next" /></Link></div>
        {inbox?.loading ? <WorkspaceLoading /> : inbox?.errorMessage ? <p className="ih68-feedback" role="alert">{inbox.errorMessage}</p> : conversations.length ? <WorkspaceConversationRows conversations={conversations.slice(0,3)} user={inbox?.user} /> : <div className="ih71-quiet-empty"><WorkspaceIcon kind="message" /><p>{t('Tutaj pojawią się Twoje rozmowy.','Your conversations will appear here.')}<Link to="/freelancers">{t('Znajdź wykonawcę','Find a freelancer')}<WorkspaceIcon kind="next" /></Link></p></div>}
      </section>
      <section className="ih71-settings-module"><div className="ih71-module-heading"><h2>{t('Ustawienia konta','Account settings')}</h2></div><div className="ih71-direct-list"><button type="button" onClick={() => select('preferences')}><WorkspaceIcon kind="settings" /><span>{t('Powiadomienia i prywatność','Notifications & privacy')}</span><WorkspaceIcon kind="next" /></button><button type="button" onClick={() => select('templates')}><WorkspaceIcon kind="palette" /><span>{t('Wygląd strony','Site appearance')}</span><WorkspaceIcon kind="next" /></button><button type="button" onClick={() => select('payouts')}><WorkspaceIcon kind="payouts" /><span>{t('Saldo i wypłaty','Balance & payouts')}</span><WorkspaceIcon kind="next" /></button></div></section>
    </div>
    <footer className="ih71-desk-footer"><IntroFilm /></footer>
  </div>;
}
export function WorkspaceWork({ inbox }) {
  const t = useWorkspaceCopy();
  const location = useLocation(), navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const filter = ['client','contractor'].includes(params.get('role')) ? params.get('role') : 'all';
  const search = params.get('q') || '';
  const rows = inbox?.conversations || [];
  const visible = useMemo(() => rows.filter(item => (filter === 'all' || (filter === 'client' ? item.client_id : item.contractor_id) === inbox?.user?.id) && (!search.trim() || [item.job?.title,item.otherProfile?.name,item.lastMessage?.content].filter(Boolean).join(' ').toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))), [rows,filter,search,inbox?.user?.id]);
  function update(key,value) { const next = new URLSearchParams(location.search); if(value && value !== 'all') next.set(key,value); else next.delete(key); navigate({pathname:'/work',search:next.toString() ? '?' + next : ''},{replace:true,state:{}}); }
  const reset = () => navigate('/work',{replace:true});
  return <main className="ih68-page ih71-work-page" id="ih68-content"><header className="ih71-page-heading"><h1>{t('Moja praca','My work')}</h1><Link to="/jobs" className="ih68-text-link">{t('Szukaj zleceń','Find jobs')}<WorkspaceIcon kind="diagonal" /></Link></header><WorkspaceWorkActions />
    <section className="ih71-project-list" aria-labelledby="ih71-project-list-title"><div className="ih71-module-heading"><h2 id="ih71-project-list-title">{t('Twoje współprace','Your projects')}{!inbox?.loading && <small>{visible.length}</small>}</h2></div>
      <label className="ih71-search"><span className="ih68-sr-only">{t('Szukaj projektu lub osoby','Search for a project or person')}</span><WorkspaceIcon kind="search" /><input type="search" maxLength={160} value={search} onChange={event => update('q',event.target.value)} placeholder={t('Szukaj projektu lub osoby','Search projects or people')} /></label>
      <div className="ih71-filter-row" role="group" aria-label={t('Twoja rola w projekcie','Your project role')}>{[['all',t('Wszystkie','All')],['client',t('Zlecam','Hiring')],['contractor',t('Realizuję','Providing')]].map(([value,label]) => <button type="button" key={value} aria-pressed={filter === value} onClick={() => update('role',value)}>{label}</button>)}</div>
      {inbox?.loading ? <WorkspaceLoading /> : inbox?.errorMessage ? <p className="ih68-feedback" role="alert">{inbox.errorMessage}</p> : visible.length ? <RecentRows conversations={visible} user={inbox?.user} loading={inbox?.loading} preview={false} /> : <div className="ih71-quiet-empty"><WorkspaceIcon kind="work" /><p>{rows.length ? t('Brak pasujących projektów.','No matching projects.') : t('Rozmowy o Twoich projektach pojawią się tutaj.','Your project conversations will appear here.')}{rows.length ? <button type="button" onClick={reset}>{t('Wyczyść filtry','Clear filters')}</button> : <Link to="/jobs">{t('Przeglądaj zlecenia','Browse jobs')}<WorkspaceIcon kind="next" /></Link>}</p></div>}
    </section>
  </main>;
}
export function WorkspaceLimitedHome({
  fullAccessLabel,
  ageRestricted,
  settings,
  helpUrl
}) {
  const t = useWorkspaceCopy();
  return <main className="ih68-page ih68-limited-home" id="ih68-content"><header className="ih68-page-heading"><p className="ih68-overline">{t('Konto 16–17 lat', 'Account ages 16–17')}</p><h1>{t('Rozejrzyj się w IdeaHire.', 'Explore IdeaHire.')}</h1><p>{t('Przeglądaj projekty, usługi i profile wykonawców.', 'Browse projects, services and freelancer profiles.')}</p></header>{ageRestricted && <p className="ih68-feedback" role="status">{t('Ta funkcja wymaga pełnego konta. Katalogi są nadal dostępne.', 'This feature requires a full account. You can still browse the catalogues.')}</p>}<nav className="ih68-explore-list" aria-label={t('Przeglądaj platformę', 'Browse the platform')}>{[['/jobs', t('Zlecenia', 'Jobs'), t('Sprawdź projekty w różnych dziedzinach.', 'Explore projects in different fields.')], ['/services', t('Usługi', 'Services'), t('Poznaj oferty i zakres prac.', 'See offers and their scope.')], ['/freelancers', t('Freelancerzy', 'Freelancers'), t('Zobacz profile i portfolio.', 'View profiles and portfolios.')], ['/calendar', t('Kalendarz', 'Calendar'), t('Zaplanuj własne zadania.', 'Plan your own tasks.')]].map(([to, title, copy]) => <Link key={to} to={to}><span><strong>{title}</strong><small>{copy}</small></span><WorkspaceIcon kind="arrow" /></Link>)}</nav><details className="ih68-account-note"><summary>{t('Co zmieni się po 18. urodzinach?', 'What changes when I turn 18?')}<WorkspaceIcon kind="down" /></summary><div><p>{t('Umowy, płatne oferty, płatności i wypłaty pozostają zablokowane do pełnoletności. Zachowasz to samo konto.', 'Agreements, paid listings, payments and payouts remain locked until adulthood. You’ll keep the same account.')}</p><p>{t('Pełne konto: ', 'Full account: ')}<strong>{fullAccessLabel === 'po ukończeniu 18 lat' ? t('po ukończeniu 18 lat', 'after turning 18') : fullAccessLabel}</strong></p></div></details><details className="ih68-account-note"><summary>{t('Wygląd strony', 'Appearance')}<WorkspaceIcon kind="down" /></summary><div>{settings}</div></details><a className="ih68-text-link" href={helpUrl}>{t('Centrum pomocy', 'Help centre')}<WorkspaceIcon kind="arrow" /></a></main>;
}
export function WorkspaceArtwork({
  variant = 'project'
}) {
  return <svg className={'ih69-artwork is-' + variant} viewBox="0 0 240 180" fill="none" aria-hidden="true" focusable="false">
    <path d="M27 133H68M176 47H214" stroke="currentColor" strokeWidth="1.5" opacity=".3" />
    <rect x="57" y="23" width="116" height="135" rx="13" fill="currentColor" fillOpacity=".08" stroke="currentColor" strokeOpacity=".35" strokeWidth="1.5" />
    <path d="M78 48H130M78 60H111" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity=".65" />
    <path d="M78 85H88V95H78V85ZM78 108H88V118H78V108Z" stroke="currentColor" strokeWidth="1.5" />
    <path d="M99 90H146M99 113H135M78 137H120" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".35" />
    <path d="M138 78H200C207 78 212 83 212 90V120C212 127 207 132 200 132H165L149 145V132H138C131 132 126 127 126 120V90C126 83 131 78 138 78Z" fill="currentColor" fillOpacity=".12" stroke="currentColor" strokeWidth="1.5" />
    <path d="M146 98H190M146 110H177" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M24 60L32 68L46 53" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="194" cy="37" r="4" fill="currentColor" opacity=".5" />
  </svg>;
}

export function WorkspaceConversationRows({ conversations, user, loading = false }) {
  const t = useWorkspaceCopy();
  const en = useSitePreferences().language === 'en';
  const open = useWorkspaceListNavigation(loading);
  const date = value => {
    const d = new Date(value);
    return !value || Number.isNaN(d.getTime()) ? '' : d.toDateString() === new Date().toDateString() ? d.toLocaleTimeString(en ? 'en-GB' : 'pl-PL',{hour:'2-digit',minute:'2-digit'}) : workspaceDate(value,en);
  };
  return <div className="ih71-mail-rows">{conversations.map(item => {
    const name = item.otherProfile?.name || t('Użytkownik','User');
    const message = item.lastMessage;
    const preview = message ? (message.sender_id === user?.id ? t('Ty: ','You: ') : '') + (String(message.content || '').trim() || t('Przesłano materiały','Materials shared')) : t('Rozpocznij rozmowę','Start a conversation');
    return <Link key={item.id} to={'/chat/' + item.id} onClick={event => open(event,item.id)} className={'ih71-mail-row' + (item.isUnread ? ' is-unread' : '')}>
      <WorkspaceAvatar name={name} url={item.otherProfile?.avatar_url} />
      <div className="ih71-mail-copy"><div className="ih71-mail-person"><strong>{name}</strong><time dateTime={item.sortDate || undefined}>{date(item.sortDate)}</time></div><p>{preview}</p><span className="ih71-mail-project">{item.job?.title || t('Zapytanie o współpracę','Project inquiry')}</span></div>
      <span className="ih71-mail-end">{item.isUnread ? <i className="ih68-dot" aria-label={t('Nieprzeczytana rozmowa','Unread conversation')} /> : <WorkspaceIcon kind="next" />}</span>
    </Link>;
  })}</div>;
}

function WorkspaceWorkActions() {
  const t = useWorkspaceCopy();
  return <section className="ih71-work-actions" aria-label={t('Zlecenia i usługi','Jobs and services')}>
    <div className="ih71-action-pair"><Link to="/find-talent" className="ih68-primary"><WorkspaceIcon kind="plus" />{t('Zleć pracę','Post a job')}</Link><Link to="/services/new" className="ih68-secondary"><WorkspaceIcon kind="plus" />{t('Dodaj usługę','Add a service')}</Link></div>
    <nav className="ih71-work-links" aria-label={t('Twoje ogłoszenia i terminarz','Your listings and calendar')}><Link to="/account#account-jobs">{t('Moje zlecenia','My listings')}</Link><Link to="/services/mine">{t('Moje usługi','My services')}</Link><Link to="/calendar">{t('Kalendarz','Calendar')}</Link></nav>
  </section>;
}
