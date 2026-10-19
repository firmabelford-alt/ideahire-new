/* P73 — shared structure for every page beyond the account landing. */
import React, { useLayoutEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ArrowUpRight, LayoutGrid } from 'lucide-react';
import { useSitePreferences, translateUiText } from './Preferences';
import './Subpages.css';

let newestEntry = 0;

export function getSubpage(location, en = false) {
  const path = location.pathname.replace(/\/$/, '') || '/';
  const copy = (pl, english) => en ? english : pl;
  const accountSections = ['#account-expertise', '#account-portfolio', '#account-jobs', '#account-preferences', '#account-privacy', '#account-templates', '#account-payouts', '#account-profile-data'];
  if (path === '/' || path === '/account' && !accountSections.includes(location.hash)) return null;
  if (path === '/account') return { kind: 'account', label: copy('Moje konto', 'My account'), parent: '/account' };
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
    document.body.classList.add('ih73-subpage');
    document.body.dataset.ih73Page = page.kind;
    return () => {
      document.body.classList.remove('ih73-subpage');
      delete document.body.dataset.ih73Page;
    };
  }, [page?.kind, location.pathname]);
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
      else navigate(parent === location.pathname ? '/' : parent);
    }} aria-label={en ? 'Go back' : 'Wróć'} title={en ? 'Go back' : 'Wróć'}><ArrowLeft size={20} strokeWidth={1.7} aria-hidden="true" /></button>
    <button type="button" disabled={!forward} onClick={() => navigate(1)}
      aria-label={en ? 'Go forward' : 'Przejdź dalej'} title={en ? 'Go forward' : 'Przejdź dalej'}><ArrowRight size={20} strokeWidth={1.7} aria-hidden="true" /></button>
  </div>;
}

export function SubpageNavigation({ standalone = false }) {
  const location = useLocation();
  const en = useSitePreferences().language === 'en';
  const page = getSubpage(location, en);
  if (!page) return null;
  return <nav className={'ih73-route-navigation' + (standalone ? ' is-standalone' : '')}
    aria-label={en ? 'Page navigation' : 'Nawigacja podstrony'} data-no-translate="true" data-subpage-release="P73">
    <SubpageHistoryControls parent={page.parent} />
    <span className="ih73-route-label"><span>IdeaHire</span><i aria-hidden="true">/</i><strong>{page.label}</strong></span>
    <Link to={['access', 'legal'].includes(page.kind) ? '/' : page.kind === 'admin' ? '/admin' : '/account'} className="ih73-panel-link"><LayoutGrid size={17} strokeWidth={1.65} aria-hidden="true" /><span>{['access', 'legal'].includes(page.kind) ? (en ? 'Home' : 'Strona główna') : (en ? 'Dashboard' : 'Panel')}</span></Link>
  </nav>;
}

export function SubpageHeading({ eyebrow, title, description, actions, children, variant = 'default' }) {
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
  return <header className={'ih73-page-heading is-' + variant}>
    <div className="ih73-heading-copy">{eyebrow && <p className="ih73-eyebrow">{text(eyebrow)}</p>}<h1>{text(title)}</h1>{description && <p className="ih73-description">{text(description)}</p>}{actions && <div className="ih73-heading-actions">{actions}</div>}</div>
    <div className="ih73-heading-art" aria-hidden="true" data-page-motion-stage="true">
      <svg viewBox="0 0 220 160" fill="none" focusable="false"><path className="ih73-art-guide" d="M12 132H208M44 16V148M176 12V148" /><path className="ih73-art-frame" d="M60 28H160V128H60Z" /><path className="ih73-art-fold" d="M60 96H128V28M92 128V60H160" /><rect className="ih73-art-square" x="112" y="80" width="48" height="48" /><rect className="ih73-art-dot" x="39" y="127" width="10" height="10" /><path className="ih73-art-arrow" d="M151 45H183V77M183 45L139 89" /></svg>
    </div>
    {children}
  </header>;
}

export function SubpageMetrics({ items }) {
  return <dl className="ih73-page-metrics">{items.map(item => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl>;
}

export function SubpageCatalogTabs({ active }) {
  const en = useSitePreferences().language === 'en';
  return <nav className="ih73-catalog-tabs" aria-label={en ? 'Explore IdeaHire' : 'Przeglądaj IdeaHire'}>
    {[['jobs', '/jobs', en ? 'Jobs' : 'Zlecenia'], ['people', '/freelancers', en ? 'Freelancers' : 'Freelancerzy'], ['services', '/services', en ? 'Services' : 'Usługi']].map(([key, to, label]) => <Link key={key} to={to} aria-current={active === key ? 'page' : undefined}>{label}<ArrowUpRight size={15} strokeWidth={1.6} aria-hidden="true" /></Link>)}
  </nav>;
}
