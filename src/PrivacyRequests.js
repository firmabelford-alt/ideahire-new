// Confirmed writes and history reads have independent lifetimes. No write is retried.
export const PRIVACY_REQUEST_FIELDS = 'id, request_number, request_type, requested_erasure_action, description, preferred_format, status, identity_status, submitted_at, due_at, extended_due_at, extension_reason, decision_summary, updated_at, completed_at, requester_closed_at, withdrawn_at';

export function privacyDraftProblem(form, canCloseAccount) {
  const length = form.description.trim().length;
  if (length < 20 || length > 5000) return { field: 'privacy-description', text: 'Opisz swoją sprawę w 20–5000 znakach. Napisz, jakich danych lub działań dotyczy wniosek.' };
  if (form.requestType === 'erasure' && !['minimize_data', 'close_account'].includes(form.requestedErasureAction)) return { field: 'privacy-erasure-options', text: 'Wybierz usunięcie możliwych danych albo zamknięcie konta.' };
  if (form.requestType === 'erasure' && form.requestedErasureAction === 'close_account' && !canCloseAccount) return { field: 'privacy-erasure-options', text: 'Zamknięcie konta wymaga zakończenia wskazanych spraw. Możesz też wybrać usunięcie możliwych danych.' };
  return null;
}

export function privacyCall(start, { signal, timeoutMs = 12000 } = {}) {
  const controller = new AbortController();
  let timer, onAbort;
  const boundary = new Promise((_, reject) => {
    onAbort = () => { controller.abort(); reject(Object.assign(new Error('Cancelled'), { name: 'AbortError' })); };
    if (signal?.aborted) { onAbort(); return; }
    signal?.addEventListener('abort', onAbort, { once: true });
    timer = setTimeout(() => {
      controller.abort();
      reject(Object.assign(new Error('Przekroczono czas oczekiwania na odpowiedź.'), { name: 'PrivacyTimeoutError', uncertain: true }));
    }, timeoutMs);
  });
  // Promise.race also bounds clients/transports that do not settle after abort().
  return Promise.race([boundary, Promise.resolve().then(() => {
    if (controller.signal.aborted) throw Object.assign(new Error('Cancelled'), { name: 'AbortError' });
    return start(controller.signal);
  })]).finally(() => { clearTimeout(timer); signal?.removeEventListener('abort', onAbort); });
}

export function createPrivacyController({ client, ownerId, onChange, readTimeoutMs = 12000, writeTimeoutMs = 20000 }) {
  let active = true, locked = false, revision = 0, readController, writeController;
  let currentRequests = [];
  const emit = patch => { if (active) onChange(patch); };
  const invalidateRead = () => { revision += 1; readController?.abort(); };
  const read = (start, signal) => privacyCall(start, { signal, timeoutMs: readTimeoutMs });

  async function refresh({ initial = false } = {}) {
    if (!active || !ownerId) return;
    invalidateRead();
    const version = revision;
    readController = new AbortController();
    const signal = readController.signal;
    const current = () => active && version === revision;
    emit({ historyRefreshing: true, ...(initial ? { loading: true } : {}) });
    try {
      const result = await read(signal => client.from('ideahire_privacy_requests').select(PRIVACY_REQUEST_FIELDS).eq('requester_user_id', ownerId).order('submitted_at', { ascending: false }).abortSignal(signal), signal);
      if (result.error) throw result.error;
      if (!current()) return;
      currentRequests = result.data || [];
      emit({ requests: currentRequests, loading: false, historyError: '' });
      if (!currentRequests.length) { emit({ eventsByRequest: {}, reportsByRequest: {} }); return; }
      const ids = currentRequests.map(row => row.id);
      const [events, reports] = await Promise.allSettled([
        read(signal => client.from('ideahire_privacy_request_events').select('id, request_id, actor_role, event_type, message, created_at').in('request_id', ids).order('created_at', { ascending: true }).abortSignal(signal), signal),
        read(signal => client.rpc('get_my_ideahire_privacy_audits').abortSignal(signal), signal),
      ]);
      if (!current()) return;
      const failed = result => result.status === 'rejected' || result.value.error;
      if (!failed(events)) emit({ eventsByRequest: (events.value.data || []).reduce((all, event) => { (all[event.request_id] ||= []).push(event); return all; }, {}) });
      if (!failed(reports)) emit({ reportsByRequest: Object.fromEntries((Array.isArray(reports.value.data) ? reports.value.data : []).map(report => [report.request_id, report])) });
      if (failed(events) || failed(reports)) emit({ historyError: 'Wnioski są dostępne, ale nie udało się odświeżyć całej historii lub raportów. Spróbuj ponownie.' });
    } catch (error) {
      if (current() && error.name !== 'AbortError') emit({ historyError: 'Nie udało się odświeżyć wniosków. Jeśli przed chwilą wysłano wniosek, nie wysyłaj go ponownie — najpierw odśwież historię.' });
    } finally {
      if (current()) emit({ loading: false, historyRefreshing: false });
    }
  }

  async function mutate({ key, scope = 'form', rpc, args, success, failure, updateRequest }) {
    if (!active || locked) return { ok: false, ignored: true };
    locked = true;
    writeController = new AbortController();
    emit({ busy: key, action: { scope, notice: null } });
    let refreshNeeded = false;
    try {
      const result = await privacyCall(signal => client.rpc(rpc, args).abortSignal(signal), { signal: writeController.signal, timeoutMs: writeTimeoutMs });
      if (result.error) throw result.error;
      if (!active) return { ok: false, ignored: true };
      invalidateRead();
      if (updateRequest) {
        currentRequests = currentRequests.map(updateRequest);
        emit({ requests: currentRequests });
      }
      emit({ action: { scope, notice: { tone: 'success', text: success } } });
      refreshNeeded = true;
      return { ok: true, data: result.data };
    } catch (error) {
      if (!active) return { ok: false, ignored: true };
      const uncertain = Boolean(error.uncertain || !error.code || error.name === 'AbortError');
      const text = uncertain
        ? 'Nie otrzymaliśmy potwierdzenia z serwera. Operacja mogła zostać zapisana. Sprawdź historię przed ponowieniem; Twoja treść pozostaje w formularzu.'
        : (error.message || failure);
      emit({ action: { scope, notice: { tone: 'error', text, uncertain } } });
      refreshNeeded = uncertain;
      return { ok: false, uncertain };
    } finally {
      locked = false;
      emit({ busy: '' });
      // Do not await refresh: a successful write must never wait for a history read.
      if (active && refreshNeeded) void refresh();
    }
  }

  return { ownerId, refresh, mutate, clearNotice(scope = 'form') { emit({ action: { scope, notice: null } }); }, dispose() { active = false; invalidateRead(); writeController?.abort(); } };
}
