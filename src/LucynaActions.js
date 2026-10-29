import { containsPrivateInput, LUCYNA_UUID } from './LucynaCore';

export const LUCYNA_TARGETS = Object.freeze({
  work: { to: '/work', label: 'Otwórz współprace' },
  messages: { to: '/messages', label: 'Otwórz wiadomości' },
  jobs: { to: '/jobs', label: 'Przeglądaj zlecenia' },
  freelancers: { to: '/freelancers', label: 'Przeglądaj wykonawców' },
  services: { to: '/services', label: 'Przeglądaj usługi' },
  calendar: { to: '/calendar', label: 'Otwórz kalendarz' },
  profile: { to: '/account#account-profile-data', label: 'Uzupełnij profil' },
  portfolio: { to: '/account#account-portfolio', label: 'Otwórz portfolio' },
  settings: { to: '/account#account-preferences', label: 'Otwórz ustawienia' },
  my_jobs: { to: '/account#account-jobs', label: 'Otwórz moje zlecenia' },
  my_services: { to: '/services/mine', label: 'Otwórz moje usługi' },
});
export const LUCYNA_JOB_CATEGORIES = Object.freeze([
  'Strony, aplikacje i IT', 'Grafika, UX i 3D', 'Marketing i sprzedaż',
  'Teksty i tłumaczenia', 'Wideo, animacja i audio', 'Fotografia i obróbka zdjęć',
  'AI i automatyzacje', 'Dane, analizy i research', 'Biznes i e-commerce', 'Architektura, wnętrza i CAD',
]);
const text = (value, limit) => typeof value === 'string' && value.length <= limit && !containsPrivateInput(value) ? value.trim() : null;
const validDate = value => value === '' || typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
  && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;

export function lucynaFee(amount) {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 1 || amount > 10000) return null;
  const cents = Math.round(amount * 100);
  const fee = Math.max(2000, Math.min(22900, Math.floor((cents * 550 + 5000) / 10000)));
  return { kind: 'fee', amount: cents / 100, fee: fee / 100, total: (cents + fee) / 100, currency: 'PLN' };
}
export function normalizeLucynaAction(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  if (value.kind === 'navigation') return Object.hasOwn(LUCYNA_TARGETS, value.target) ? { kind: 'navigation', target: value.target } : null;
  if (value.kind === 'fee') return lucynaFee(value.amount);
  if (value.kind !== 'job_draft' || !value.draft || typeof value.draft !== 'object') return null;
  const d = value.draft;
  const title = text(d.title, 120), description = text(d.description, 4000), expected_outcome = text(d.expected_outcome, 1000);
  if (!title || !description || expected_outcome === null || !LUCYNA_JOB_CATEGORIES.includes(d.category)
    || !validDate(d.project_deadline) || !(d.budget === null || typeof d.budget === 'number' && Number.isFinite(d.budget) && d.budget >= 1 && d.budget <= 10000)) return null;
  return { kind: 'job_draft', draft: { title, description, expected_outcome, category: d.category,
    budget: d.budget, budget_negotiable: d.budget === null || d.budget_negotiable === true, project_deadline: d.project_deadline } };
}

// A one-use handoff stays in this tab's memory; no conversation goes into a URL
// or device storage when moving from the small assistant to its own page.
let handoff = null;
export function handOffLucyna(userId, thread, draft = '') {
  if (!LUCYNA_UUID.test(userId || '') || !LUCYNA_UUID.test(thread?.id || '')) return;
  handoff = { userId, thread, draft: String(draft).slice(0, 6000), expires: Date.now() + 60000 };
}
export function takeLucynaHandoff(userId) {
  if (!handoff || handoff.expires < Date.now() || handoff.userId !== userId) return null;
  return handoff;
}
export function consumeLucynaHandoff(userId, threadId) {
  if (handoff?.userId === userId && handoff?.thread.id === threadId) handoff = null;
}
