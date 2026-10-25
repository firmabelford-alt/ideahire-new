/* One conversation surface; project actions keep their existing permissions. */
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSitePreferences } from './Preferences';
import { supabase } from './supabase';
import { SubpageHeading } from './Subpages';
import { WorkspaceSheet, WorkspaceDisplaySettings } from './WorkspaceFlow';
import { WorkspaceAvatar, WorkspaceConversationRows, WorkspaceIcon, WorkspaceLoading, useWorkspaceCopy } from './Workspace';
export function WorkspaceInbox({
  user, conversations = [], visibleConversations = [], loading, errorMessage,
  search, setSearch, inboxFilter, setInboxFilter, unreadCount,
}) {
  const t = useWorkspaceCopy();
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearch(params.get('q') || '');
    setInboxFilter(params.get('unread') === '1' ? 'unread' : 'all');
  }, [location.search, setSearch, setInboxFilter]);
  function update(key, value) {
    const params = new URLSearchParams(location.search);
    if (value) params.set(key, value); else params.delete(key);
    if (key === 'q') setSearch(value); else setInboxFilter(value === '1' ? 'unread' : 'all');
    navigate({ pathname: '/messages', search: params.toString() ? '?' + params : '' }, { replace: true, state: {} });
  }
  function reset() {
    setSearch('');
    setInboxFilter('all');
    navigate('/messages', { replace: true });
  }
  return <main className="ih68-page ih72-inbox" id="ih68-content">
    <SubpageHeading title={t('Wiadomości', 'Messages')} actions={<Link to="/freelancers" className="ih72-new-conversation"><WorkspaceIcon kind="plus" /><span>{t('Nowa rozmowa', 'New conversation')}</span></Link>} />
    <div className="ih79-inbox-layout ih-inbox-single"><div className="ih79-inbox-list">
    <div className="ih72-list-toolbar">
      <div className="ih72-filters" role="group" aria-label={t('Filtr rozmów', 'Conversation filter')}>
        <button type="button" aria-pressed={inboxFilter === 'all'} onClick={() => update('unread', '')}>{t('Wszystkie', 'All')}{!loading && <span>{conversations.length}</span>}</button>
        <button type="button" aria-pressed={inboxFilter === 'unread'} onClick={() => update('unread', '1')}>{t('Nieprzeczytane', 'Unread')}{unreadCount > 0 && <span>{unreadCount}</span>}</button>
      </div>
      <label className="ih72-search"><span className="ih68-sr-only">{t('Szukaj osoby, projektu lub wiadomości', 'Search people, projects or messages')}</span><WorkspaceIcon kind="search" /><input type="search" maxLength={160} value={search} onChange={event => update('q', event.target.value)} placeholder={t('Szukaj w rozmowach', 'Search conversations')} />{search && <button type="button" aria-label={t('Wyczyść wyszukiwanie', 'Clear search')} onClick={() => update('q', '')}><WorkspaceIcon kind="close" /></button>}</label>
    </div>
    <section className="ih72-inbox-content" aria-label={t('Lista rozmów', 'Conversation list')}>
      {loading ? <WorkspaceLoading /> : errorMessage ? <p className="ih68-feedback" role="alert">{errorMessage}</p> : visibleConversations.length ?
        <WorkspaceConversationRows conversations={visibleConversations} user={user} loading={loading} /> :
        <div className="ih79-empty"><h2>{conversations.length ? t('Brak pasujących rozmów', 'No matching conversations') : t('Brak rozmów', 'No conversations')}</h2><p>{conversations.length ? t('Zmień wyszukiwanie lub pokaż wszystkie rozmowy.', 'Change your search or show all conversations.') : t('Znajdź wykonawcę albo odpowiedz na zlecenie. Wiadomości znajdziesz tutaj.', 'Find a freelancer or reply to a job. Your messages will appear here.')}</p>{conversations.length ? <button type="button" className="ih68-secondary" onClick={reset}>{t('Pokaż wszystkie', 'Show all')}</button> : <Link to="/freelancers" className="ih68-primary">{t('Znajdź wykonawcę', 'Find a freelancer')}<WorkspaceIcon kind="arrow" /></Link>}</div>}
    </section>
    </div></div>
  </main>;
}

export function WorkspaceThread({
  messages,
  user,
  otherName,
  lastReadOwnMessageId,
  renderContent,
  onReport,
  viewportRef,
  onScroll,
  showLatest,
  onLatest
}) {
  const t = useWorkspaceCopy();
  const en = useSitePreferences().language === 'en';
  const optionsRoot = useRef(null);
  const scrollCallback = useRef(onScroll);
  scrollCallback.current = onScroll;
  useEffect(() => {
    const pageScroll = () => {
      const room = optionsRoot.current?.closest('.ih-message-workspace');
      if (!room || room.classList.contains('is-focus') || !window.matchMedia('(min-width:851px)').matches) return;
      if (room.dataset.view === 'conversation' && document.scrollingElement) {
        scrollCallback.current?.({ currentTarget: document.scrollingElement });
      }
    };
    window.addEventListener('scroll', pageScroll, { passive: true });
    return () => window.removeEventListener('scroll', pageScroll);
  }, []);
  useEffect(() => {
    const close = event => {
      optionsRoot.current?.querySelectorAll('.ih68-message-options[open]').forEach(details => {
        if (event.type === 'keydown' && event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          details.removeAttribute('open');
          details.querySelector('summary')?.focus();
        } else if (event.type === 'pointerdown' && !details.contains(event.target)) details.removeAttribute('open');
      });
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close, true);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close, true);
    };
  }, []);
  return <div ref={optionsRoot} className="ih68-thread-wrap"><div ref={viewportRef} className="ih68-thread" role="log" aria-label={t('Historia rozmowy', 'Conversation history')} aria-live="polite" aria-relevant="additions text" onScroll={onScroll} tabIndex={0}>
    {!messages.length ? <div className="ih68-thread-empty"><WorkspaceIcon kind="message" /><h2>{t('Napisz pierwszą wiadomość.', 'Write the first message.')}</h2><p>{t('Zapytaj o termin lub opisz, co jest do zrobienia.', 'Ask about availability or describe the work.')}</p></div> : <div className="ih68-thread-inner">{messages.map((message, index) => {
          const own = message.sender_id === user?.id;
          const admin = message.sender_role === 'admin';
          const authorName = admin ? t('Administrator IdeaHire', 'IdeaHire administrator') : otherName;
          const previous = messages[index - 1];
          const day = !previous || new Date(previous.created_at).toDateString() !== new Date(message.created_at).toDateString();
          const followup = !day && previous.sender_id === message.sender_id && new Date(message.created_at) - new Date(previous.created_at) < 300000;
          return <React.Fragment key={message.id}>{day && <div className="ih68-day"><time dateTime={message.created_at}>{new Date(message.created_at).toLocaleDateString(en ? 'en-GB' : 'pl-PL', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}</time></div>}
        <article className={'ih68-message' + (own ? ' is-own' : ' is-received') + (followup ? ' is-followup' : '')} aria-label={admin ? authorName : own ? t('Twoja wiadomość', 'Your message') : otherName}>
          {!own && !followup && <strong className="ih69-message-author">{authorName}</strong>}
          <div className="ih68-message-content">{renderContent(message)}</div>
          <footer className="ih69-message-meta"><time dateTime={message.created_at}>{new Date(message.created_at).toLocaleTimeString(en ? 'en-GB' : 'pl-PL', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</time>{message.id === lastReadOwnMessageId && <span className="ih68-read-receipt"><WorkspaceIcon kind="check" />{t('Wyświetlono', 'Seen')}</span>}{!own && message.moderation_status !== 'hidden' && <details className="ih68-message-options"><summary aria-label={t('Opcje wiadomości', 'Message options')}><WorkspaceIcon kind="more" /></summary><button type="button" onClick={e => {
                    e.currentTarget.closest('details')?.removeAttribute('open');
                    onReport(message.id);
                  }}>{t('Zgłoś wiadomość', 'Report message')}</button></details>}</footer>
        </article>
      </React.Fragment>;
        })}</div>}
  </div>{showLatest && <button type="button" className="ih68-latest" onClick={onLatest}><WorkspaceIcon kind="down" />{t('Najnowsze wiadomości', 'Latest messages')}</button>}</div>;
}
function fitWorkspaceDraft(field) {
  if (!field || !field.getClientRects().length) return;
  const style = getComputedStyle(field);
  const minimum = parseFloat(style.minHeight) || 40;
  const maximum = parseFloat(style.maxHeight) || 136;
  field.style.setProperty('height', 'auto', 'important');
  const needed = field.value ? field.scrollHeight : minimum;
  field.style.setProperty('height', Math.min(Math.max(needed, minimum), maximum) + 'px', 'important');
  field.style.setProperty('overflow-y', needed > maximum ? 'auto' : 'hidden', 'important');
}
function SendPanelIcon({ add = false, photo = false }) {
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{photo ? <><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8" cy="8" r="1.5" /><path d="m4 17 5-5 4 4 3-3 5 5" /></> : <path d={add ? 'M12 5v14M5 12h14' : 'M4 12h15m-6-6 6 6-6 6'} />}</svg>;
}
export function WorkspaceComposer({ draft, setDraft, sending, blocked, composerRef, onSubmit, onMaterials, onPhotos, materialsDisabled = false, errorMessage, blockedByMe, profileId, recipientName }) {
  const t = useWorkspaceCopy(), areaRef = useRef(null);
  useLayoutEffect(() => { fitWorkspaceDraft(composerRef.current); }, [draft, composerRef, blocked]);
  useEffect(() => {
    const field = composerRef.current;
    if (!field) return;
    let task = 0;
    const fit = () => { cancelAnimationFrame(task); task = requestAnimationFrame(() => fitWorkspaceDraft(field)); };
    const observer = window.ResizeObserver ? new ResizeObserver(fit) : null;
    observer?.observe(field.parentElement);
    window.addEventListener('resize', fit); window.visualViewport?.addEventListener('resize', fit);
    return () => { cancelAnimationFrame(task); observer?.disconnect(); window.removeEventListener('resize', fit); window.visualViewport?.removeEventListener('resize', fit); };
  }, [composerRef, blocked]);
  useLayoutEffect(() => {
    const dock = document.getElementById('ih64-lucyna');
    if (!dock) return;
    const before = dock.style.getPropertyValue('--ih84-safe-bottom'), priority = dock.style.getPropertyPriority('--ih84-safe-bottom');
    let previous;
    const restore = () => { if (before) dock.style.setProperty('--ih84-safe-bottom', before, priority); else dock.style.removeProperty('--ih84-safe-bottom'); };
    const reserve = () => {
      const area = areaRef.current;
      const height = area?.getClientRects().length && window.matchMedia('(max-width:850px)').matches ? Math.ceil(area.getBoundingClientRect().height) + 8 : null;
      if (height === previous) return;
      previous = height;
      if (height === null) restore(); else dock.style.setProperty('--ih84-safe-bottom', height + 'px');
      window.dispatchEvent(new Event('resize'));
    };
    const observer = window.ResizeObserver ? new ResizeObserver(reserve) : null;
    if (areaRef.current) observer?.observe(areaRef.current);
    window.addEventListener('resize', reserve); reserve();
    return () => { observer?.disconnect(); window.removeEventListener('resize', reserve); restore(); window.dispatchEvent(new Event('resize')); };
  }, [blocked]);
  return <div className="ih-send-area" ref={areaRef}>
    {errorMessage && <p className="ih-send-error" role="alert">{errorMessage}</p>}
    {blocked ? <p className="ih-send-blocked"><WorkspaceIcon kind="lock" /><span>{blockedByMe ? t('Rozmowa jest zablokowana. Możesz odblokować osobę na jej profilu.', 'This conversation is blocked. You can unblock the person on their profile.') : t('Wysyłanie wiadomości jest wyłączone.', 'Sending messages is disabled.')}{blockedByMe && <Link to={'/profile/' + profileId}>{t('Otwórz profil', 'Open profile')}</Link>}</span></p> : <>
      <form className="ih-send-form ih-send-row" onSubmit={onSubmit} aria-busy={sending}>
        <button type="button" className="ih-send-add" onClick={onMaterials} disabled={sending || materialsDisabled} aria-label={t('Dodaj materiały do rozmowy', 'Add conversation materials')} title={t('Plik, link lub tekst', 'File, link or text')}><SendPanelIcon add /></button>
        <label htmlFor="ih68-message-draft" className="ih-send-sr">{t('Wiadomość do: ', 'Message to: ') + recipientName}</label>
        <textarea id="ih68-message-draft" ref={composerRef} rows={1} value={draft} maxLength={4000} aria-describedby="ih-send-help" placeholder={t('Napisz wiadomość…', 'Write a message…')} disabled={sending}
          onChange={event => setDraft(event.target.value)} onKeyDown={event => {
            if (event.isComposing || event.nativeEvent?.isComposing) return;
            if (event.key === 'Enter' && !event.shiftKey && !window.matchMedia?.('(pointer: coarse)').matches) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); }
          }} />
        <button type="button" className="ih-send-photo" onClick={onPhotos} disabled={sending || materialsDisabled} aria-label={t('Wybierz zdjęcia', 'Choose photos')} title={t('Wybierz zdjęcia', 'Choose photos')}><SendPanelIcon photo /></button>
        <button type="submit" className="ih-send-submit" disabled={sending || !draft.trim()} aria-label={sending ? t('Wysyłanie wiadomości', 'Sending message') : t('Wyślij wiadomość', 'Send message')}><span>{sending ? t('Wysyłanie…', 'Sending…') : t('Wyślij', 'Send')}</span><SendPanelIcon /></button>
      </form><p id="ih-send-help" className="ih-send-sr">{t('Na komputerze Enter wysyła. Shift + Enter dodaje linię.', 'On desktop, Enter sends. Shift + Enter adds a line.')}</p>
      {draft.length >= 3200 && <p className="ih-send-count">{draft.length.toLocaleString()} / 4 000</p>}
    </>}
  </div>;
}

function WorkspacePaymentReader({ payment, overview, onMaterials, onDispute }) {
  const t = useWorkspaceCopy();
  const { agreement, conversation, userId, blocked } = payment.props;
  const code = overview?.status || "";
  const isClient = conversation?.client_id === userId;
  const caseStatus = ["refund_pending", "refunded", "partially_refunded", "disputed"].includes(code);
  const workEnabled = ["funds_secured", "work_submitted", "release_pending", "release_failed", "released"].includes(code);
  const scope = [userId, conversation?.id, agreement?.id, agreement?.status].join(":");
  const currentScope = useRef(scope), preparingRef = useRef(false);
  const [preparing, setPreparing] = useState(false), [notice, setNotice] = useState("");
  currentScope.current = scope;
  useEffect(() => {
    preparingRef.current = false; setPreparing(false); setNotice("");
    return () => { currentScope.current = null; };
  }, [scope]);
  function refreshStatus() {
    window.dispatchEvent(new CustomEvent("ideahire:payment-updated", { detail: { conversationId: conversation?.id } }));
  }
  async function prepareAmounts() {
    if (!isClient || blocked || agreement?.status !== "accepted" || preparingRef.current
      || !conversation?.id || agreement?.conversation_id !== conversation.id) return;
    const requestedScope = scope;
    preparingRef.current = true; setPreparing(true); setNotice("");
    try {
      const { data: rows, error: readError } = await supabase.rpc("get_ideahire_payment_summary", { p_conversation_id: conversation.id });
      if (readError) throw readError;
      if (currentScope.current !== requestedScope) return;
      if (!Array.isArray(rows)) throw new Error(t("Nie potwierdzono stanu płatności.", "Payment state was not confirmed."));
      if (rows.length) {
        const row = rows[0];
        if (rows.length !== 1 || row.agreement_id !== agreement.id || row.client_id !== conversation.client_id || row.contractor_id !== conversation.contractor_id) {
          throw new Error(t("Podsumowanie nie odpowiada tym ustaleniom.", "The summary does not match these terms."));
        }
        refreshStatus(); return;
      }
      const { data, error } = await supabase.functions.invoke("create-checkout-session", { body: { agreement_id: agreement.id, action: "refresh_pricing" } });
      if (error || !data?.ok) {
        let reason = data?.error || "";
        try { reason = (await error?.context?.json?.())?.error || reason; } catch { /* Keep the available server message. */ }
        throw new Error(reason || error?.message || t("Nie udało się przygotować kwot.", "Could not prepare the amounts."));
      }
      if (currentScope.current === requestedScope) refreshStatus();
    } catch (error) {
      if (currentScope.current === requestedScope) setNotice(String(error?.message || t("Nie udało się przygotować podsumowania.", "Could not prepare the summary.")).slice(0, 500));
    } finally {
      if (currentScope.current === requestedScope) { preparingRef.current = false; setPreparing(false); }
    }
  }
  const explanations = {
    awaiting_payment: t("Wpłata nie została jeszcze potwierdzona. Klient może sprawdzić kwoty poniżej i przejść do płatności w Stripe.", "Payment has not been confirmed. The client can review the amounts below and continue to Stripe."),
    checkout_open: t("Otwarto płatność w Stripe. Samo otwarcie okna nie potwierdza zapłaty. Czekamy na aktualny status Stripe.", "Stripe checkout has been opened. Opening checkout does not confirm payment. We are waiting for Stripe's current status."),
    processing: t("Stripe sprawdza wpłatę. Nie ponawiaj teraz płatności; status zostanie zaktualizowany po potwierdzeniu.", "Stripe is checking the payment. Do not pay again now; the status will update after confirmation."),
    funds_secured: t("Stripe potwierdził wpłatę klienta. Można rozpocząć realizację. Wynagrodzenie nie zostało jeszcze przekazane na saldo wykonawcy.", "Stripe has confirmed the client's payment. Work can begin. Earnings have not yet been transferred to the freelancer's balance."),
    work_submitted: t("Praca czeka na odbiór. Klient sprawdza materiały i osobno potwierdza odbiór oraz przekazanie wynagrodzenia.", "The work is waiting for review. The client reviews the materials and explicitly confirms acceptance and the earnings transfer."),
    release_pending: t("Trwa przekazywanie wynagrodzenia na saldo Stripe wykonawcy. To jeszcze nie jest potwierdzenie wypłaty na bank.", "Earnings are being transferred to the freelancer's Stripe balance. This does not confirm a bank payout."),
    release_failed: t("Nie mamy potwierdzenia przekazania wynagrodzenia. Sprawdź status odbioru pracy i szczegóły rozliczenia przed ponowieniem operacji.", "The earnings transfer has not been confirmed. Check work acceptance and settlement details before retrying."),
    released: t("Wynagrodzenie przekazano na saldo Stripe wykonawcy. Wypłata z tego salda na rachunek bankowy ma osobny status.", "Earnings have been transferred to the freelancer's Stripe balance. A payout from that balance to a bank account has a separate status."),
    refund_pending: t("Sprawa jest na etapie rozliczenia zwrotu. Kwotę, termin i potwierdzenie operacji sprawdź w szczegółach sprawy.", "The case is at the refund settlement stage. Check the case details for the amount, timing and transaction confirmation."),
    partially_refunded: t("W rozliczeniu odnotowano częściowy zwrot. Zakres zwrotu i potwierdzenie Stripe są w szczegółach sprawy.", "A partial refund has been recorded. The refund scope and Stripe confirmation are available in the case details."),
    refunded: t("Płatność ma status zwróconej. Potwierdzenie i szczegóły zwrotu do metody płatności klienta sprawdź w sprawie.", "The payment is marked as refunded. Check the case for confirmation and details of the refund to the client's payment method."),
    disputed: t("Rozliczenie jest wstrzymane z powodu sporu. Aktualne decyzje, kwoty i dalsze działania są w szczegółach sprawy.", "Settlement is on hold due to a dispute. Current decisions, amounts and next steps are in the case details."),
    failed: t("Ostatnia próba płatności nie zakończyła się powodzeniem. Sprawdź aktualny status i kwoty przed kolejną próbą.", "The last payment attempt was unsuccessful. Check the current status and amounts before trying again."),
    cancelled: t("Ostatnie okno płatności zostało anulowane. Przed kolejną próbą sprawdź aktualne kwoty i status rozliczenia.", "The last checkout was cancelled. Review the current amounts and settlement status before trying again.")
  };
  const explanation = explanations[code] || t("Podsumowanie kwot nie jest jeszcze dostępne. Zleceniodawca może je przygotować przed przejściem do Stripe. Jeśli status jest niedostępny, najpierw odśwież dane.", "The amount summary is not available yet. The client can prepare it before continuing to Stripe. If the status is unavailable, refresh the data first.");
  const steps = [
    [t("Wpłata klienta", "Client payment"), t("Klient płaci w Stripe kwotę za usługę i opłatę IdeaHire. Realizacja zaczyna się po potwierdzeniu wpłaty.", "The client pays the service amount and IdeaHire fee in Stripe. Work begins after payment is confirmed.")],
    [t("Praca i odbiór", "Work and acceptance"), t("Wykonawca przekazuje rezultat w materiałach. Klient sprawdza pracę i potwierdza jej odbiór oraz przekazanie wynagrodzenia.", "The freelancer delivers the result in Materials. The client reviews and explicitly confirms acceptance and the earnings transfer.")],
    [t("Saldo Stripe wykonawcy", "Freelancer's Stripe balance"), t("Po potwierdzeniu przekazania środków wynagrodzenie trafia na saldo Stripe wykonawcy. Opłata IdeaHire jest wykazana osobno.", "Once the transfer is confirmed, earnings reach the freelancer's Stripe balance. The IdeaHire fee is listed separately.")],
    [t("Wypłata na rachunek bankowy", "Bank payout"), t("To osobny etap obsługiwany przez Stripe. Wykonawca sprawdza status i termin wypłaty w sekcji Wypłaty na swoim koncie.", "This is a separate stage handled by Stripe. The freelancer checks the payout status and date in the Payouts section of their account.")]
  ];
  return <section className="ih-payment-reader" data-payment-status={code || "unknown"}>
    <header className="ih-pay-heading"><div><h3>{t("Rozliczenie zlecenia", "Project settlement")}</h3><p>{t("Obsługa płatności:", "Payment processing:")} <span className="ih-pay-stripe">Stripe</span></p></div><span className={"ih-pay-status is-" + (overview?.tone || "neutral")} role="status">{overview?.label || t("Sprawdzanie statusu", "Checking status")}</span></header>
    <div className={"ih-pay-current is-" + (overview?.tone || "neutral")} aria-live="polite"><span className="ih-pay-state-dot" aria-hidden="true" /><div><strong>{t("Na jakim etapie są pieniądze?", "Where is the payment now?")}</strong><p>{explanation}</p></div></div>
    <div className="ih-pay-layout">
      <div className="ih-pay-amounts ih-pay-original">
        <h4>{t("Podsumowanie kwot", "Amount summary")}</h4>
        {payment}
        {!code && <div className="ih-pay-no-summary"><h4>{t("Kwoty przed zapłatą", "Amounts before payment")}</h4><p>{t("Tutaj zobaczysz cenę usługi, opłatę IdeaHire i łączną kwotę przed przejściem do Stripe.", "The service price, IdeaHire fee and total will appear here before you continue to Stripe.")}</p>{isClient && <><button type="button" className="chat-payment-button" onClick={prepareAmounts} disabled={preparing || blocked}>{preparing ? t("Przygotowywanie kwot…", "Preparing amounts…") : t("Przygotuj podsumowanie kwot", "Prepare amount summary")}</button><p className="ih-pay-note">{t("Ten krok przygotowuje podsumowanie. Płatność zatwierdzasz później w Stripe.", "This step prepares the summary. You confirm payment later in Stripe.")}</p></>}</div>}
      </div>
      <section className="ih-pay-flow" aria-labelledby="ih-pay-flow-title"><h4 id="ih-pay-flow-title">{t("Standardowy przebieg rozliczenia", "Standard settlement flow")}</h4>{caseStatus && <p className="ih-pay-note">{t("Poniżej standardowy przebieg. Dla tego zlecenia obowiązuje aktualny status sprawy podany powyżej.", "The standard flow is shown below. This project follows the current case status shown above.")}</p>}<ol>{steps.map(([title, detail], index) => <li key={title}><span className="ih-pay-step-number" aria-hidden="true">{index + 1}</span><div><strong>{title}</strong><p>{detail}</p></div></li>)}</ol><div className="ih-pay-auto-note"><strong>{t("Odbiór automatyczny", "Automatic acceptance")}</strong><p>{t("Dla prac objętych tą funkcją brak reakcji przez 10 dni od przekazania może uruchomić automatyczny odbiór i przekazanie wynagrodzenia. Otwarty spór wstrzymuje ten proces. Zasady i status odbioru znajdziesz przy przekazanej pracy.", "For eligible deliveries, no response within 10 days of submission can trigger automatic acceptance and an earnings transfer. An open dispute pauses this process. See the delivered work for acceptance rules and status.")}</p></div></section>
    </div>
    {notice && <p className="ih-pay-feedback" role="alert">{notice}</p>}
    <footer className="ih-pay-actions"><button type="button" onClick={refreshStatus} disabled={preparing}>{t("Odśwież status", "Refresh status")}</button>{workEnabled && <button type="button" onClick={onMaterials}>{t("Przejdź do materiałów", "Open materials")}</button>}{caseStatus && onDispute && <button type="button" onClick={onDispute}>{t("Szczegóły sprawy", "Case details")}</button>}{!isClient && code === "released" && <Link to="/account#account-payouts">{t("Sprawdź wypłaty na bank", "Check bank payouts")}</Link>}</footer>
  </section>;
}

export function WorkspaceConversation({
  loading,
  errorMessage,
  hasConversation,
  otherName,
  avatarUrl,
  profileId,
  blocked,
  jobTitle,
  category,
  materialCount,
  accepted,
  view,
  onView,
  focusMode,
  onFocusMode,
  onBack,
  backLabel,
  onHide,
  hiding,
  onDispute,
  canDispute,
  projectDetails,
  projectPlan,
  nextStep,
  thread,
  composer,
  materials,
  plan,
  payment,
  paymentOverview,
  disputePanel,
  reportDialog,
  projectAction
}) {
  const t = useWorkspaceCopy();
  const frameRef = useRef(null);
  const [optionsOpen, setOptionsOpen] = useState(false);
  useLayoutEffect(() => {
    let task = 0,
      scrollTask = 0;
    const viewport = window.visualViewport,
      element = frameRef.current;
    function measure() {
      task = 0;
      if (!element) return;
      if (!focusMode && window.matchMedia?.('(min-width:851px)').matches) {
        element.style.removeProperty('--ih68-room-height');
        element.style.removeProperty('top');
        element.classList.remove('is-keyboard');
        return;
      }
      const narrow = window.matchMedia?.('(max-width:850px)').matches,
        inset = focusMode ? narrow ? 0 : 16 : 0,
        top = focusMode || narrow ? inset : Math.max(0, element.getBoundingClientRect().top - (viewport?.offsetTop || 0)),
        bottom = focusMode ? inset : narrow ? 0 : 24,
        height = Math.max(160, Math.floor((viewport?.height || window.innerHeight) - top - bottom));
      const thread = element.querySelector('.ih68-thread');
      const atEnd = thread && thread.scrollHeight - thread.scrollTop - thread.clientHeight < 100;
      element.style.setProperty('--ih68-room-height', height + 'px');
      if (focusMode || narrow) element.style.setProperty('top', (viewport?.offsetTop || 0) + inset + 'px', 'important');else element.style.removeProperty('top');
      element.classList.toggle('is-keyboard', narrow && document.activeElement?.id === 'ih68-message-draft' && height < 460);
      if (atEnd) {
        cancelAnimationFrame(scrollTask);
        scrollTask = requestAnimationFrame(() => {
          thread.scrollTop = thread.scrollHeight;
        });
      }
    }
    const schedule = () => {
        if (!task) task = requestAnimationFrame(measure);
      },
      observer = window.ResizeObserver ? new ResizeObserver(schedule) : null,
      header = document.querySelector('.ih68-header');
    if (header) observer?.observe(header);
    window.addEventListener('resize', schedule);
    document.addEventListener('focusin', schedule);
    document.addEventListener('focusout', schedule);
    viewport?.addEventListener('resize', schedule);
    viewport?.addEventListener('scroll', schedule);
    schedule();
    return () => {
      observer?.disconnect();
      cancelAnimationFrame(task);
      cancelAnimationFrame(scrollTask);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('focusin', schedule);
      document.removeEventListener('focusout', schedule);
      viewport?.removeEventListener('resize', schedule);
      viewport?.removeEventListener('scroll', schedule);
    };
  }, [focusMode]);
  useEffect(() => {
    if (!focusMode) return;
    const frame = frameRef.current,
      header = document.querySelector('.ih68-header'),
      inert = header?.inert,
      before = document.activeElement,
      overflow = document.body.style.getPropertyValue('overflow'),
      priority = document.body.style.getPropertyPriority('overflow');
    if (header) header.inert = true;
    document.body.style.setProperty('overflow', 'hidden', 'important');
    const raf = requestAnimationFrame(() => frame?.querySelector('.ih68-focus-exit')?.focus({
      preventScroll: true
    }));
    function keyboard(e) {
      const dialog = e.target.closest?.('[role="dialog"]');
      if (e.defaultPrevented || dialog && dialog !== frame) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onFocusMode(false);
        return;
      }
      if (e.key !== 'Tab') return;
      const all = [...(frame?.querySelectorAll('a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),summary,[tabindex="0"]') || [])].filter(n => n.tabIndex >= 0 && !n.closest('[hidden],[inert]') && n.getClientRects().length > 0),
        first = all[0],
        last = all.at(-1);
      if (!first) return;
      if (e.shiftKey && (document.activeElement === first || !frame.contains(document.activeElement))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !frame.contains(document.activeElement))) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', keyboard);
    return () => {
      cancelAnimationFrame(raf);
      if (header) header.inert = !!inert;
      if (overflow) document.body.style.setProperty('overflow', overflow, priority);else document.body.style.removeProperty('overflow');
      document.removeEventListener('keydown', keyboard);
      const returnFocus = before?.isConnected && before !== document.body && before.getClientRects().length ? before : frame?.querySelector('#ih70-room-options');
      returnFocus?.focus?.({
        preventScroll: true
      });
    };
  }, [focusMode, onFocusMode]);
  const closeMenu = () => setOptionsOpen(false);
  const showPlan = view === 'plan';
  const closeContext = () => onView('conversation');
  return <>
    {focusMode && createPortal(<div className="ih68-focus-scrim" aria-hidden="true" />, document.body)}
    <main ref={frameRef} id="ih68-content" data-view={view}
      role={focusMode ? 'dialog' : undefined} aria-modal={focusMode ? true : undefined}
      aria-label={t('Rozmowa IdeaHire', 'IdeaHire conversation')}
      className={'ih68-room ih72-room ih-structured-room ih-message-workspace ih-chat-workspace' + (focusMode ? ' is-focus' : '')}>
      {loading ? <WorkspaceLoading /> : !hasConversation ?
        <section className="ih68-room-error"><h1>{t('Nie można otworzyć rozmowy', 'Unable to open this conversation')}</h1><p role="alert">{errorMessage}</p><button type="button" className="ih68-secondary" onClick={onBack}><WorkspaceIcon kind="back" />{backLabel}</button></section> : <>
        <header className="ih68-room-header">
          <button type="button" className="ih68-room-back ih68-icon-button" onClick={onBack} aria-label={t('Wróć: ', 'Back to: ') + backLabel}><WorkspaceIcon kind="back" /></button>
          <Link className="ih69-person-avatar" to={'/profile/' + profileId} aria-label={t('Profil: ', 'Profile: ') + otherName}><WorkspaceAvatar name={otherName} url={blocked ? null : avatarUrl} small /></Link>
          <div className="ih68-room-person"><Link to={'/profile/' + profileId}><h1>{blocked ? t('Zablokowany użytkownik', 'Blocked user') : otherName}</h1></Link><p className="ih72-room-context">{jobTitle || t('Zapytanie o współpracę', 'Project inquiry')}</p></div>
          <div className="ih68-room-header-tools">
            {focusMode && <button type="button" className="ih68-focus-exit ih68-icon-button" aria-label={t('Przywróć widok', 'Restore view')} onClick={() => onFocusMode(false)}><WorkspaceIcon kind="collapse" /></button>}
            <button type="button" id="ih70-room-options" className="ih68-icon-button" aria-haspopup="dialog" aria-expanded={optionsOpen} aria-label={t('Opcje rozmowy', 'Conversation options')} onClick={() => setOptionsOpen(true)}><WorkspaceIcon kind="more" /></button>
          </div>
        </header>
        <nav className="ih72-room-nav" aria-label={t('Rozmowa i współpraca', 'Conversation and project')}>
          <button type="button" aria-current={view === 'conversation' ? 'page' : undefined} aria-controls="ih69-conversation-panel" onClick={() => onView('conversation')}><WorkspaceIcon kind="message" /><span>{t('Rozmowa', 'Chat')}</span></button>
          <button type="button" aria-current={view === 'plan' ? 'page' : undefined} aria-controls="ih68-room-plan" onClick={() => onView('plan')}><WorkspaceIcon kind="jobs" /><span>{t('Ustalenia', 'Terms')}</span>{accepted && <WorkspaceIcon kind="check" className="ih72-terms-check" aria-label={t('Warunki zaakceptowane', 'Terms accepted')} aria-hidden="false" />}</button>
          <button type="button" aria-current={view === 'files' ? 'page' : undefined} aria-controls="ih68-room-files" onClick={() => onView('files')}><WorkspaceIcon kind="files" /><span>{t('Materiały', 'Materials')}</span>{materialCount > 0 && <small>{materialCount}</small>}</button>
          <button type="button" aria-current={view === 'payment' ? 'page' : undefined} aria-controls="ih68-room-payment" onClick={() => onView('payment')}><WorkspaceIcon kind="lock" /><span>{t('Płatność', 'Payment')}</span></button>
        <button type="button" className={'ih-room-payment-status ih-message-payment-control is-' + (paymentOverview?.tone || 'neutral')} onClick={() => onView('payment')} aria-controls="ih68-room-payment">
          <span>{t('Status płatności', 'Payment status')}</span><strong role="status" aria-live="polite" aria-atomic="true">{paymentOverview?.label || t('Sprawdzanie…', 'Checking…')}</strong><WorkspaceIcon kind="next" />
        </button>
        </nav>
        {disputePanel}
        <div className="ih68-room-body">
          <section className="ih68-correspondence" id="ih69-conversation-panel" aria-label={t('Rozmowa', 'Conversation')} hidden={view !== 'conversation'}>
            {nextStep && <aside className="ih-chat-next-step" aria-label={t('Co dalej', 'Next step')}><div><strong>{nextStep.title}</strong><p>{nextStep.description}</p></div><button type="button" onClick={nextStep.onAction}>{nextStep.actionLabel}<WorkspaceIcon kind="next" /></button></aside>}
            {thread}{composer}
          </section>
          <section hidden={view !== 'files'} className="ih68-room-page ih69-materials-page" id="ih68-room-files" tabIndex={-1} aria-label={t('Materiały projektu', 'Project materials')}>
            <header className="ih72-panel-heading"><div><button type="button" className="ih72-panel-back" onClick={closeContext}><WorkspaceIcon kind="back" />{t('Wróć do rozmowy', 'Back to conversation')}</button><h2>{t('Materiały', 'Materials')}</h2><p>{t('Pliki, linki i przekazane rezultaty w jednym miejscu.', 'Files, links and delivered work in one place.')}</p></div></header>{materials}
          </section>
          <section hidden={!showPlan} className="ih68-room-page ih68-terms ih-terms-panel" id="ih68-room-plan" tabIndex={-1} aria-label={t('Ustalenia', 'Terms')}>
            {showPlan && <><header className="ih72-panel-heading"><div><button type="button" className="ih72-panel-back" onClick={closeContext}><WorkspaceIcon kind="back" />{t('Wróć do rozmowy', 'Back to conversation')}</button><h2>{t('Ustalenia', 'Project terms')}</h2><p>{t('Zakres usługi, wynagrodzenie i termin w jednym miejscu.', 'The service scope, price and deadline in one place.')}</p></div></header>
              {projectAction}
              {plan}
              <details className="ih72-project-description ih-chat-source"><summary>{t('Pierwotny opis i dodatkowy plan', 'Original brief and additional plan')}<WorkspaceIcon kind="down" /></summary><div><h3>{jobTitle || t('Zapytanie o współpracę', 'Project inquiry')}</h3>{category && <p>{category}</p>}{projectDetails}{projectPlan}</div></details>
            </>}
          </section>
          <section hidden={view !== 'payment'} className="ih68-room-page ih-room-payment-page" id="ih68-room-payment" tabIndex={-1} aria-label={t('Płatność', 'Payment')}>
            {view === 'payment' && <><header className="ih72-panel-heading"><div><button type="button" className="ih72-panel-back" onClick={closeContext}><WorkspaceIcon kind="back" />{t('Wróć do rozmowy', 'Back to conversation')}</button><h2>{t('Płatność', 'Payment')}</h2><p>{t('Bieżący status płatności i rozliczenia tego projektu.', 'The current payment and settlement status for this project.')}</p></div></header>{React.isValidElement(payment) && payment.props.agreement?.status === "accepted" ? <WorkspacePaymentReader payment={payment} overview={paymentOverview} onMaterials={() => onView("files")} onDispute={onDispute} /> : payment}</>}
          </section>
        </div>
        <WorkspaceSheet open={optionsOpen} onClose={closeMenu} title={t('Opcje rozmowy', 'Conversation options')}>
          <nav className="ih70-menu-list">
            <Link to={'/profile/' + profileId} className="ih70-menu-link" onClick={closeMenu}><WorkspaceIcon kind="profile" /><span>{t('Profil i opcje blokowania', 'Profile and blocking options')}</span><WorkspaceIcon kind="next" /></Link>
            <button type="button" className="ih70-menu-link" disabled={!canDispute} onClick={() => { closeMenu(); onDispute(); }}><WorkspaceIcon kind="lock" /><span>{t('Zgłoś problem ze współpracą', 'Report a project issue')}</span></button>
            <button type="button" className="ih70-menu-link" disabled={hiding} onClick={() => { closeMenu(); onHide(); }}><WorkspaceIcon kind="close" /><span>{hiding ? t('Ukrywanie…', 'Hiding…') : t('Ukryj rozmowę z listy', 'Hide conversation from list')}</span></button>
            <Link to="/work" className="ih70-menu-link" onClick={closeMenu}><WorkspaceIcon kind="work" /><span>{t('Moja praca', 'My work')}</span><WorkspaceIcon kind="next" /></Link>
            <Link to="/messages" className="ih70-menu-link" onClick={closeMenu}><WorkspaceIcon kind="message" /><span>{t('Wszystkie rozmowy', 'All conversations')}</span><WorkspaceIcon kind="next" /></Link>
            <Link to="/account" className="ih70-menu-link" onClick={closeMenu}><WorkspaceIcon kind="home" /><span>{t('Moje konto', 'My account')}</span><WorkspaceIcon kind="next" /></Link>
            <Link to="/privacy-center" className="ih70-menu-link" onClick={closeMenu}><WorkspaceIcon kind="lock" /><span>{t('Prywatność i dane', 'Privacy & data')}</span><WorkspaceIcon kind="next" /></Link>
            <button type="button" className="ih70-menu-link ih68-expand-option" onClick={() => { closeMenu(); onFocusMode(!focusMode); }}><WorkspaceIcon kind={focusMode ? 'collapse' : 'expand'} /><span>{focusMode ? t('Przywróć widok', 'Restore view') : t('Powiększ rozmowę', 'Expand conversation')}</span></button>
            <WorkspaceDisplaySettings onNavigate={closeMenu} />
          </nav>
        </WorkspaceSheet>
        {reportDialog}
      </>}
    </main>
  </>;
}
