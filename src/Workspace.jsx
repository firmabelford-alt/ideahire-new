/* P69 — IdeaHire account: a clear starting point and one navigation. */
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ArrowUpRight, ArrowUp, Bell, BriefcaseBusiness, CalendarDays, Check, ChevronDown, ChevronRight, FileText, FolderOpen, Wallet, Home, Image, LayoutGrid, LogOut, Menu, MessageSquare, MoreHorizontal, Palette, Paperclip, Play, Plus, Search, Settings, ShieldCheck, SlidersHorizontal, UserRound, X, Maximize2, Minimize2, Pin } from 'lucide-react';
import { BrandSignature } from './Brand';
import LucynaSymbol from './LucynaSymbol';
import { useSitePreferences } from './Preferences';
import { IdeaHirePromoFilm } from './App';
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
export function WorkspaceNavigation({
  name,
  avatarUrl,
  onLogout,
  limited,
  hasMessages,
  hasNotifications,
  hasDisputes,
  moderationNotice,
  helpUrl,
  assistantEnabled,
  onAssistantOpen
}) {
  const t = useWorkspaceCopy(),
    location = useLocation(),
    [open, setOpen] = useState(false),
    [more, setMore] = useState(false),
    header = useRef(null),
    trigger = useRef(null),
    menu = useRef(null);
  const view = location.pathname.startsWith('/chat/') ? 'chat' : location.pathname === '/messages' ? 'messages' : location.pathname === '/account' ? 'account' : location.pathname === '/work' ? 'work' : 'catalog';
  useLayoutEffect(() => {
    document.body.classList.add('ih68-workspace');
    document.body.dataset.ih68View = view;
    return () => {
      document.body.classList.remove('ih68-workspace');
      delete document.body.dataset.ih68View;
    };
  }, [view]);
  useLayoutEffect(() => {
    const main = document.querySelector('#root main');
    if (!main) return;
    const id = main.id,
      tab = main.getAttribute('tabindex');
    if (!id) main.id = 'ih68-content';
    if (tab == null) main.tabIndex = -1;
    return () => {
      if (!id) main.removeAttribute('id');
      if (tab == null) main.removeAttribute('tabindex');
    };
  }, [location.pathname]);
  useEffect(() => {
    setOpen(false);
    setMore(false);
  }, [location.pathname, location.hash]);
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => menu.current?.querySelector(window.matchMedia?.('(max-width:850px)').matches ? '.ih68-menu-main a' : '.ih68-menu-account a')?.focus());
    const outside = e => {
      if (!header.current?.contains(e.target)) setOpen(false);
    };
    const key = e => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('focusin', outside);
    document.addEventListener('keydown', key);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('focusin', outside);
      document.removeEventListener('keydown', key);
    };
  }, [open]);
  const primary = limited ? [['/account', t('Start', 'Home'), 'home'], ['/jobs', t('Zlecenia', 'Jobs'), 'jobs'], ['/services', t('Usługi', 'Services'), 'services']] : [['/account', t('Start', 'Home'), 'home'], ['/work', t('Praca', 'Work'), 'work'], ['/messages', t('Wiadomości', 'Messages'), 'message']];
  const current = to => to === '/messages' ? view === 'chat' || view === 'messages' : to === '/account' ? location.pathname === to && !location.hash : location.pathname === to;
  const primaryLink = ([to, label, icon], phone = false) => <Link key={to} to={to} className={phone ? 'ih68-menu-primary' : 'ih68-top-link'} aria-current={current(to) ? 'page' : undefined} onClick={() => setOpen(false)}>{phone && <WorkspaceIcon kind={icon} />}<span>{label}</span>{to === '/messages' && hasMessages && <i className="ih68-dot" aria-label={t('Nieprzeczytane wiadomości', 'Unread messages')} />}</Link>;
  const accounts = limited ? [['/account', t('Moje konto', 'My account'), 'profile']] : [['/account#account-profile-data', t('Mój profil', 'My profile'), 'profile'], ['/account#account-preferences', t('Ustawienia', 'Settings'), 'settings'], ['/account#account-payouts', t('Wypłaty', 'Payouts'), 'payouts']];
  const extras = [['/', t('Strona główna', 'Site home'), 'home'], ['/jobs', t('Przeglądaj zlecenia', 'Browse jobs'), 'jobs'], ['/freelancers', t('Freelancerzy', 'Freelancers'), 'people'], ['/services', t('Usługi', 'Services'), 'services'], ['/calendar', t('Kalendarz', 'Calendar'), 'calendar'], ...(!limited ? [['/notifications', t('Powiadomienia', 'Notifications'), 'bell'], ['/disputes', t('Sprawy i zgłoszenia', 'Disputes & reports'), 'lock']] : []), ['/privacy-center', t('Prywatność i dane', 'Privacy & data'), 'lock']];
  const item = ([to, label, icon]) => <Link key={to} to={to} onClick={() => setOpen(false)}><WorkspaceIcon kind={icon} /><span>{label}</span>{to === '/disputes' && hasDisputes && <i className="ih68-dot" />}</Link>;
  return <><a className="ih68-skip" href="#ih68-content">{t('Przejdź do treści', 'Skip to content')}</a><header ref={header} className="navbar account-navbar ih68-header" data-workspace-release="P69"><div className="ih68-header-inner"><Link to="/" className="ih68-brand" aria-label={t('IdeaHire — strona główna', 'IdeaHire — site home')}><BrandSignature /></Link><nav className="ih68-top-nav" aria-label={t('Panel konta', 'Account navigation')}>{primary.map(i => primaryLink(i))}</nav><div className="ih68-header-actions">{!limited && <Link className="ih68-notifications" to="/notifications" aria-label={t(hasNotifications ? 'Nowe powiadomienia' : 'Powiadomienia', hasNotifications ? 'New notifications' : 'Notifications')}><WorkspaceIcon kind="bell" />{hasNotifications && <i className="ih68-dot" />}</Link>}<button ref={trigger} type="button" className="ih68-menu-trigger" aria-controls="ih68-header-menu" aria-expanded={open} aria-label={t('Otwórz menu konta', 'Open account menu')} onClick={() => {
            setOpen(v => !v);
            setMore(false);
          }}><span className="ih68-desktop-avatar"><WorkspaceAvatar name={name} url={avatarUrl} small /></span><span className="ih68-phone-menu"><WorkspaceIcon kind={open ? 'close' : 'menu'} /></span><span className="ih68-menu-caption">{t('Konto', 'Account')}</span><WorkspaceIcon kind="down" /></button></div></div>{open && <nav ref={menu} id="ih68-header-menu" className="ih68-header-menu" aria-label={t('Menu IdeaHire', 'IdeaHire menu')}><div className="ih68-menu-main">{primary.map(i => primaryLink(i, true))}</div><div className="ih68-menu-account">{accounts.map(item)}</div><button className="ih68-menu-more" type="button" aria-expanded={more} aria-controls="ih68-more-links" onClick={() => setMore(v => !v)}><span>{t('Pozostałe strony', 'More pages')}</span><WorkspaceIcon kind="down" /></button>{more && <div id="ih68-more-links">{extras.map(item)}{assistantEnabled && <Link to="/lucyna" data-no-route-transition="true" onClick={e => {
            setOpen(false);
            onAssistantOpen?.(e);
          }}><LucynaSymbol /><span>Lucyna AI</span></Link>}<a href={helpUrl}><WorkspaceIcon kind="message" /><span>{t('Centrum pomocy', 'Help centre')}</span></a></div>}{moderationNotice && <Link to="/account-status">{t('Sprawdź status konta', 'Check account status')}</Link>}<button type="button" className="ih68-signout" onClick={() => {
          setOpen(false);
          onLogout();
        }}><WorkspaceIcon kind="logout" />{t('Wyloguj się', 'Sign out')}</button></nav>}</header></>;
}
export function WorkspaceSectionNav({
  sections,
  active,
  onSelect
}) {
  const t = useWorkspaceCopy(),
    group = ['profile', 'expertise', 'portfolio'].includes(active) ? ['profile', 'expertise', 'portfolio'] : ['preferences', 'templates'].includes(active) ? ['preferences', 'templates'] : [],
    labels = {
      profile: t('Dane', 'Details'),
      expertise: t('Umiejętności', 'Skills'),
      portfolio: 'Portfolio',
      preferences: t('Konto', 'Account'),
      templates: t('Wygląd', 'Appearance')
    };
  return group.length ? <nav className="ih68-section-switch" data-sections={group.length} aria-label={t('Sekcje ustawień', 'Settings sections')}>{sections.filter(s => group.includes(s.key)).map(s => <button key={s.key} type="button" aria-current={active === s.key ? 'page' : undefined} onClick={() => onSelect(s)}>{labels[s.key]}</button>)}</nav> : null;
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
export function WorkspaceDashboard({
  name,
  avatarUrl,
  about,
  specialtyCount = 0,
  sections,
  onSelect,
  inbox
}) {
  const t = useWorkspaceCopy();
  const first = (name || '').trim().split(/\s+/)[0];
  const rows = inbox?.conversations || [];
  const incomplete = !about?.trim() || !avatarUrl || !specialtyCount;
  const unread = rows.filter(item => item.isUnread).length;
  return <div className="ih68-home">
    <header className="ih69-welcome">
      <div className="ih69-welcome-copy">
        <p className="ih68-overline">{t('Moje konto', 'My account')}</p>
        <h1 id="ih68-home-title" tabIndex={-1}>{first ? t('Cześć, ' + first + '.', 'Hello, ' + first + '.') : t('Witaj w IdeaHire.', 'Welcome to IdeaHire.')}</h1>
        <p>{t('Wróć do swoich projektów.', 'Pick up your projects.')}</p>
        <div className="ih69-welcome-actions"><Link to="/work" className="ih69-welcome-primary">{t('Moja praca', 'My work')}<WorkspaceIcon kind="arrow" /></Link><IntroFilm /></div>
      </div>
      <WorkspaceArtwork />
    </header>
    <section className="ih68-home-activity" aria-labelledby="ih68-recent-title">
      <header className="ih68-section-heading"><div><h2 id="ih68-recent-title">{t('Ostatnie rozmowy', 'Recent conversations')}</h2>{unread > 0 && <span className="ih69-unread-note"><i className="ih68-dot" />{t('Nieprzeczytane: ', 'Unread: ') + unread}</span>}</div><Link to="/messages" className="ih68-text-link">{t('Wszystkie', 'View all')}<WorkspaceIcon kind="arrow" /></Link></header>
      {inbox?.loading ? <WorkspaceLoading /> : inbox?.errorMessage ? <p className="ih68-feedback" role="alert">{inbox.errorMessage}</p> : rows.length ? <RecentRows conversations={rows.slice(0, 3)} user={inbox?.user} /> : <div className="ih68-start-empty"><WorkspaceArtwork variant="empty" /><div><h3>{t('Zacznij od rozmowy.', 'Start with a conversation.')}</h3><p>{t('Znajdź osobę do projektu albo odpowiedz na zlecenie.', 'Find someone for your project or reply to a job.')}</p><div className="ih68-inline-actions"><Link to="/freelancers" className="ih68-primary">{t('Znajdź wykonawcę', 'Find a freelancer')}<WorkspaceIcon kind="arrow" /></Link><Link to="/jobs" className="ih68-text-link">{t('Szukaj zleceń', 'Browse jobs')}</Link></div></div></div>}
    </section>
    <section className="ih69-account-links" aria-labelledby="ih69-account-tools-title">
      <h2 id="ih69-account-tools-title">{t('Twoje konto', 'Your account')}</h2>
      <div>
        <button type="button" onClick={() => onSelect(sections.find(s => s.key === 'profile'))}><span className="ih69-shortcut-icon"><WorkspaceIcon kind="profile" /></span><span><strong>{t('Profil i portfolio', 'Profile & portfolio')}</strong><small>{incomplete ? t('Uzupełnij informacje o sobie', 'Complete your profile') : t('Zadbaj o to, jak widzą Cię inni', 'Choose how others see you')}</small></span><WorkspaceIcon kind="next" /></button>
        <button type="button" onClick={() => onSelect(sections.find(s => s.key === 'preferences'))}><span className="ih69-shortcut-icon"><WorkspaceIcon kind="settings" /></span><span><strong>{t('Ustawienia konta', 'Account settings')}</strong><small>{t('Prywatność, powiadomienia i wygląd', 'Privacy, notifications and appearance')}</small></span><WorkspaceIcon kind="next" /></button>
      </div>
    </section>
  </div>;
}
export function WorkspaceWork({
  inbox
}) {
  const t = useWorkspaceCopy();
  const location = useLocation();
  const navigate = useNavigate();
  const addRef = useRef(null),
    listRef = useRef(null);
  useWorkspaceDetails(addRef);
  useWorkspaceDetails(listRef);
  const params = new URLSearchParams(location.search);
  const filter = ['client', 'contractor'].includes(params.get('role')) ? params.get('role') : 'all';
  const search = params.get('q') || '';
  const [expanded, setExpanded] = useState(Boolean(search || filter !== 'all'));
  const rows = inbox?.conversations || [];
  const visible = useMemo(() => rows.filter(item => (filter === 'all' || (filter === 'client' ? item.client_id : item.contractor_id) === inbox?.user?.id) && (!search.trim() || [item.job?.title, item.otherProfile?.name, item.lastMessage?.content].filter(Boolean).join(' ').toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))), [rows, filter, search, inbox?.user?.id]);
  function update(key, value) {
    const next = new URLSearchParams(location.search);
    if (value && value !== 'all') next.set(key, value);else next.delete(key);
    navigate({
      pathname: '/work',
      search: next.toString() ? '?' + next : ''
    }, {
      replace: true,
      state: {}
    });
  }
  return <main className="ih68-page ih68-work-page" id="ih68-content">
    <header className="ih68-work-heading"><div className="ih68-page-heading"><p className="ih68-overline">IdeaHire / {t('Współpraca', 'Collaboration')}</p><h1>{t('Moja praca', 'My work')}</h1><p>{t('Rozmowy, materiały i ustalenia Twoich projektów.', 'Conversations, materials and terms for your projects.')}</p></div><details ref={addRef} className="ih68-popover ih68-add"><summary className="ih68-primary"><WorkspaceIcon kind="plus" /><span>{t('Dodaj', 'Add')}</span></summary><nav><Link to="/find-talent"><WorkspaceIcon kind="jobs" />{t('Nowe zlecenie', 'New job')}</Link><Link to="/services/new"><WorkspaceIcon kind="services" />{t('Nową usługę', 'New service')}</Link></nav></details></header>
    <div className="ih69-work-entry"><details ref={listRef} className="ih68-popover ih68-listings"><summary><WorkspaceIcon kind="jobs" /><span>{t('Moje ogłoszenia', 'My listings')}</span><WorkspaceIcon kind="down" /></summary><nav><Link to="/account#account-jobs">{t('Zlecenia i zgłoszenia', 'Jobs and applications')}</Link><Link to="/services/mine">{t('Moje usługi', 'My services')}</Link></nav></details><Link to="/calendar" className="ih68-text-link"><WorkspaceIcon kind="calendar" /><span>{t('Kalendarz', 'Calendar')}</span></Link></div>
    <section className="ih69-work-section" aria-labelledby="ih69-work-list-title">
      <div className="ih68-work-controls"><h2 id="ih69-work-list-title">{t('Współprace', 'Project conversations')}{!inbox?.loading && <span className="ih69-count">{visible.length}</span>}</h2><button type="button" className="ih68-filter-toggle" aria-expanded={expanded} aria-controls="ih68-work-filters" onClick={() => setExpanded(v => !v)}><WorkspaceIcon kind="filter" />{t('Filtruj', 'Filter')}{(search || filter !== 'all') && <i className="ih68-dot" />}</button></div>
      {expanded && <div className="ih68-filter-panel" id="ih68-work-filters"><label className="ih68-search"><WorkspaceIcon kind="search" /><span className="ih68-sr-only">{t('Szukaj projektu lub osoby', 'Search projects or people')}</span><input type="search" maxLength={160} value={search} placeholder={t('Projekt lub osoba', 'Project or person')} onChange={e => update('q', e.target.value)} /></label><fieldset className="ih68-role-filter"><legend>{t('Twoja rola', 'Your role')}</legend>{[['all', t('Wszystkie', 'All')], ['client', t('Zlecam', 'Hiring')], ['contractor', t('Realizuję', 'Providing')]].map(([key, label]) => <label key={key}><input type="radio" name="work-role" checked={filter === key} onChange={() => update('role', key)} /><span>{label}</span></label>)}</fieldset></div>}
      <div className="ih68-work-ledger">{inbox?.loading ? <WorkspaceLoading /> : inbox?.errorMessage ? <p className="ih68-feedback" role="alert">{inbox.errorMessage}</p> : visible.length ? <RecentRows conversations={visible} user={inbox?.user} loading={inbox?.loading} /> : <div className="ih68-start-empty"><WorkspaceArtwork variant="empty" /><div><h2>{rows.length ? t('Brak pasujących współprac', 'No matching projects') : t('Miejsce na Twój kolejny projekt.', 'A place for your next project.')}</h2><p>{rows.length ? t('Zmień wyszukiwanie lub wybraną rolę.', 'Change your search or role filter.') : t('Tutaj znajdziesz projekty, o których rozmawiasz z klientami i wykonawcami.', 'Projects you discuss with clients and freelancers will appear here.')}</p>{rows.length ? <button className="ih68-secondary" type="button" onClick={() => navigate('/work', {
              replace: true
            })}>{t('Wyczyść filtry', 'Clear filters')}</button> : <Link to="/jobs" className="ih68-secondary">{t('Przeglądaj zlecenia', 'Browse jobs')}<WorkspaceIcon kind="arrow" /></Link>}</div></div>}</div>
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
