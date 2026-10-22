/* P79 — one navigation system, with layouts built for each kind of work. */
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { LayoutGrid, CalendarDays, Bell, Check } from 'lucide-react';
import { useSitePreferences, translateUiText } from './Preferences';
import './Subpages.css';

let newestEntry = 0;

export function getSubpage(location, en = false) {
  const path = location.pathname.replace(/\/$/, '') || '/';
  const copy = (pl, english) => en ? english : pl;
  const accountSections = ['#account-expertise', '#account-portfolio', '#account-jobs', '#account-preferences', '#account-privacy', '#account-templates', '#account-payouts', '#account-profile-data'];
  if (path === '/') return null;
  if (path === '/account' && !accountSections.includes(location.hash)) return { kind: 'dashboard', label: copy('Moje konto', 'My account'), parent: '/' };
  if (path === '/account') {
    const labels = {
      '#account-profile-data': ['Dane profilu', 'Profile details'],
      '#account-expertise': ['Umiejętności', 'Skills'],
      '#account-portfolio': ['Portfolio', 'Portfolio'],
      '#account-jobs': ['Moje zlecenia', 'My listings'],
      '#account-preferences': ['Ustawienia', 'Settings'],
      '#account-privacy': ['Ustawienia', 'Settings'],
      '#account-payouts': ['Saldo i wypłaty', 'Balance & payouts'],
      '#account-templates': ['Wygląd strony', 'Appearance'],
    };
    return { kind: 'account', label: copy(...labels[location.hash]), parent: '/account' };
  }
  if (path === '/jobs') return { kind: 'jobs', label: copy('Znajdź zlecenie', 'Find a job'), parent: '/work' };
  if (path === '/find-talent') return { kind: 'editor', label: copy('Zleć pracę', 'Post a job'), parent: '/work' };
  if (path.startsWith('/edit-job/')) return { kind: 'editor', label: copy('Edytuj zlecenie', 'Edit job'), parent: '/account#account-jobs' };
  if (path === '/freelancers' || path === '/talent') return { kind: 'people', label: copy('Freelancerzy', 'Freelancers'), parent: '/work' };
  if (path === '/services') return { kind: 'services', label: copy('Usługi', 'Services'), parent: '/work' };
  if (path === '/services/new' || /^\/services\/[^/]+\/edit$/.test(path)) return { kind: 'service-editor', label: copy('Twoja usługa', 'Your service'), parent: '/services/mine' };
  if (path === '/services/mine') return { kind: 'my-services', label: copy('Moje usługi', 'My services'), parent: '/work' };
  if (path.startsWith('/services/')) return { kind: 'service-detail', label: copy('Szczegóły usługi', 'Service details'), parent: '/services' };
  if (path.startsWith('/profile/')) return { kind: 'profile', label: copy('Profil wykonawcy', 'Freelancer profile'), parent: '/freelancers' };
  if (path === '/calendar') return { kind: 'calendar', label: copy('Kalendarz', 'Calendar'), parent: '/work' };
  if (path === '/notifications') return { kind: 'notifications', label: copy('Powiadomienia', 'Notifications'), parent: '/account' };
  if (path === '/privacy-center') return { kind: 'privacy', label: copy('Prywatność i dane', 'Privacy & data'), parent: '/account' };
  if (path === '/account-status') return { kind: 'status', label: copy('Status konta', 'Account status'), parent: '/account' };
  if (path === '/disputes') return { kind: 'disputes', label: copy('Sprawy i zgłoszenia', 'Disputes & reports'), parent: '/account' };
  if (path.startsWith('/disputes/')) return { kind: 'case', label: copy('Szczegóły sprawy', 'Case details'), parent: '/disputes' };
  if (path === '/work') return { kind: 'work', label: copy('Moja praca', 'My work'), parent: '/account' };
  if (path === '/messages') return { kind: 'inbox', label: copy('Wiadomości', 'Messages'), parent: '/account' };
  if (path.startsWith('/chat/')) return { kind: 'conversation', label: copy('Rozmowa', 'Conversation'), parent: '/messages' };
  if (path === '/lucyna') return { kind: 'assistant', label: 'Lucyna AI', parent: '/account' };
  if (path.startsWith('/admin')) return { kind: 'admin', label: copy('Administracja', 'Administration'), parent: '/admin' };
  if (['/login', '/register', '/reset-password'].includes(path)) return { kind: 'access', label: path === '/register' ? copy('Załóż konto', 'Create account') : path === '/reset-password' ? copy('Odzyskaj dostęp', 'Recover access') : copy('Zaloguj się', 'Sign in'), parent: '/' };
  if (['/regulamin', '/polityka-prywatnosci', '/polityka-cookies'].includes(path)) return { kind: 'legal', label: path === '/regulamin' ? copy('Regulamin', 'Terms of service') : path === '/polityka-cookies' ? copy('Polityka cookies', 'Cookie policy') : copy('Polityka prywatności', 'Privacy policy'), parent: '/' };
  return { kind: 'page', label: 'IdeaHire', parent: '/account' };
}

export function SubpageTheme() {
  const location = useLocation();
  const en = useSitePreferences().language === 'en';
  const page = getSubpage(location, en);
  useIdeaHireActivityCycle();
  useSubpageDisclosureMotion();
  useLayoutEffect(() => {
    if (!page) return;
    document.body.classList.add('ih73-subpage', 'ih75-subpage', 'ih79-app');
    document.body.dataset.ih73Page = page.kind;
    document.body.dataset.ih75Section = page.kind === 'account' ? location.hash.slice(1) : page.kind;
    return () => {
      document.body.classList.remove('ih73-subpage', 'ih75-subpage', 'ih79-app');
      delete document.body.dataset.ih73Page;
      delete document.body.dataset.ih75Section;
    };
  }, [page?.kind, location.pathname, location.hash]);
  return <>
    {page && ['access', 'legal'].includes(page.kind) && <SubpageNavigation standalone />}
  </>;
}

export function SubpageLoading({ label, className = '', screen = false, pending = true }) {
  const en = useSitePreferences().language === 'en';
  return <div className={'ih87-loading' + (screen ? ' is-screen' : '') + (className ? ' ' + className : '')}
    data-route-loading={pending ? 'true' : undefined} role="status" aria-busy={pending || undefined}>
    <span className="ih87-loading-label">{label || (en ? 'Loading your page…' : 'Przygotowujemy widok…')}</span>
  </div>;
}

export function SubpageHistoryControls({ parent = '/account' }) {
  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const en = useSitePreferences().language === 'en';
  const [forward, setForward] = useState(false);
  useLayoutEffect(() => {
    const index = Number.isInteger(window.history.state?.idx) ? window.history.state.idx : 0;
    newestEntry = navigationType === 'PUSH' ? index : Math.max(newestEntry, index);
    const browserForward = window.navigation?.canGoForward;
    setForward(typeof browserForward === 'boolean' ? browserForward : index < newestEntry);
  }, [location.key, navigationType]);
  return <div className="ih73-history-controls">
    <button type="button" onClick={() => {
      if ((window.history.state?.idx || 0) > 0) navigate(-1);
      else navigate(parent === location.pathname + location.search + location.hash ? '/' : parent);
    }} aria-label={en ? 'Go back' : 'Wróć'} title={en ? 'Go back' : 'Wróć'}>{en ? 'Back' : 'Wróć'}</button>
    <button type="button" disabled={!forward} onClick={() => navigate(1)}
      aria-label={en ? 'Go forward' : 'Przejdź dalej'} title={en ? 'Go forward' : 'Przejdź dalej'}>{en ? 'Next' : 'Dalej'}</button>
  </div>;
}

export function SubpageNavigation({ standalone = false }) {
  const location = useLocation();
  const en = useSitePreferences().language === 'en';
  const page = getSubpage(location, en);
  if (!page || ['dashboard', 'work', 'inbox', 'conversation'].includes(page.kind)) return null;
  return <nav className={'ih73-route-navigation ih75-route-navigation' + (standalone ? ' is-standalone' : '')}
    aria-label={en ? 'Page navigation' : 'Nawigacja podstrony'} data-no-translate="true" data-subpage-release="P79">
    <SubpageHistoryControls parent={page.parent} />
    <span className="ih73-route-label"><span>IdeaHire</span><i aria-hidden="true">/</i><strong>{page.label}</strong></span>
    <Link to={['access', 'legal'].includes(page.kind) ? '/' : page.kind === 'admin' ? '/admin' : '/account'} className="ih73-panel-link"><LayoutGrid size={17} strokeWidth={1.65} aria-hidden="true" /><span>{['access', 'legal'].includes(page.kind) ? (en ? 'Home' : 'Strona główna') : (en ? 'Dashboard' : 'Panel')}</span></Link>
  </nav>;
}

export function SubpageHeading({ eyebrow, title, titleId, description, actions, children, variant = 'default', className = '' }) {
  const en = useSitePreferences().language === 'en';
  const location = useLocation();
  const page = getSubpage(location, en);
  const context = {
    work: en ? 'Projects and collaboration' : 'Projekty i współpraca',
    inbox: en ? 'Your conversations' : 'Twoje rozmowy',
    notifications: en ? 'Stay up to date' : 'Na bieżąco',
  };
  const copy = {
    'Prywatność i moje dane': 'Privacy & my data',
    'Centrum prywatności': 'Privacy centre',
    'Wyślij wniosek dotyczący swoich danych i śledź jego realizację bezpośrednio na koncie IdeaHire.': 'Submit a request about your data and follow its progress in your IdeaHire account.',
    'Bezpieczeństwo i moderacja': 'Safety & moderation',
    'Status Twojego konta': 'Your account status',
    'Decyzje administracji, ich uzasadnienia oraz możliwość odwołania.': 'Administrative decisions, their reasons and your right to appeal.',
    'Bezpieczna współpraca': 'Project support',
    'Sprawy i zgłoszenia': 'Cases & reports',
    'Zgłoszone problemy, wyjaśnienia, dowody i decyzje administratora.': 'Reported issues, explanations, evidence and administrative decisions.',
    'Skrzynka odbiorcza': 'Your inbox',
    'Powiadomienia': 'Notifications',
    'Nowe wiadomości, zgłoszenia do zleceń i decyzje dotyczące współpracy.': 'New messages, applications and project decisions.',
  };
  const text = value => en && typeof value === 'string' ? copy[value] || translateUiText(value) : value;
  const label = eyebrow || context[page?.kind];
  return <header key={location.pathname + location.hash} className={'ih73-page-heading ih75-page-heading ih-page-heading is-' + variant + (className ? ' ' + className : '')}>
    <div className="ih73-heading-copy">
      {label && <p className="ih-heading-kicker">{text(label)}</p>}
      <h1 id={titleId}>{text(title)}</h1>
      {description && <p className="ih73-description">{text(description)}</p>}
    </div>
    {actions && <div className="ih73-heading-actions">{actions}</div>}
    {children}
  </header>;
}

export function SubpageMetrics({ items }) {
  const icons = [CalendarDays, Bell, Check];
  return <dl className="ih73-page-metrics">{items.map((item, index) => {
    const Icon = icons[index % icons.length];
    return <div key={item.label}><span aria-hidden="true"><Icon size={20} strokeWidth={1.7} /></span><dt>{item.label}</dt><dd>{typeof item.value === 'number' ? <SubpageCount value={item.value} /> : item.value}</dd></div>;
  })}</dl>;
}

export function SubpageCatalogTabs({ active }) {
  const en = useSitePreferences().language === 'en';
  return <nav className="ih73-catalog-tabs" aria-label={en ? 'Explore IdeaHire' : 'Przeglądaj IdeaHire'}>
    {[['jobs', '/jobs', en ? 'Jobs' : 'Zlecenia'], ['people', '/freelancers', en ? 'Freelancers' : 'Freelancerzy'], ['services', '/services', en ? 'Services' : 'Usługi']].map(([key, to, label]) => <Link key={key} to={to} aria-current={active === key ? 'page' : undefined}>{label}</Link>)}
  </nav>;
}


// One motion rhythm for numeric summaries and expanding working sections.
export function SubpageCount({ value, loading = false }) {
  const number = Number(value);
  const target = Number.isFinite(number) ? Math.max(0, Math.floor(number)) : 0;
  const ref = useRef(null);
  const [shown, setShown] = useState(target);
  useLayoutEffect(() => {
    if (loading || target === 0 || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setShown(target);
      return;
    }
    let frame = 0, observer, started = false, dead = false;
    setShown(0);
    const start = () => {
      if (started || dead) return;
      started = true;
      observer?.disconnect();
      const origin = performance.now();
      const tick = now => {
        if (dead) return;
        const progress = Math.min(1, (now - origin) / 1800);
        setShown(Math.round(target * (1 - Math.pow(1 - progress, 1.35))));
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };
    if (typeof IntersectionObserver === 'function' && ref.current) {
      observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) start(); }, { threshold: .15 });
      observer.observe(ref.current);
    } else start();
    return () => { dead = true; cancelAnimationFrame(frame); observer?.disconnect(); };
  }, [target, loading]);
  return <span ref={ref} className="ih81-count" style={{ minInlineSize: loading ? '1ch' : String(target).length + 'ch' }}>
    <span className="ih81-sr-only">{loading ? '—' : target}</span>
    <span aria-hidden="true">{loading ? '—' : shown}</span>
  </span>;
}

function useSubpageDisclosureMotion() {
  useEffect(() => {
    const active = new Map();
    const selector = 'details.ih5-service-editor-section,details.ih5-service-process,details.ih81-work-shortcuts,details.ih68-account-note,details.ih75-owned-job-details,details.ih70-display';
    const restore = (element, record) => {
      element.style.height = record.height;
      element.style.overflow = record.overflow;
      active.delete(element);
    };
    const click = event => {
      const summary = event.target.closest?.('summary');
      const element = summary?.parentElement;
      if (!element?.matches(selector) || event.defaultPrevented || event.target.closest?.('a,button,input,select,textarea') || !element.animate || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
      if (element.classList.contains('ih81-work-shortcuts') && window.matchMedia('(min-width:851px)').matches) return;
      event.preventDefault();
      const previous = active.get(element);
      const from = element.getBoundingClientRect().height;
      const opening = previous ? !previous.opening : !element.open;
      const height = previous?.height ?? element.style.height;
      const overflow = previous?.overflow ?? element.style.overflow;
      if (previous) { previous.animation.oncancel = null; previous.animation.onfinish = null; previous.animation.cancel(); active.delete(element); }
      element.style.height = height;
      element.style.overflow = overflow;
      element.open = true;
      const style = getComputedStyle(element);
      const border = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
      const closed = summary.getBoundingClientRect().height + parseFloat(style.paddingTop) + parseFloat(style.paddingBottom) + border;
      const to = opening ? element.getBoundingClientRect().height : closed;
      element.style.height = from + 'px';
      element.style.overflow = 'hidden';
      const animation = element.animate([{ height: from + 'px' }, { height: to + 'px' }], { duration: 240, easing: 'cubic-bezier(.22,.7,.25,1)', fill: 'both' });
      const record = { animation, height, overflow, opening };
      active.set(element, record);
      animation.onfinish = () => {
        element.open = opening;
        animation.oncancel = null;
        animation.cancel();
        restore(element, record);
      };
      animation.oncancel = () => restore(element, record);
    };
    document.addEventListener('click', click);
    return () => {
      document.removeEventListener('click', click);
      for (const [element, record] of active) {
        record.animation.onfinish = null; record.animation.oncancel = null;
        record.animation.cancel(); element.style.height = record.height; element.style.overflow = record.overflow;
      }
    };
  }, []);
}

function useIdeaHireActivityCycle() {
  useEffect(() => {
    const key = 'ideahire_intro_active_ms';
    let elapsed = 0, lastTick = Date.now(), lastActivity = Date.now();
    try { elapsed = Math.min(1800000, Math.max(0, Number(sessionStorage.getItem(key)) || 0)); } catch {}
    const save = () => { try { sessionStorage.setItem(key, String(Math.min(elapsed, 1800000))); } catch {} };
    const tick = () => {
      const now = Date.now();
      if (!document.hidden && document.hasFocus()) elapsed += Math.max(0, Math.min(now, lastActivity + 120000) - Math.max(lastTick, now - 10000));
      lastTick = now;
      save();
      if (elapsed >= 1800000) window.dispatchEvent(new Event('ideahire:intro-due'));
    };
    const activity = () => { lastActivity = Date.now(); };
    const visibility = () => { lastTick = Date.now(); if (!document.hidden) activity(); save(); };
    const replayed = () => { elapsed = 0; lastTick = Date.now(); save(); };
    const events = ['pointerdown', 'pointermove', 'keydown', 'scroll', 'touchstart'];
    events.forEach(type => window.addEventListener(type, activity, { passive: true }));
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('focus', visibility);
    window.addEventListener('pagehide', save);
    window.addEventListener('ideahire:intro-replayed', replayed);
    const timer = window.setInterval(tick, 5000);
    return () => {
      clearInterval(timer); save();
      events.forEach(type => window.removeEventListener(type, activity));
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('focus', visibility);
      window.removeEventListener('pagehide', save);
      window.removeEventListener('ideahire:intro-replayed', replayed);
    };
  }, []);
}
