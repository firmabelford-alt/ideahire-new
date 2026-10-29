import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, Check, Plus, RefreshCw, ChevronDown } from 'lucide-react';
import { createPrivacyController } from './PrivacyRequests';
import './PrivacyDesk.css';

const emptyState = ownerId => ({ ownerId, requests: [], eventsByRequest: {}, reportsByRequest: {}, loading: true, busy: '', historyRefreshing: false, historyError: '', notices: {} });
export function usePrivacyRequests(client, ownerId) {
  const [state, setState] = useState(() => emptyState(ownerId));
  const ref = useRef(null);
  useEffect(() => {
    setState(emptyState(ownerId));
    if (!ownerId) return;
    const controller = createPrivacyController({ client, ownerId, onChange(patch) {
      setState(current => {
        if (current.ownerId !== ownerId) return current;
        const { action, ...rest } = patch;
        return { ...current, ...rest, ...(action ? { notices: { ...current.notices, [action.scope]: action.notice } } : {}) };
      });
    } });
    ref.current = controller;
    void controller.refresh({ initial: true });
    let timer;
    const schedule = () => { clearTimeout(timer); timer = setTimeout(() => void controller.refresh(), 250); };
    const channel = client.channel(`privacy-center-live-${ownerId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ideahire_privacy_requests', filter: `requester_user_id=eq.${ownerId}` }, schedule)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ideahire_privacy_request_events' }, schedule)
      .subscribe();
    return () => { clearTimeout(timer); controller.dispose(); client.removeChannel(channel); if (ref.current === controller) ref.current = null; };
  }, [client, ownerId]);
  const refresh = useCallback(() => ref.current?.ownerId === ownerId ? ref.current.refresh() : Promise.resolve(), [ownerId]);
  const mutate = useCallback(options => ref.current?.ownerId === ownerId ? ref.current.mutate(options) : Promise.resolve({ ok: false, ignored: true }), [ownerId]);
  const clearNotice = useCallback(scope => { if (ref.current?.ownerId === ownerId) ref.current.clearNotice(scope); }, [ownerId]);
  return { ...(state.ownerId === ownerId ? state : emptyState(ownerId)), refresh, mutate, clearNotice };
}

export function PrivacyFeedback({ notice }) {
  if (!notice) return null;
  return <div className={`ih-privacy-feedback is-${notice.tone}`} role={notice.tone === 'error' ? 'alert' : 'status'}><span aria-hidden="true">{notice.tone === 'success' ? <Check size={19} /> : '!'}</span><p>{notice.text}</p></div>;
}

export function PrivacyReceipt({ request, number, type, onNew }) {
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, [request.id]);
  const deadline = new Date(request.extended_due_at || request.due_at || '');
  const validDeadline = Number.isFinite(deadline.getTime());
  return <section className="ih-privacy-receipt" tabIndex={-1} ref={ref} aria-labelledby="privacy-receipt-title">
    <span className="ih-privacy-receipt-mark"><Check size={28} aria-hidden="true" /></span>
    <p className="ih-privacy-eyebrow">{number || 'Potwierdzenie wysłania'}</p>
    <h2 id="privacy-receipt-title">Wniosek został wysłany</h2>
    <strong>{type}</strong>
    <p>Otrzymaliśmy Twój wniosek. Status, termin i odpowiedź znajdziesz w sekcji „Twoje wnioski”.</p>
    {validDeadline && <p className="ih-privacy-receipt-deadline">Termin odpowiedzi: <strong>{new Intl.DateTimeFormat('pl-PL',{dateStyle:'long',timeZone:'Europe/Warsaw'}).format(deadline)}</strong></p>}
    <div className="ih-privacy-receipt-actions"><a className="privacy-primary-button" href={number ? `#privacy-request-${request.id}` : '#privacy-history'}>Zobacz wniosek<ArrowDown size={18} aria-hidden="true" /></a><button className="privacy-secondary-button" type="button" onClick={onNew}><Plus size={18} aria-hidden="true" />Złóż kolejny wniosek</button></div>
  </section>;
}

export function PrivacyHistoryNotice({ error, refreshing, onRefresh }) {
  return <div className={'ih-privacy-history-notice' + (error ? ' has-error' : '')}>
    {error && <p role="status">{error}</p>}
    <button type="button" className="privacy-secondary-button" onClick={onRefresh} disabled={refreshing}><RefreshCw size={17} aria-hidden="true" />{refreshing ? 'Odświeżanie…' : 'Odśwież statusy'}</button>
  </div>;
}

export function PrivacyGuide() {
  return <aside className="privacy-rights-card">
    <h2>Warto wiedzieć</h2>
    <details className="ih-privacy-guide"><summary>Jak obsługujemy wniosek?<ChevronDown size={17} aria-hidden="true"/></summary>
      <ol className="ih-privacy-next-steps"><li><strong>Potwierdzenie wysłania</strong><span>Wniosek otrzyma własny numer.</span></li><li><strong>Status i termin</strong><span>Sprawdzisz je w sekcji „Twoje wnioski”.</span></li><li><strong>Odpowiedź administracji</strong><span>Odczytasz ją w tej samej sprawie. Możesz tam również odpisać.</span></li></ol>
    </details>
    <details className="ih-privacy-guide ih-privacy-rights"><summary>Jakie masz prawa?<ChevronDown size={17} aria-hidden="true"/></summary>
      <ul><li><strong>Dostęp i kopia</strong><span>Informacja o przetwarzaniu i kopia danych.</span></li><li><strong>Sprostowanie</strong><span>Poprawienie nieprawidłowych lub nieaktualnych danych.</span></li><li><strong>Usunięcie</strong><span>Usunięcie danych, gdy zachodzą właściwe podstawy.</span></li><li><strong>Ograniczenie i sprzeciw</strong><span>Ich zakres zależy od okoliczności i podstawy przetwarzania.</span></li><li><strong>Przenoszenie</strong><span>Dane objęte tym prawem w ustrukturyzowanym formacie.</span></li></ul>
    </details>
    <p className="ih-privacy-contact">Odpowiadamy co do zasady w ciągu miesiąca. O uzasadnionym przedłużeniu i jego przyczynie poinformujemy w terminie przewidzianym prawem.</p>
    <a href="/polityka-prywatnosci">Polityka prywatności</a><p className="ih-privacy-contact">Kontakt w sprawie danych<a href="mailto:ideahireprywatnosc@gmail.com">ideahireprywatnosc@gmail.com</a></p>
  </aside>;
}
