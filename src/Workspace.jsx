/* P70 — choose a task, then use one uncluttered view. */
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ArrowUpRight, ArrowUp, Bell, BriefcaseBusiness, CalendarDays, Check, ChevronDown, ChevronRight, FileText, FolderOpen, Wallet, Home, Image, LayoutGrid, LogOut, Menu, MessageSquare, MoreHorizontal, Palette, Paperclip, Play, Plus, Search, Settings, ShieldCheck, SlidersHorizontal, UserRound, X, Maximize2, Minimize2, Pin } from 'lucide-react';
import { BrandSignature } from './Brand';
import LucynaSymbol from './LucynaSymbol';
import { useSitePreferences } from './Preferences';
import { IdeaHirePromoFilm } from './App';
import { WorkspaceSheet, WorkspaceTaskLink, WorkspaceDisplaySettings } from './WorkspaceFlow';
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
  const [open, setOpen] = useState(false), [more, setMore] = useState(false);
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
  useEffect(() => { setOpen(false); setMore(false); }, [location.pathname, location.hash, location.search]);
  const primary = limited ? [['/account', t('Moje konto', 'My account'), 'home'], ['/jobs', t('Zlecenia', 'Jobs'), 'jobs'], ['/services', t('Usługi', 'Services'), 'services']] : [['/account', t('Moje konto', 'My account'), 'home'], ['/work', t('Moja praca', 'My work'), 'work'], ['/messages', t('Wiadomości', 'Messages'), 'message']];
  const current = to => to === '/messages' ? view === 'chat' || view === 'messages' : to === '/account' ? location.pathname === to && !location.hash : location.pathname === to;
  const item = ([to, label, icon]) => <Link key={to} to={to} onClick={() => setOpen(false)} className="ih70-menu-link" aria-current={current(to) ? 'page' : undefined}><WorkspaceIcon kind={icon} /><span>{label}</span>{((to === '/messages' && hasMessages) || (to === '/notifications' && hasNotifications) || (to === '/disputes' && hasDisputes)) && <i className="ih68-dot" />}<WorkspaceIcon kind="next" /></Link>;
  const extras = [['/', t('Strona główna', 'Site home'), 'home'], ['/jobs', t('Przeglądaj zlecenia', 'Browse jobs'), 'jobs'], ['/freelancers', t('Freelancerzy', 'Freelancers'), 'people'], ['/services', t('Usługi', 'Services'), 'services'], ['/calendar', t('Kalendarz', 'Calendar'), 'calendar'], ...(!limited ? [['/notifications', t('Powiadomienia', 'Notifications'), 'bell'], ['/disputes', t('Sprawy i zgłoszenia', 'Disputes & reports'), 'lock']] : []), ['/privacy-center', t('Prywatność i dane', 'Privacy & data'), 'lock']];
  return <>
    <a className="ih68-skip" href="#ih68-content">{t('Przejdź do treści', 'Skip to content')}</a>
    <header className="navbar account-navbar ih68-header" data-workspace-release="P70"><div className="ih68-header-inner"><Link to="/" className="ih68-brand" aria-label={t('IdeaHire — strona główna', 'IdeaHire — site home')}><BrandSignature /></Link><nav className="ih68-top-nav" aria-label={t('Panel konta', 'Account navigation')}>{primary.map(([to,label]) => <Link key={to} to={to} className="ih68-top-link" aria-current={current(to) ? 'page' : undefined}>{label}{to === '/messages' && hasMessages && <i className="ih68-dot" />}</Link>)}</nav><div className="ih68-header-actions">{!limited && <Link className="ih68-notifications" to="/notifications" aria-label={t(hasNotifications ? 'Nowe powiadomienia' : 'Powiadomienia', hasNotifications ? 'New notifications' : 'Notifications')}><WorkspaceIcon kind="bell" />{hasNotifications && <i className="ih68-dot" />}</Link>}<button type="button" className="ih68-menu-trigger" aria-haspopup="dialog" aria-controls="ih70-account-menu" aria-expanded={open} aria-label={t('Otwórz menu', 'Open menu')} onClick={() => { setMore(false); setOpen(true); }}><span className="ih68-desktop-avatar"><WorkspaceAvatar name={name} url={avatarUrl} small /></span><span className="ih68-phone-menu"><WorkspaceIcon kind="menu" /></span><WorkspaceIcon kind="down" /></button></div></div></header>
    <WorkspaceSheet id="ih70-account-menu" open={open} onClose={() => setOpen(false)} title={more ? t('Pozostałe strony', 'More pages') : 'IdeaHire'} onBack={more ? () => setMore(false) : undefined}>
      <nav className="ih70-menu-list" aria-label={t('Menu IdeaHire', 'IdeaHire menu')}>{more ? <>{extras.map(item)}{assistantEnabled && <Link to="/lucyna" className="ih70-menu-link" data-no-route-transition="true" onClick={event => { setOpen(false); onAssistantOpen?.(event); }}><LucynaSymbol /><span>Lucyna AI</span><WorkspaceIcon kind="next" /></Link>}<a className="ih70-menu-link" href={helpUrl}><WorkspaceIcon kind="message" /><span>{t('Centrum pomocy', 'Help centre')}</span><WorkspaceIcon kind="next" /></a><WorkspaceDisplaySettings limited={limited} onNavigate={() => setOpen(false)} /></> : <>{primary.map(item)}<button type="button" className="ih70-menu-link ih70-menu-secondary" onClick={() => setMore(true)}><WorkspaceIcon kind="services" /><span>{t('Katalogi, pomoc i pozostałe strony', 'Browse, help and more')}</span><WorkspaceIcon kind="next" /></button>{moderationNotice && <Link to="/account-status" className="ih70-menu-link" onClick={() => setOpen(false)}><WorkspaceIcon kind="lock" /><span>{t('Status konta', 'Account status')}</span><WorkspaceIcon kind="next" /></Link>}<button type="button" className="ih70-menu-link ih70-signout" onClick={() => { setOpen(false); onLogout(); }}><WorkspaceIcon kind="logout" /><span>{t('Wyloguj się', 'Sign out')}</span></button></>}</nav>
    </WorkspaceSheet>
  </>;
}
export function WorkspaceSectionNav({ sections, active, onSelect }) {
  const t = useWorkspaceCopy();
  const [open, setOpen] = useState(false);
  const group = ['profile','expertise','portfolio'].includes(active) ? ['profile','expertise','portfolio'] : ['preferences','templates'].includes(active) ? ['preferences','templates'] : [];
  const labels = { profile: t('Dane profilu','Profile details'), expertise: t('Umiejętności','Skills'), portfolio: 'Portfolio', preferences: t('Ustawienia konta','Account settings'), templates: t('Wygląd strony','Appearance') };
  return group.length ? <div className="ih70-section-picker"><button type="button" className="ih70-section-trigger" aria-haspopup="dialog" onClick={() => setOpen(true)}>{labels[active]}<WorkspaceIcon kind="down" /></button><WorkspaceSheet open={open} onClose={() => setOpen(false)} title={t('Wybierz sekcję','Choose a section')}><nav className="ih70-menu-list">{sections.filter(s => group.includes(s.key)).map(section => <button type="button" key={section.key} className="ih70-menu-link" aria-current={active === section.key ? 'page' : undefined} onClick={() => { setOpen(false); onSelect(section); }}><span>{labels[section.key]}</span><WorkspaceIcon kind={active === section.key ? 'check' : 'next'} /></button>)}<Link to="/account?area=account" className="ih70-menu-link ih70-menu-secondary" onClick={() => setOpen(false)}><span>{t('Wszystkie ustawienia','All account settings')}</span><WorkspaceIcon kind="next" /></Link></nav></WorkspaceSheet></div> : null;
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
export function WorkspaceDashboard({ name, sections, onSelect, inbox }) {
  const t = useWorkspaceCopy();
  const location = useLocation();
  const account = new URLSearchParams(location.search).get('area') === 'account';
  const heading = useRef(null);
  useEffect(() => { if (account) heading.current?.focus({ preventScroll: true }); }, [account]);
  const first = (name || '').trim().split(/\s+/)[0];
  const unread = (inbox?.conversations || []).filter(item => item.isUnread).length;
  return <div className="ih70-start">
    {account ? <><Link to="/account" className="ih70-back-link"><WorkspaceIcon kind="back" />{t('Wróć','Back')}</Link><header className="ih70-start-heading"><h1 ref={heading} id="ih68-home-title" tabIndex={-1}>{t('Profil i ustawienia','Profile & settings')}</h1></header><nav className="ih70-start-choices" aria-label={t('Wybierz ustawienia','Choose account settings')}><WorkspaceTaskLink as="button" type="button" onClick={() => onSelect(sections.find(s => s.key === 'profile'))} title={t('Profil','Profile')} detail={t('Zdjęcie, umiejętności i portfolio.','Photo, skills and portfolio.')} icon={<WorkspaceIcon kind="profile" />} trailing={<WorkspaceIcon kind="next" />} /><WorkspaceTaskLink as="button" type="button" onClick={() => onSelect(sections.find(s => s.key === 'preferences'))} title={t('Ustawienia','Settings')} detail={t('Prywatność, powiadomienia i wygląd.','Privacy, notifications and appearance.')} icon={<WorkspaceIcon kind="settings" />} trailing={<WorkspaceIcon kind="next" />} /><WorkspaceTaskLink as="button" type="button" onClick={() => onSelect(sections.find(s => s.key === 'payouts'))} title={t('Saldo i wypłaty','Balance & payouts')} detail={t('Środki i połączenie ze Stripe.','Funds and your Stripe connection.')} icon={<WorkspaceIcon kind="payouts" />} trailing={<WorkspaceIcon kind="next" />} /></nav></> : <>
      <header className="ih70-start-heading"><p>{first ? t('Cześć, ' + first + '.','Hi, ' + first + '.') : 'IdeaHire'}</p><h1 id="ih68-home-title" tabIndex={-1}>{t('Moje konto','My account')}</h1></header>
      <nav className="ih70-start-choices" aria-label={t('Wybierz zadanie','Choose a task')}>
        <WorkspaceTaskLink as={Link} to="/work" className="is-primary" title={t('Moja praca','My work')} detail={t('Projekty, zlecenia i usługi.','Projects, jobs and services.')} icon={<WorkspaceIcon kind="work" />} trailing={<WorkspaceIcon kind="next" />} />
        <WorkspaceTaskLink as={Link} to="/messages" title={t('Wiadomości','Messages')} detail={t('Wróć do rozmów o współpracy.','Pick up your project conversations.')} icon={<WorkspaceIcon kind="message" />} trailing={<>{unread > 0 && <span className="ih70-count" aria-label={t('Nieprzeczytane: ','Unread: ') + unread}>{unread}</span>}<WorkspaceIcon kind="next" /></>} />
        <WorkspaceTaskLink as={Link} to="/account?area=account" title={t('Profil i ustawienia','Profile & settings')} detail={t('Dane, portfolio i wygląd.','Details, portfolio and appearance.')} icon={<WorkspaceIcon kind="profile" />} trailing={<WorkspaceIcon kind="next" />} />
      </nav>
      <footer className="ih70-start-footer"><IntroFilm /></footer>
    </>}
  </div>;
}
export function WorkspaceWork({ inbox }) {
  const t = useWorkspaceCopy();
  const location = useLocation(), navigate = useNavigate();
  const [sheet, setSheet] = useState('');
  const params = new URLSearchParams(location.search);
  const filter = ['client','contractor'].includes(params.get('role')) ? params.get('role') : 'all';
  const search = params.get('q') || '';
  const rows = inbox?.conversations || [];
  const visible = useMemo(() => rows.filter(item => (filter === 'all' || (filter === 'client' ? item.client_id : item.contractor_id) === inbox?.user?.id) && (!search.trim() || [item.job?.title,item.otherProfile?.name,item.lastMessage?.content].filter(Boolean).join(' ').toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))), [rows,filter,search,inbox?.user?.id]);
  function update(key,value) { const next = new URLSearchParams(location.search); if(value && value !== 'all') next.set(key,value); else next.delete(key); navigate({ pathname:'/work', search:next.toString() ? '?' + next : '' },{ replace:true,state:{} }); }
  const reset = () => navigate('/work',{replace:true});
  return <main className="ih68-page ih70-list-page" id="ih68-content"><header className="ih70-list-heading"><h1>{t('Moja praca','My work')}</h1><button type="button" className="ih68-primary" aria-haspopup="dialog" onClick={() => setSheet('actions')}>{t('Działania','Actions')}<WorkspaceIcon kind="down" /></button></header>
    <div className="ih70-list-controls"><p>{inbox?.loading ? t('Twoje projekty','Your projects') : t('Współprace: ','Project conversations: ') + visible.length}</p><button type="button" className="ih70-filter-button" aria-haspopup="dialog" onClick={() => setSheet('filters')}><WorkspaceIcon kind="filter" />{t('Filtry','Filters')}{(search || filter !== 'all') && <i className="ih68-dot" />}</button></div>
    {(search || filter !== 'all') && <div className="ih70-applied-filter"><span>{search ? t('Szukasz: ','Searching: ') + search : filter === 'client' ? t('Zlecam pracę','Hiring') : t('Realizuję projekty','Providing')}</span><button type="button" onClick={reset}>{t('Wyczyść','Clear')}</button></div>}
    {inbox?.loading ? <WorkspaceLoading /> : inbox?.errorMessage ? <p className="ih68-feedback" role="alert">{inbox.errorMessage}</p> : visible.length ? <RecentRows conversations={visible} user={inbox?.user} loading={inbox?.loading} preview={false} /> : <div className="ih70-empty"><WorkspaceIcon kind="work" /><h2>{rows.length ? t('Brak pasujących projektów','No matching projects') : t('Jeszcze bez projektów','No projects yet')}</h2><p>{rows.length ? t('Zmień lub wyczyść filtry.','Change or clear your filters.') : t('Zacznij od zlecenia albo znajdź projekt do realizacji.','Post a job or find a project to work on.')}</p>{rows.length ? <button type="button" className="ih68-secondary" onClick={reset}>{t('Wyczyść filtry','Clear filters')}</button> : <button type="button" className="ih68-primary" onClick={() => setSheet('actions')}>{t('Wybierz działanie','Choose an action')}<WorkspaceIcon kind="next" /></button>}</div>}
    <WorkspaceSheet open={sheet === 'actions'} onClose={() => setSheet('')} title={t('Co chcesz zrobić?','What would you like to do?')}><nav className="ih70-menu-list">{[['/find-talent',t('Dodaj zlecenie','Post a job'),'plus'],['/jobs',t('Znajdź zlecenie','Find a job'),'search'],['/services/new',t('Dodaj usługę','Add a service'),'plus'],['/account#account-jobs',t('Moje zlecenia i zgłoszenia','My jobs and applications'),'jobs'],['/services/mine',t('Moje usługi','My services'),'services'],['/calendar',t('Kalendarz','Calendar'),'calendar']].map(([to,label,kind]) => <Link to={to} key={to} className="ih70-menu-link" onClick={() => setSheet('')}><WorkspaceIcon kind={kind} /><span>{label}</span><WorkspaceIcon kind="next" /></Link>)}</nav></WorkspaceSheet>
    <WorkspaceSheet open={sheet === 'filters'} onClose={() => setSheet('')} title={t('Filtry projektów','Project filters')}><div className="ih70-filter-fields"><label className="ih70-field"><span>{t('Projekt lub osoba','Project or person')}</span><input type="search" maxLength={160} value={search} onChange={e => update('q',e.target.value)} placeholder={t('Wpisz nazwę','Enter a name')} data-sheet-focus /></label><fieldset><legend>{t('Twoja rola','Your role')}</legend>{[['all',t('Wszystkie projekty','All projects')],['client',t('Zlecam pracę','Hiring')],['contractor',t('Realizuję projekty','Providing')]].map(([value,label]) => <label key={value}><input type="radio" name="ih70-work-role" checked={filter === value} onChange={() => update('role',value)} /><span>{label}</span></label>)}</fieldset><button type="button" className="ih68-primary ih70-sheet-done" onClick={() => setSheet('')}>{t('Pokaż projekty','Show projects')}<WorkspaceIcon kind="arrow" /></button></div></WorkspaceSheet>
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
