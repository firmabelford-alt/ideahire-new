import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { RefreshCw, ArrowUpRight, ChevronDown, Wallet, Clock3 } from "lucide-react";
import { useSitePreferences } from "./Preferences";
import "./StripeAccountPanel.css";

/* Stripe: private balance and bank payout view, PL / EN. */
export async function stripeProfileRequest(client, action, userId) {
  const session = await client.auth.getSession();
  if (session.error || !session.data?.session?.access_token || session.data.session.user?.id !== userId) {
    throw Object.assign(new Error("Session expired"), { code: "invalid_session" });
  }
  const { data, error } = await client.functions.invoke("create-connect-onboarding", {
    body: { action },
    headers: { Authorization: `Bearer ${session.data.session.access_token}` },
  });
  if (error) {
    let code = "payouts_unavailable";
    try { code = (await error.context?.clone?.().json())?.code || code; } catch { /* Safe local copy below. */ }
    throw Object.assign(new Error("Stripe unavailable"), { code });
  }
  if (!data || data.schema_version !== 1 || data.error) {
    throw Object.assign(new Error("Payout view unavailable"), { code: data?.code || "payouts_setup_required" });
  }
  if (action === "payouts" && (typeof data.connected !== "boolean"
    || data.connected && (!Number.isSafeInteger(data.available_grosz) || !Number.isSafeInteger(data.pending_grosz)
      || !Array.isArray(data.payouts) || !data.schedule || typeof data.livemode !== "boolean"))) {
    throw Object.assign(new Error("Invalid payout response"), { code: "payouts_response_mismatch" });
  }
  return data;
}

export default function StripeAccountPayouts({ client, userId, onConfigure, onStatusChange, children }) {
  const { language } = useSitePreferences();
  const en = language === "en";
  const c = (pl, english) => en ? english : pl;
  const [tab, setTab] = useState("connection");
  const [record, setRecord] = useState(null);
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(false);
  const [opening, setOpening] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const generation = useRef(0);
  const currentUser = useRef(userId);
  const mounted = useRef(true);
  currentUser.current = userId;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    const requestId = ++generation.current;
    if (tab !== "payouts") return;
    setLoading(true);
    setIssue(null);
    stripeProfileRequest(client, "payouts", userId).then(data => {
      if (generation.current !== requestId || !mounted.current || currentUser.current !== userId) return;
      setRecord({ userId, data });
      if (["not_started", "in_progress", "restricted", "ready", "disabled"].includes(data.status)) onStatusChange?.(data.status);
    }).catch(error => {
      if (generation.current !== requestId || !mounted.current || currentUser.current !== userId) return;
      const code = error?.code || "payouts_unavailable";
      // Only transport failures may retain the last snapshot; access errors clear it.
      if (!["payouts_unavailable", "stripe_unavailable"].includes(code)) setRecord(null);
      setIssue({ userId, code });
    }).finally(() => {
      if (generation.current === requestId && mounted.current) setLoading(false);
    });
    return () => { generation.current += 1; };
  }, [client, tab, userId, refresh, onStatusChange]);
  useEffect(() => {
    if (tab !== "payouts" || !userId) return;
    let lastRefresh = 0;
    function refreshVisiblePayouts() {
      if (document.visibilityState === "hidden" || Date.now() - lastRefresh < 1000) return;
      lastRefresh = Date.now();
      setRefresh(value => value + 1);
    }
    const timer = window.setInterval(refreshVisiblePayouts, 30000);
    window.addEventListener("focus", refreshVisiblePayouts);
    window.addEventListener("pageshow", refreshVisiblePayouts);
    window.addEventListener("ideahire:payment-updated", refreshVisiblePayouts);
    document.addEventListener("visibilitychange", refreshVisiblePayouts);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refreshVisiblePayouts);
      window.removeEventListener("pageshow", refreshVisiblePayouts);
      window.removeEventListener("ideahire:payment-updated", refreshVisiblePayouts);
      document.removeEventListener("visibilitychange", refreshVisiblePayouts);
    };
  }, [tab, userId]);
  const data = record?.userId === userId ? record.data : null;
  const errorCode = issue?.userId === userId ? issue.code : "";
  const money = (grosz, currency = "PLN") => {
    if (!Number.isSafeInteger(grosz) || typeof currency !== "string" || !/^[A-Z]{3}$/i.test(currency)) return "—";
    try { return new Intl.NumberFormat(en ? "en-GB" : "pl-PL", { style:"currency",currency:currency.toUpperCase() }).format(grosz / 100); } catch { return "—"; }
  };
  const date = seconds => {
    const value = new Date(Number.isSafeInteger(seconds) ? seconds * 1000 : NaN);
    return Number.isFinite(value.getTime()) ? new Intl.DateTimeFormat(en ? "en-GB" : "pl-PL", { day:"numeric",month:"short",year:"numeric",timeZone:"UTC" }).format(value) : "—";
  };
  const checkedAt = new Date(data?.checked_at || "");
  const checkedLabel = Number.isFinite(checkedAt.getTime()) ? new Intl.DateTimeFormat(en ? "en-GB" : "pl-PL", { dateStyle:"short",timeStyle:"short" }).format(checkedAt) : "";
  const statuses = {
    pending: c("Oczekuje na wysłanie", "Waiting to be sent"),
    in_transit: c("Wysłana do banku", "Sent to the bank"),
    paid: c("Zrealizowana przez Stripe", "Completed by Stripe"),
    failed: c("Nieudana", "Failed"),
    canceled: c("Anulowana", "Canceled"),
  };
  const payoutDescriptions = {
    pending: c("Stripe przygotował wypłatę. Środki czekają na wysłanie do banku.", "Stripe has prepared the payout. The funds are waiting to be sent to the bank."),
    in_transit: c("Stripe wysłał środki do banku. Przewidywana data dotyczy ich dotarcia na rachunek.", "Stripe has sent the funds to the bank. The expected date is when they should reach the account."),
    paid: c("Stripe oznaczył tę wypłatę jako zrealizowaną.", "Stripe has marked this payout as completed."),
    failed: c("Wypłata nie powiodła się. Sprawdź przyczynę i dane rachunku w Stripe.", "The payout failed. Check the reason and bank details in Stripe."),
    canceled: c("Ta wypłata została anulowana.", "This payout was canceled."),
  };
  const errors = {
    invalid_session: c("Sesja wygasła. Zaloguj się ponownie.", "Your session expired. Sign in again."),
    account_not_eligible: c("Wypłaty są dostępne dla aktywnych, pełnoletnich użytkowników.", "Payouts require an active adult account."),
    connect_account_review_required: c("Nie można odczytać zapisanego konta Stripe w tym trybie. Skontaktuj się z pomocą IdeaHire.", "The saved Stripe account cannot be read in this mode. Contact IdeaHire support."),
    connect_account_mismatch: c("Dane konta Stripe wymagają sprawdzenia przez pomoc IdeaHire.", "IdeaHire support needs to check the Stripe account details."),
    connect_account_closed: c("Konto Stripe jest zamknięte. Skontaktuj się z pomocą IdeaHire.", "The Stripe account is closed. Contact IdeaHire support."),
    express_dashboard_unavailable: c("Panel Stripe Express nie jest dostępny dla tego konta. Skontaktuj się z pomocą IdeaHire.", "Stripe Express is unavailable for this account. Contact IdeaHire support."),
    payouts_setup_required: c("Podgląd wypłat wymaga dokończenia konfiguracji przez obsługę IdeaHire.", "IdeaHire needs to finish setting up the payout view."),
    payouts_response_mismatch: c("Dane wypłat wymagają sprawdzenia. Spróbuj ponownie lub skontaktuj się z pomocą IdeaHire.", "The payout details need to be checked. Try again or contact IdeaHire support."),
  };
  const schedule = data?.schedule;
  const intervals = {
    daily: c("Automatycznie — codziennie", "Automatic — daily"),
    weekly: c("Automatycznie — co tydzień", "Automatic — weekly"),
    monthly: c("Automatycznie — co miesiąc", "Automatic — monthly"),
    manual: c("Wypłaty ręczne", "Manual payouts"),
    unknown: c("Harmonogram niedostępny", "Schedule unavailable"),
  };
  const weekdays = en
    ? { monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday", thursday: "Thursday", friday: "Friday", saturday: "Saturday", sunday: "Sunday" }
    : { monday: "poniedziałek", tuesday: "wtorek", wednesday: "środa", thursday: "czwartek", friday: "piątek", saturday: "sobota", sunday: "niedziela" };
  const scheduleDays = schedule?.interval === "weekly"
    ? (schedule.weekly_days || []).map(day => weekdays[day]).filter(Boolean).join(", ")
    : schedule?.interval === "monthly" ? (schedule.monthly_days || []).join(", ") : "";
  const bankEnabled = data?.payouts_enabled === true && data?.payout_settings_status === "enabled";
  async function openStripe() {
    if (opening) return;
    setOpening(true);
    setIssue(null);
    const requestedUser = userId;
    try {
      const result = await stripeProfileRequest(client, "dashboard", requestedUser);
      if (!mounted.current || currentUser.current !== requestedUser) return;
      if (!result.connected) throw Object.assign(new Error("No account"), { code: "payouts_setup_required" });
      const url = new URL(result.dashboard_url);
      if (url.protocol !== "https:" || !["connect.stripe.com", "stripe.com"].includes(url.hostname)
        || !url.pathname.startsWith("/express/") || url.username || url.password || url.port) {
        throw Object.assign(new Error("Invalid dashboard URL"), { code: "payouts_response_mismatch" });
      }
      window.location.assign(url.href);
    } catch (error) {
      if (mounted.current && currentUser.current === requestedUser) setIssue({ userId: requestedUser, code: error?.code || "payouts_unavailable" });
    } finally {
      if (mounted.current) setOpening(false);
    }
  }
  const tabs = [
    { key: "connection", text: c("Połączenie ze Stripe", "Stripe connection") },
    { key: "payouts", text: c("Saldo i wypłaty", "Balance and payouts") },
  ];
  return <div className="ih-stripe-profile" data-stripe-interface="20261029">
    <div className="ih-sp-tabs" role="tablist" aria-label={c("Konto Stripe", "Stripe account")} data-no-translate="true">
      {tabs.map((item, index) => <button key={item.key} type="button" className="ih-sp-tab" role="tab"
        id={`ih-stripe-tab-${item.key}`} aria-controls={`ih-stripe-panel-${item.key}`}
        aria-selected={tab === item.key} tabIndex={tab === item.key ? 0 : -1}
        onClick={() => setTab(item.key)} onKeyDown={event => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
          event.preventDefault();
          const target = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
          setTab(tabs[target].key);
          document.getElementById(`ih-stripe-tab-${tabs[target].key}`)?.focus();
        }}>{item.text}</button>)}
    </div>
    {tab === "connection" ? <div className="ih-sp-connection" role="tabpanel" id="ih-stripe-panel-connection" aria-labelledby="ih-stripe-tab-connection">{children}</div>
      : <section className="ih-sp-panel" role="tabpanel" id="ih-stripe-panel-payouts" aria-labelledby="ih-stripe-tab-payouts" aria-busy={loading} data-no-translate="true">
        <div className="ih-sp-head">
          <div><h2>{c("Twoje środki", "Your funds")}</h2><p className="ih-sp-muted">{c("Saldo konta wykonawcy i przelewy na rachunek bankowy.", "Your freelancer balance and bank payouts.")}</p></div>
          <button type="button" className="ih-sp-button ih-sp-refresh" disabled={loading || opening} onClick={() => setRefresh(value => value + 1)}><RefreshCw size={16} className={loading ? "is-spinning" : ""} aria-hidden="true"/>{c("Odśwież dane", "Refresh details")}</button>
        </div>
        <div className="ih-sp-freshness" role="status" aria-live="polite">{loading ? c("Sprawdzamy dane w Stripe…", "Checking details with Stripe…") : errorCode && data ? c("Wyświetlamy ostatnio potwierdzone dane.", "Showing the last confirmed details.") : checkedLabel ? <>{c("Sprawdzono:", "Checked:")} <time dateTime={data.checked_at}>{checkedLabel}</time></> : c("Dane pochodzą z Twojego konta Stripe.", "Details come from your Stripe account.")}</div>
        {errorCode && <div className="ih-sp-notice ih-sp-error" role="alert"><strong>{c(data ? "Nie udało się odświeżyć danych" : "Nie można pokazać salda", data ? "Details could not be refreshed" : "The balance view is unavailable")}</strong><p>{errors[errorCode] || c("Spróbuj ponownie. Do czasu potwierdzenia danych nie pokazujemy nowego salda.", "Try again. A new balance will appear after it has been confirmed.")}</p>{errorCode === "account_not_eligible" && <Link to="/account#account-profile-data">{c("Sprawdź dane konta", "Check your account details")}<ArrowUpRight size={15} aria-hidden="true"/></Link>}{errorCode === "invalid_session" && <Link to="/login">{c("Zaloguj się ponownie", "Sign in again")}</Link>}{data && checkedLabel && <small>{c("Ostatnie potwierdzenie:", "Last confirmed:")} {checkedLabel}</small>}</div>}
        {loading && !data && <div className="ih-sp-loading" aria-hidden="true"><span/><span/></div>}
        {data?.connected === false && <div className="ih-sp-empty"><Wallet size={25} aria-hidden="true"/><h3>{c("Połącz konto do wypłat", "Connect your payout account")}</h3><p>{c("Po konfiguracji w Stripe zobaczysz tutaj saldo i historię przelewów.", "Once Stripe is set up, your balance and bank payout history will appear here.")}</p><button type="button" className="ih-sp-button is-primary" onClick={() => { setTab("connection"); }}>{c("Przejdź do konfiguracji", "Go to setup")}<ArrowUpRight size={16} aria-hidden="true"/></button></div>}
        {data?.connected && <>
          {data.livemode === false && <p className="ih-sp-notice ih-sp-test" role="status">{c("Tryb testowy. Kwoty są symulowane, a wypłaty nie trafią do banku.", "Test mode. Balances are simulated and no payout will reach a bank.")}</p>}
          <div className="ih-sp-grid">
            <div className="ih-sp-card"><span><Wallet size={17} aria-hidden="true"/>{c("Dostępne w Stripe", "Available in Stripe")}</span><strong>{money(data.available_grosz)}</strong><p>{c("Środki rozliczone. Ich wypłata zależy od ustawień konta.", "Settled funds. Payouts follow your account settings.")}</p></div>
            <div className="ih-sp-card"><span><Clock3 size={17} aria-hidden="true"/>{c("W trakcie rozliczania", "Being settled")}</span><strong>{money(data.pending_grosz)}</strong><p>{c("Stripe przetwarza te środki. Nie można ich jeszcze wypłacić.", "Stripe is processing these funds. They are not available for payout yet.")}</p></div>
          </div>
          <div className="ih-sp-settings">
            <div className="ih-sp-setting"><div><h3>{c("Wypłaty bankowe", "Bank payouts")}</h3><p>{bankEnabled ? c("Konto umożliwia wypłaty.", "Payouts are enabled.") : data.payout_settings_status === "unknown" ? c("Ustawienia wymagają potwierdzenia w Stripe.", "Confirm your settings in Stripe.") : c("Sprawdź wymagania i dane rachunku w Stripe.", "Check requirements and bank details in Stripe.")}</p></div><span className="ih-sp-badge">{bankEnabled ? c("Aktywne", "Enabled") : c("Sprawdź w Stripe", "Check in Stripe")}</span></div>
            <div className="ih-sp-setting"><div><h3>{c("Harmonogram wypłat", "Payout schedule")}</h3><p>{intervals[schedule?.interval] || intervals.unknown}{scheduleDays ? ` · ${scheduleDays}` : ""}</p>{schedule?.interval === "manual" && <p>{c("Wypłatę zlecisz w Stripe, jeśli jest dostępna dla Twojego konta.", "Request a payout in Stripe if it is available for your account.")}</p>}{Number.isSafeInteger(schedule?.minimum_balance_grosz) && schedule.minimum_balance_grosz > 0 && <p>{c("Saldo pozostawiane w Stripe:", "Balance kept in Stripe:")} {money(schedule.minimum_balance_grosz)}</p>}</div></div>
          </div>
          {data.dashboard_available && <button type="button" className="ih-sp-button ih-sp-manage" disabled={opening} onClick={openStripe}>{opening ? c("Otwieramy Stripe…", "Opening Stripe…") : c("Zarządzaj kontem w Stripe", "Manage your Stripe account")}<ArrowUpRight size={16} aria-hidden="true"/></button>}
          <div className="ih-sp-history"><h3>{c("Historia wypłat", "Payout history")}</h3>
            {data.payouts.length === 0 ? <div className="ih-sp-history-empty"><p>{c("Nie ma jeszcze wypłat bankowych.", "No bank payouts yet.")}</p><small>{c("Gdy Stripe utworzy przelew, pojawi się tutaj jego kwota i status.", "Once Stripe creates a payout, its amount and status will appear here.")}</small></div> : <ul className="ih-sp-list">{data.payouts.map(payout => <li className="ih-sp-row" key={payout.id}>
              <div className="ih-sp-row-top"><strong>{money(payout.amount_grosz, payout.currency)}</strong><span className="ih-sp-badge">{data.livemode === false ? c("Test · ", "Test · ") : ""}{statuses[payout.status] || c("Sprawdź w Stripe", "Check in Stripe")}</span></div>
              <p className="ih-sp-row-date">{c("Utworzona:", "Created:")} {date(payout.created)}{["pending", "in_transit"].includes(payout.status) ? <> · {c("Przewidywane dotarcie:", "Expected arrival:")} {date(payout.arrival_date)}</> : null}</p>
              <details className="ih-sp-payout-detail"><summary>{c("Szczegóły wypłaty", "Payout details")}<ChevronDown size={15} aria-hidden="true"/></summary><div><p>{payoutDescriptions[payout.status] || c("Aktualny etap sprawdzisz w Stripe.", "Check the current stage in Stripe.")}</p><small>{c("Numer wypłaty:", "Payout reference:")} {payout.id}</small></div></details>
            </li>)}</ul>}
          </div>
        </>}
        <details className="ih-sp-guide"><summary>{c("Jak działają rozliczenia i zwroty?", "How do settlement and refunds work?")}<ChevronDown size={17} aria-hidden="true"/></summary><div><ol><li>{c("Po odbiorze pracy wynagrodzenie jest przekazywane na saldo wykonawcy w Stripe. Status przekazania sprawdzisz we współpracy.", "After work is accepted, earnings are transferred to the freelancer's Stripe balance. Check the transfer status in the collaboration.")}</li><li>{c("Stripe osobno rozlicza środki i wykonuje wypłatę na rachunek według ustawień konta. Przekazanie wynagrodzenia nie oznacza jeszcze wpływu do banku.", "Stripe settles funds and separately pays them to your bank according to your account settings. A transfer of earnings does not yet mean the funds have reached your bank.")}</li><li>{c("Zwrot wraca do metody płatności klienta. Nie zwiększa salda wykonawcy. Kwotę i status zwrotu sprawdzisz w szczegółach sprawy.", "Refunds return to the client's payment method and do not increase the freelancer balance. Check the amount and refund status in the case details.")}</li></ol><Link to="/disputes">{c("Moje sprawy", "My cases")}<ArrowUpRight size={15} aria-hidden="true"/></Link></div></details>
      </section>}
  </div>;
}
