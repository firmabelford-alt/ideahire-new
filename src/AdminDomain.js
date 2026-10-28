export function adminQueueSearch(item, query) {
  const needle = String(query || '').trim().toLocaleLowerCase('pl');
  return !needle || [item.title, item.subtitle, item.number, item.search].some(value => String(value || '').toLocaleLowerCase('pl').includes(needle));
}

export function orderAdminRequests(rows, now = Date.now()) {
  const closed = new Set(['completed', 'partially_completed', 'rejected', 'withdrawn']);
  const rank = row => closed.has(row.status) || row.requester_closed_at ? 3 : !row.assigned_admin_id ? 1 : 2;
  const deadline = row => { const value = Date.parse(row.extended_due_at || row.due_at); return Number.isFinite(value) ? value : Infinity; };
  return [...rows].sort((a, b) => {
    const ar = deadline(a) < now && rank(a) < 3 ? 0 : rank(a);
    const br = deadline(b) < now && rank(b) < 3 ? 0 : rank(b);
    return ar - br || deadline(a) - deadline(b) || String(a.id).localeCompare(String(b.id));
  });
}

export const ADMIN_ACTION_LABELS = {
  dispute_opened:'Otwarto spór', dispute_taken:'Przypisano spór', dispute_assigned:'Przypisano opiekuna',
  dispute_message_added:'Dodano komunikat do sprawy', dispute_decision_issued:'Wydano decyzję', dispute_appeal_response_added:'Odpowiedziano na odwołanie',
  admin_granted:'Nadano uprawnienia administratora', admin_revoked:'Odebrano uprawnienia administratora',
  moderation_restriction_imposed:'Nałożono ograniczenie konta', moderation_restriction_lifted:'Zdjęto ograniczenie konta', moderation_restriction_updated:'Zmieniono ograniczenie',
  moderation_appeal_accepted:'Uwzględniono odwołanie', moderation_appeal_rejected:'Utrzymano decyzję po odwołaniu',
  job_moderation_opened:'Otwarto moderację ogłoszenia', listing_hidden:'Ukryto ogłoszenie', listing_restored:'Przywrócono ogłoszenie', listing_appeal_resolved:'Rozpatrzono odwołanie do ogłoszenia',
  content_report_review_started:'Rozpoczęto analizę zgłoszenia', content_report_resolved_no_action:'Zakończono zgłoszenie bez sankcji',
  privacy_request_taken:'Przejęto wniosek RODO', privacy_request_updated:'Zmieniono status wniosku RODO', privacy_request_extended:'Przedłużono termin odpowiedzi',
  privacy_audit_report_saved:'Zapisano analizę ochrony danych', privacy_audit_submitted:'Przekazano analizę do zatwierdzenia', privacy_audit_approved:'Zatwierdzono raport',
  erasure_case_prepared:'Przygotowano usunięcie danych', erasure_case_authorized:'Zatwierdzono operację usunięcia', erasure_case_executed:'Wykonano operację usunięcia',
};
export function adminActionLabel(value) { return ADMIN_ACTION_LABELS[value] || 'Zapisano działanie administracyjne'; }

export function adminReturnTarget() { return '/account'; }

export function listingDecisionProblem({ reason, termsReference }) {
  if (String(reason || '').trim().length < 50) return 'Opisz konkretne fakty i uzasadnienie w co najmniej 50 znakach.';
  if (String(termsReference || '').trim().length < 10) return 'Wskaż konkretną zasadę regulaminu, która ma zastosowanie do tej treści.';
  return '';
}

export function adminPrivacyFilter(row, filter, userId, now = Date.now()) {
  const open = !row.requester_closed_at && !['completed','partially_completed','rejected','withdrawn'].includes(row.status);
  if (filter === 'all') return true;
  if (filter === 'requester_closed') return Boolean(row.requester_closed_at);
  if (filter === 'completed') return !open;
  if (filter === 'mine') return open && row.assigned_admin_id === userId;
  if (filter === 'unassigned') return open && !row.assigned_admin_id;
  if (filter === 'overdue') return open && Date.parse(row.extended_due_at || row.due_at) < now;
  return open;
}
