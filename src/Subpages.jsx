/* P79 — one navigation system, with layouts built for each kind of work. */
import React, { useLayoutEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { ArrowLeft, ArrowRight, LayoutGrid, CalendarDays, Bell, Check } from 'lucide-react';
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
  return page && ['access', 'legal'].includes(page.kind) ? <SubpageNavigation standalone /> : null;
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
    }} aria-label={en ? 'Go back' : 'Wróć'} title={en ? 'Go back' : 'Wróć'}><ArrowLeft size={20} strokeWidth={1.7} aria-hidden="true" /></button>
    <button type="button" disabled={!forward} onClick={() => navigate(1)}
      aria-label={en ? 'Go forward' : 'Przejdź dalej'} title={en ? 'Go forward' : 'Przejdź dalej'}><ArrowRight size={20} strokeWidth={1.7} aria-hidden="true" /></button>
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

export function SubpageHeading({ eyebrow, title, titleId, description, actions, children, variant = 'default' }) {
  const en = useSitePreferences().language === 'en';
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
  return <header className={'ih73-page-heading ih75-page-heading is-' + variant}>
    <div className="ih73-heading-copy">
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
    return <div key={item.label}><span aria-hidden="true"><Icon size={20} strokeWidth={1.7} /></span><dt>{item.label}</dt><dd>{item.value}</dd></div>;
  })}</dl>;
}

export function SubpageCatalogTabs({ active }) {
  const en = useSitePreferences().language === 'en';
  return <nav className="ih73-catalog-tabs" aria-label={en ? 'Explore IdeaHire' : 'Przeglądaj IdeaHire'}>
    {[['jobs', '/jobs', en ? 'Jobs' : 'Zlecenia'], ['people', '/freelancers', en ? 'Freelancers' : 'Freelancerzy'], ['services', '/services', en ? 'Services' : 'Usługi']].map(([key, to, label]) => <Link key={key} to={to} aria-current={active === key ? 'page' : undefined}>{label}</Link>)}
  </nav>;
}

