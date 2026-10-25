/* P79 — account, workspace and navigation with separate phone and laptop layouts. */
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ArrowUp, Bell, BriefcaseBusiness, CalendarDays, Check, ChevronDown, FileText, FolderOpen, Wallet, Home, Image, LayoutGrid, LogOut, Menu, MessageSquare, MoreHorizontal, Palette, Paperclip, Play, Plus, Search, Settings, ShieldCheck, SlidersHorizontal, UserRound, X, Maximize2, Minimize2, Pin } from 'lucide-react';
import { BrandSignature } from './Brand';
import LucynaSymbol from './LucynaSymbol';
import { useSitePreferences } from './Preferences';
import { IdeaHirePromoFilm } from './App';
import { WorkspaceSheet, WorkspaceDisplaySettings } from './WorkspaceFlow';
import { SubpageNavigation, SubpageCount, SubpageLoading } from './Subpages';
import { MarketSelect, helpCenterHref } from './MarketUI';
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
    diagonal: ArrowRight,
    send: ArrowUp,
    plus: Plus,
    close: X,
    search: Search,
    down: ChevronDown,
    next: ArrowRight,
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
  }[kind];
  if (!Icon) return null;
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
  const current = to => {
    if (to === '/messages') return view === 'chat' || view === 'messages';
    if (to === '/work') return ['/work', '/jobs', '/freelancers', '/find-talent', '/calendar'].includes(location.pathname) || location.pathname.startsWith('/services') || location.pathname.startsWith('/edit-job/');
    if (to === '/services') return location.pathname.startsWith('/services');
    return location.pathname === to;
  };
  const extras = [['/', t('Strona główna', 'Site home'), 'home'], ['/jobs', t('Przeglądaj zlecenia', 'Browse jobs'), 'jobs'], ['/freelancers', t('Freelancerzy', 'Freelancers'), 'people'], ['/services', t('Usługi', 'Services'), 'services'], ['/calendar', t('Kalendarz', 'Calendar'), 'calendar'], ...(!limited ? [['/notifications', t('Powiadomienia', 'Notifications'), 'bell'], ['/disputes', t('Sprawy i zgłoszenia', 'Disputes & reports'), 'lock']] : []), ['/privacy-center', t('Prywatność i dane', 'Privacy & data'), 'lock']];
  return <>
    <a className="ih68-skip" href="#ih68-content">{t('Przejdź do treści', 'Skip to content')}</a>
    <header className="navbar account-navbar ih68-header ih72-header" data-workspace-release="P79">
      <div className="ih68-header-inner">
        <Link to="/" className="ih68-brand" aria-label={t('IdeaHire — strona główna', 'IdeaHire — site home')}><BrandSignature /></Link>
        <nav className="ih68-top-nav" aria-label={t('Panel konta', 'Account navigation')}>
          {primary.map(([to,label,icon]) => <Link key={to} to={to} className="ih68-top-link" aria-current={current(to) ? 'page' : undefined}><WorkspaceIcon kind={icon} /><span>{label}</span>{to === '/messages' && hasMessages && <i className="ih68-dot" />}</Link>)}
        </nav>
        <div className="ih68-header-actions">
          {!limited && <Link className="ih68-notifications" to="/notifications" aria-label={t(hasNotifications ? 'Nowe powiadomienia' : 'Powiadomienia', hasNotifications ? 'New notifications' : 'Notifications')}><WorkspaceIcon kind="bell" />{hasNotifications && <i className="ih68-dot" />}</Link>}
          {assistantEnabled && <Link className="ih-top-assistant" to="/lucyna" data-no-route-transition="true" aria-label={t('Otwórz Lucynę AI', 'Open Lucyna AI')} onClick={onAssistantOpen}><strong>AI</strong><LucynaSymbol /></Link>}
          <button type="button" className="ih68-menu-trigger" aria-haspopup="dialog" aria-controls="ih70-account-menu" aria-expanded={open} aria-label={t('Pozostałe strony i ustawienia', 'More pages and settings')} onClick={() => setOpen(true)}><span className="ih68-desktop-avatar"><WorkspaceAvatar name={name} url={avatarUrl} small /></span><span className="ih68-phone-menu"><WorkspaceIcon kind="menu" /></span><WorkspaceIcon kind="down" /></button>
        </div>
      </div>
    </header>
    <SubpageNavigation />
    <WorkspaceSheet id="ih70-account-menu" open={open} onClose={() => setOpen(false)} title={t('Menu IdeaHire', 'IdeaHire menu')}>
      <nav className="ih70-menu-list" aria-label={t('Pozostałe strony', 'More pages')}>
        {extras.map(([to,label,icon]) => <Link key={to} to={to} onClick={() => setOpen(false)} className="ih70-menu-link" aria-current={current(to) ? 'page' : undefined}><WorkspaceIcon kind={icon} /><span>{label}</span>{((to === '/notifications' && hasNotifications) || (to === '/disputes' && hasDisputes)) && <i className="ih68-dot" />}</Link>)}
        {assistantEnabled && <Link to="/lucyna" className="ih70-menu-link" data-no-route-transition="true" onClick={event => { setOpen(false); onAssistantOpen?.(event); }}><LucynaSymbol /><span>Lucyna AI</span></Link>}
        <a className="ih70-menu-link" href={helpUrl}><WorkspaceIcon kind="message" /><span>{t('Centrum pomocy', 'Help centre')}</span></a>
        {moderationNotice && <Link to="/account-status" className="ih70-menu-link" onClick={() => setOpen(false)}><WorkspaceIcon kind="lock" /><span>{t('Status konta', 'Account status')}</span></Link>}
        <WorkspaceDisplaySettings limited={limited} onNavigate={() => setOpen(false)} />
        <button type="button" className="ih70-menu-link ih70-signout" onClick={() => { setOpen(false); onLogout(); }}><WorkspaceIcon kind="logout" /><span>{t('Wyloguj się', 'Sign out')}</span></button>
      </nav>
    </WorkspaceSheet>
  </>;
}
export function WorkspaceSectionNav({ sections, active, onSelect }) {
  const t = useWorkspaceCopy();
  const labels = {
    profile: t('Dane profilu', 'Profile details'),
    expertise: t('Umiejętności', 'Skills'),
    portfolio: 'Portfolio',
    jobs: t('Moje zlecenia', 'My listings'),
    preferences: t('Ustawienia', 'Settings'),
    payouts: t('Wypłaty', 'Payouts'),
    templates: t('Wygląd', 'Appearance'),
  };
  const icons = { profile: 'profile', expertise: 'settings', portfolio: 'portfolio', jobs: 'jobs', preferences: 'settings', payouts: 'payouts', templates: 'palette' };
  return <aside className="ih72-section-navigation ih75-account-navigation">
    <Link to="/account" className="ih75-account-return">{t('Widok konta', 'Account overview')}</Link>
    <p className="ih74-section-nav-title">{t('Twoje konto', 'Your account')}</p>
    <nav className="ih72-section-links" aria-label={t('Sekcje konta', 'Account sections')}>
      {sections.map(section => <button type="button" key={section.key}
        aria-current={active === section.key ? 'page' : undefined}
        onClick={() => onSelect(section)}><WorkspaceIcon kind={icons[section.key] || 'settings'} /><span>{labels[section.key] || section.label}</span></button>)}
    </nav>
    <div className="ih72-section-select">
      <MarketSelect id="ih-account-section" label={t('Sekcja konta', 'Account section')}
        value={active || sections[0]?.key || ''}
        options={sections.map(section => ({ value: section.key, label: labels[section.key] || section.label }))}
        onChange={value => {
          const section = sections.find(item => item.key === value);
          if (section) onSelect(section);
        }} />
    </div>
  </aside>;
}
export function WorkspaceLoading() {
  const t = useWorkspaceCopy();
  return <SubpageLoading label={t('Przygotowujemy widok…', 'Loading your page…')} />;
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
      const last = String(message?.content || '').split('\n\n[IdeaHire:terms:v1]')[0].trim();
      return <Link className={'ih68-work-row' + (item.isUnread ? ' is-unread' : '')} key={item.id} to={'/chat/' + item.id} onClick={e => open(e, item.id)}>
      <WorkspaceAvatar name={name} url={item.otherProfile?.avatar_url} />
      <div className="ih68-work-row-copy">
        <div className="ih69-row-person"><span>{name}</span><time dateTime={item.sortDate || undefined}>{workspaceDate(item.sortDate, en)}</time></div>
        <strong>{item.job?.title || t('Zapytanie o współpracę', 'Project inquiry')}</strong>
        {preview && <p>{message ? (message.sender_id === user?.id ? t('Ty: ', 'You: ') : '') + (last || t('Przesłano materiały', 'Materials shared')) : item.client_id === user?.id ? t('Zlecasz ten projekt', 'You are hiring for this project') : t('Realizujesz ten projekt', 'You are providing this project')}</p>}
      </div>
      <div className="ih68-row-end">{item.isUnread && <i className="ih68-dot" aria-label={t('Nowa wiadomość', 'New message')} />}</div>
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
  name, avatarUrl, specialtyCount = 0, portfolioCount = 0,
  jobCount = 0, jobsLoading = false, sections, onSelect, inbox,
}) {
  const t = useWorkspaceCopy();
  const [profileOpen, setProfileOpen] = useState(false);
  const conversations = inbox?.conversations || [];
  const unread = conversations.filter(item => item.isUnread).length;
  const select = key => {
    const section = sections.find(item => item.key === key);
    if (section) onSelect(section);
  };
  return <div className="ih72-dashboard">
    <section className="ih72-identity" aria-labelledby="ih68-home-title">
      <p className="ih72-eyebrow">{t('Moje konto', 'My account')}</p>
      <button type="button" className={'ih72-profile-orbit' + (profileOpen ? ' is-open' : '')}
        aria-expanded={profileOpen} aria-controls="ih72-profile-shortcuts"
        aria-label={t('Pokaż opcje edycji profilu', 'Show profile editing options')}
        onClick={() => setProfileOpen(value => !value)}>
        <WorkspaceAvatar name={name} url={avatarUrl} />
        <span className="ih72-orbit-control"><WorkspaceIcon kind={profileOpen ? 'close' : 'plus'} /></span>
      </button>
      <h1 id="ih68-home-title" tabIndex={-1}>{name || t('Twoja przestrzeń', 'Your space')}</h1>
      <div className="ih72-identity-links">
        <button type="button" aria-expanded={profileOpen} aria-controls="ih72-profile-shortcuts"
          onClick={() => setProfileOpen(value => !value)}>{t('Edytuj profil', 'Edit profile')}<WorkspaceIcon kind="down" /></button>
        {inbox?.user?.id && <Link to={'/profile/' + inbox.user.id}>{t('Zobacz profil', 'View profile')}<WorkspaceIcon kind="arrow" /></Link>}
      </div>
      <nav id="ih72-profile-shortcuts" className="ih72-profile-shortcuts" hidden={!profileOpen}
        aria-label={t('Edycja profilu', 'Edit profile')}>
        {[['profile', 'profile', t('Dane profilu', 'Profile details')],
          ['expertise', 'services', t('Umiejętności', 'Skills')],
          ['portfolio', 'portfolio', 'Portfolio']].map(([key, icon, label]) =>
          <button type="button" key={key} onClick={() => select(key)}><WorkspaceIcon kind={icon} /><span>{label}</span></button>)}
      </nav>
      <div className="ih72-account-facts" aria-label={t('Twój profil w liczbach', 'Your profile at a glance')}>
        <button type="button" onClick={() => select('jobs')}><strong><SubpageCount value={jobCount} loading={jobsLoading} /></strong><span>{t('Zlecenia', 'Listings')}</span></button>
        <button type="button" onClick={() => select('portfolio')}><strong><SubpageCount value={portfolioCount} /></strong><span>Portfolio</span></button>
        <button type="button" onClick={() => select('expertise')}><strong><SubpageCount value={specialtyCount} /></strong><span>{t('Specjalizacje', 'Skills')}</span></button>
      </div>
    </section>

    <section className="ih72-launchpad" aria-labelledby="ih72-work-title">
      <div className="ih72-section-heading"><div><p className="ih72-eyebrow">{t('Zlecenia i usługi', 'Jobs & services')}</p><h2 id="ih72-work-title">{t('Twoja praca', 'Your work')}</h2></div><Link to="/work" className="ih68-text-link">{t('Współprace', 'Projects')}</Link></div>
      <WorkspaceWorkActions />
      <nav className="ih80-account-catalogs" aria-label={t('Odkrywaj IdeaHire', 'Explore IdeaHire')}>
        <Link to="/services"><WorkspaceIcon kind="services" /><span><strong>{t('Usługi', 'Services')}</strong><small>{t('Poznaj oferty wykonawców', 'Explore freelancer offers')}</small></span><WorkspaceIcon kind="arrow" /></Link>
        <Link to="/freelancers"><WorkspaceIcon kind="people" /><span><strong>{t('Freelancerzy', 'Freelancers')}</strong><small>{t('Znajdź osobę do projektu', 'Find someone for your project')}</small></span><WorkspaceIcon kind="arrow" /></Link>
      </nav>
    </section>

    <section className="ih72-activity" aria-labelledby="ih72-recent-title">
      <div className="ih72-section-heading"><h2 id="ih72-recent-title">{t('Ostatnie rozmowy', 'Recent conversations')}{!inbox?.loading && unread > 0 && <span className="ih72-count">{unread}<span className="ih68-sr-only">{t(' nieprzeczytanych', ' unread')}</span></span>}</h2><Link to="/messages" className="ih68-text-link">{t('Wszystkie', 'View all')}<WorkspaceIcon kind="arrow" /></Link></div>
      {inbox?.loading ? <WorkspaceLoading /> : inbox?.errorMessage ? <p className="ih68-feedback" role="alert">{inbox.errorMessage}</p> : conversations.length ?
        <WorkspaceConversationRows conversations={conversations.slice(0, 3)} user={inbox?.user} /> :
        <div className="ih72-empty-inline"><WorkspaceIcon kind="message" /><div><h3>{t('Nie masz jeszcze rozmów.', 'No conversations yet.')}</h3><p>{t('Tutaj znajdziesz wiadomości dotyczące Twoich projektów.', 'Your project conversations will appear here.')}</p><Link to="/freelancers" className="ih68-text-link">{t('Znajdź wykonawcę', 'Find a freelancer')}</Link></div></div>}
    </section>

    <section className="ih72-account-tools" aria-labelledby="ih72-account-tools-title">
      <div className="ih72-section-heading"><h2 id="ih72-account-tools-title">{t('Twoje konto', 'Your account')}</h2></div>
      <div className="ih72-setting-links">
        {[['payouts', 'payouts', t('Saldo i wypłaty', 'Balance & payouts'), t('Stripe i historia rozliczeń', 'Stripe and payout history')],
          ['preferences', 'settings', t('Ustawienia konta', 'Account settings'), t('Powiadomienia, prywatność i preferencje', 'Notifications, privacy and preferences')],
          ['templates', 'palette', t('Wygląd strony', 'Site appearance'), t('Twój szablon i kolory', 'Your template and colours')]].map(([key, icon, label, detail]) =>
          <button type="button" key={key} onClick={() => select(key)}><WorkspaceIcon kind={icon} /><span><strong>{label}</strong><small>{detail}</small></span></button>)}
      </div>
    </section>
    <footer className="ih72-desk-footer"><nav aria-label={t('Pomoc i informacje', 'Help and information')}><a className="ih-account-help-link" href={helpCenterHref()}>{t('Przejdź do centrum pomocy', 'Visit the help centre')}</a><Link to="/privacy-center">{t('Prywatność i dane', 'Privacy & data')}</Link></nav><IntroFilm /></footer>
  </div>;
}

function WorkspaceProjectCards({ conversations, user, loading = false }) {
  const t = useWorkspaceCopy();
  const en = useSitePreferences().language === 'en';
  const open = useWorkspaceListNavigation(loading);
  return <div className="ih72-project-grid">{conversations.map(item => {
    const name = item.otherProfile?.name || t('Użytkownik', 'User');
    const hiring = item.client_id === user?.id;
    const message = item.lastMessage;
    const preview = message ? (message.sender_id === user?.id ? t('Ty: ', 'You: ') : '') +
      (String(message.content || '').split('\n\n[IdeaHire:terms:v1]')[0].trim() || t('Przesłano materiały', 'Materials shared')) :
      t('Otwórz rozmowę i ustal kolejne kroki.', 'Open the conversation and agree on next steps.');
    return <Link key={item.id} className={'ih72-project-card' + (item.isUnread ? ' is-unread' : '')}
      to={'/chat/' + item.id} onClick={event => open(event, item.id)}>
      <div className="ih72-project-top"><span className="ih72-role"><WorkspaceIcon kind={hiring ? 'jobs' : 'work'} />{hiring ? t('Zlecam', 'Hiring') : t('Realizuję', 'Providing')}</span>{item.isUnread && <span className="ih72-project-unread"><i className="ih68-dot" />{t('Nowa wiadomość', 'New message')}</span>}</div>
      <h3>{item.job?.title || t('Zapytanie o współpracę', 'Project inquiry')}</h3>
      <div className="ih72-project-person"><WorkspaceAvatar small name={name} url={item.otherProfile?.avatar_url} /><span>{name}</span></div>
      <p className="ih72-project-preview">{preview}</p>
      <div className="ih72-project-bottom"><time dateTime={item.sortDate || undefined}>{workspaceDate(item.sortDate, en)}</time><span>{t('Otwórz projekt', 'Open project')}<WorkspaceIcon kind="arrow" /></span></div>
    </Link>;
  })}</div>;
}

export function WorkspaceWork({ inbox }) {
  const t = useWorkspaceCopy();
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const filter = ['client', 'contractor'].includes(params.get('role')) ? params.get('role') : 'all';
  const search = params.get('q') || '';
  const [wide, setWide] = useState(() => window.matchMedia('(min-width:851px)').matches);
  useEffect(() => {
    const media = window.matchMedia('(min-width:851px)');
    const change = () => setWide(media.matches);
    media.addEventListener?.('change', change);
    return () => media.removeEventListener?.('change', change);
  }, []);

  const rows = inbox?.conversations || [];
  const unread = rows.filter(item => item.isUnread).length;
  const hiring = rows.filter(item => item.client_id === inbox?.user?.id).length;
  const providing = rows.filter(item => item.contractor_id === inbox?.user?.id).length;
  const visible = useMemo(() => rows.filter(item =>
    (filter === 'all' || (filter === 'client' ? item.client_id : item.contractor_id) === inbox?.user?.id) &&
    (!search.trim() || [item.job?.title, item.otherProfile?.name, item.lastMessage?.content].filter(Boolean).join(' ').toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))),
    [rows, filter, search, inbox?.user?.id]);
  function update(key, value) {
    const next = new URLSearchParams(location.search);
    if (value && value !== 'all') next.set(key, value); else next.delete(key);
    navigate({ pathname: '/work', search: next.toString() ? '?' + next : '' }, { replace: true, state: {} });
  }
  return <main className="ih68-page ih72-work-page" id="ih68-content">
    <header className="ih-work-heading"><h1>{t('Panel pracy', 'Workspace')}</h1><Link to="/calendar" className="ih79-button"><WorkspaceIcon kind="calendar" />{t('Kalendarz', 'Calendar')}</Link></header>
    <div className="ih79-work-overview" aria-label={t('Podsumowanie współprac', 'Project overview')}>
      <Link to="/messages?unread=1" className={unread ? 'has-unread' : ''}><span>{t('Nieprzeczytane rozmowy', 'Unread conversations')}</span><strong><SubpageCount value={unread} loading={inbox?.loading} /></strong><WorkspaceIcon kind="arrow" /></Link>
      <button type="button" aria-pressed={filter === 'client'} onClick={() => update('role', 'client')}><span>{t('Zlecam', 'Hiring')}</span><strong><SubpageCount value={hiring} loading={inbox?.loading} /></strong></button>
      <button type="button" aria-pressed={filter === 'contractor'} onClick={() => update('role', 'contractor')}><span>{t('Realizuję', 'Providing')}</span><strong><SubpageCount value={providing} loading={inbox?.loading} /></strong></button>
    </div>
    <div className="ih79-work-layout">
      <section className="ih72-projects" aria-labelledby="ih72-projects-title">
        <div className="ih79-section-title"><h2 id="ih72-projects-title">{t('Współprace', 'Projects')}<span className="ih79-count"><SubpageCount value={visible.length} loading={inbox?.loading} /></span></h2></div>
        <div className="ih72-list-toolbar">
          <div className="ih72-filters" role="group" aria-label={t('Twoja rola', 'Your role')}>
            {[['all', t('Wszystkie', 'All')], ['client', t('Zlecam', 'Hiring')], ['contractor', t('Realizuję', 'Providing')]].map(([value, label]) =>
              <button type="button" key={value} aria-pressed={filter === value} onClick={() => update('role', value)}>{label}</button>)}
          </div>
          <label className="ih72-search"><span className="ih68-sr-only">{t('Szukaj projektu lub osoby', 'Search projects or people')}</span><WorkspaceIcon kind="search" /><input type="search" maxLength={160} value={search} onChange={event => update('q', event.target.value)} placeholder={t('Projekt lub osoba', 'Project or person')} />{search && <button type="button" onClick={() => update('q', '')} aria-label={t('Wyczyść wyszukiwanie', 'Clear search')}><WorkspaceIcon kind="close" /></button>}</label>
        </div>
        {inbox?.loading ? <WorkspaceLoading /> : inbox?.errorMessage ? <p className="ih68-feedback" role="alert">{inbox.errorMessage}</p> : visible.length ?
          <WorkspaceProjectCards conversations={visible} user={inbox?.user} loading={inbox?.loading} /> :
          <div className="ih79-empty"><h3>{rows.length ? t('Brak pasujących współprac', 'No matching projects') : t('Nie masz jeszcze współprac', 'No projects yet')}</h3><p>{rows.length ? t('Zmień frazę lub wybraną rolę.', 'Change the phrase or selected role.') : t('Odpowiedz na zlecenie albo napisz do wykonawcy. Rozmowę i ustalenia znajdziesz tutaj.', 'Reply to a job or contact a freelancer. Your conversations and terms will appear here.')}</p>{rows.length ? <button type="button" className="ih79-button" onClick={() => navigate('/work', { replace: true })}>{t('Wyczyść filtry', 'Clear filters')}</button> : <Link to="/jobs" className="ih79-button is-primary">{t('Znajdź zlecenie', 'Find a job')}<WorkspaceIcon kind="arrow" /></Link>}</div>}
      </section>
      <aside className="ih79-work-tools" aria-label={t('Zlecenia i usługi', 'Jobs and services')}>
        <details className="ih81-work-shortcuts" open={wide}>
          <summary><span>{t('Narzędzia pracy', 'Work tools')}</span><WorkspaceIcon kind="plus" /></summary>
          <div className="ih81-work-shortcuts-body"><WorkspaceWorkActions /></div>
        </details>
      </aside>
    </div>
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
    if (!value || Number.isNaN(d.getTime())) return '';
    return d.toDateString() === new Date().toDateString()
      ? d.toLocaleTimeString(en ? 'en-GB' : 'pl-PL', { hour: '2-digit', minute: '2-digit' })
      : workspaceDate(value, en);
  };
  return <div className="ih72-conversation-list">{conversations.map(item => {
    const name = item.otherProfile?.name || t('Użytkownik', 'User');
    const message = item.lastMessage;
    const preview = message ? (message.sender_id === user?.id ? t('Ty: ', 'You: ') : '') +
      (String(message.content || '').split('\n\n[IdeaHire:terms:v1]')[0].trim() || t('Przesłano materiały', 'Materials shared')) : t('Rozpocznij rozmowę', 'Start a conversation');
    return <Link key={item.id} to={'/chat/' + item.id} onClick={event => open(event, item.id)}
      className={'ih72-conversation-row' + (item.isUnread ? ' is-unread' : '')}>
      <WorkspaceAvatar name={name} url={item.otherProfile?.avatar_url} />
      <div className="ih72-conversation-copy">
        <div className="ih72-conversation-person"><strong>{name}</strong><time dateTime={item.sortDate || undefined}>{date(item.sortDate)}</time></div>
        <span className="ih72-conversation-project">{item.job?.title || t('Zapytanie o współpracę', 'Project inquiry')}</span>
        <p>{preview}</p>
      </div>
      <span className="ih72-conversation-end">{item.isUnread ? <i className="ih68-dot" aria-label={t('Nieprzeczytana rozmowa', 'Unread conversation')} /> : null}</span>
    </Link>;
  })}</div>;
}

function WorkspaceWorkActions() {
  const t = useWorkspaceCopy();
  return <div className="ih72-work-actions">
    <div className="ih72-main-actions">
      <Link to="/find-talent" className="ih68-primary"><WorkspaceIcon kind="plus" /><span>{t('Zleć pracę', 'Post a job')}</span></Link>
      <Link to="/jobs" className="ih68-secondary"><WorkspaceIcon kind="search" /><span>{t('Znajdź zlecenie', 'Find a job')}</span></Link>
    </div>
    <nav className="ih72-work-links" aria-label={t('Twoje ogłoszenia i terminarz', 'Your listings and calendar')}>
      <Link to="/account#account-jobs"><WorkspaceIcon kind="jobs" />{t('Moje zlecenia', 'My listings')}</Link>
      <Link to="/services/mine"><WorkspaceIcon kind="services" />{t('Moje usługi', 'My services')}</Link>
      <Link to="/services/new"><WorkspaceIcon kind="plus" />{t('Dodaj usługę', 'Add a service')}</Link>
      <Link to="/calendar"><WorkspaceIcon kind="calendar" />{t('Kalendarz', 'Calendar')}</Link>
    </nav>
  </div>;
}

