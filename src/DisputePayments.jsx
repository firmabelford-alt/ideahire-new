import React, { useCallback, useEffect, useRef, useState } from "react";

const FINANCIAL = new Set(["full_refund", "partial_refund", "release_payment"]);
const money = value => new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(Number(value || 0) / 100);
const STATE = { pending: "Oczekiwanie na potwierdzenie Stripe", processing: "Rozliczenie w toku", completed: "Stripe potwierdził rozliczenie", needs_review: "Wymagana kontrola operatora" };

const settlementDate = value => new Intl.DateTimeFormat("pl-PL", {
  dateStyle: "short", timeStyle: "short", timeZone: "Europe/Warsaw",
}).format(new Date(value));

// The amounts come from the paid quote, including historical commission rules.
// This is a display preview; only the server can authorize a financial operation.
function refundPlan(payment, decision) {
  const grosz = value => {
    const amount = Number(value);
    const result = Math.round(amount * 100);
    if (value == null || value === "" || !Number.isFinite(amount)
      || !Number.isSafeInteger(result) || result < 0 || Math.abs(amount * 100 - result) > 0.000001) {
      throw new Error("Nie udało się potwierdzić kwot rozliczenia.");
    }
    return result;
  };
  const work = grosz(payment.work_amount), fee = grosz(payment.platform_fee);
  if (work <= 0 || work + fee !== grosz(payment.total_amount)) throw new Error("Niespójne kwoty płatności.");
  const refundWork = decision.outcome === "full_refund" ? work
    : decision.outcome === "partial_refund" ? grosz(decision.amount) : 0;
  if (refundWork > work || decision.outcome === "partial_refund" && (refundWork === 0 || refundWork === work)) {
    throw new Error("Kwota decyzji wymaga sprawdzenia przez administratora.");
  }
  const refundFee = refundWork === work ? fee : Math.round(fee * refundWork / work);
  return { refundWork, refundFee, refundTotal: refundWork + refundFee,
    refunded: grosz(payment.refunded_amount), contractor: work - refundWork };
}

export function DisputeSettlementStatus({ client, decision, dispute, appeals = [], userId }) {
  const [record, setRecord] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(Date.now);
  const generation = useRef(0);
  const financial = FINANCIAL.has(decision?.outcome);
  const scope = [userId, dispute?.id, dispute?.agreement_id, dispute?.conversation_id, decision?.id].join(":");
  const currentScope = useRef(scope);
  currentScope.current = scope;
  const payment = record?.scope === scope ? record.payment : null;
  const plan = record?.scope === scope ? record.plan : null;

  const refresh = useCallback(async () => {
    if (!financial || !userId || !dispute?.conversation_id || !dispute?.agreement_id) return;
    const request = ++generation.current;
    const isCurrent = () => generation.current === request && currentScope.current === scope;
    setLoading(true);
    setNow(Date.now());
    try {
      const { data, error: requestError } = await client.rpc("get_ideahire_payment_summary", {
        p_conversation_id: dispute.conversation_id,
      });
      if (requestError) throw requestError;
      if (!isCurrent()) return;
      const summary = data?.[0];
      if (!summary?.paid_at || summary.agreement_id !== dispute.agreement_id
        || summary.client_id !== dispute.client_id || summary.contractor_id !== dispute.contractor_id
        || summary.currency !== "PLN") throw new Error("Brak potwierdzonej płatności dla tej decyzji.");
      const nextPlan = refundPlan(summary, decision);
      setRecord({ scope, payment: summary, plan: nextPlan });
      setError("");
    } catch {
      if (isCurrent()) {
        setRecord(null);
        setError("Nie udało się potwierdzić aktualnego rozliczenia. Odśwież status lub skontaktuj się z administratorem.");
      }
    } finally {
      if (isCurrent()) setLoading(false);
    }
  }, [client, financial, userId, scope, dispute?.conversation_id, dispute?.agreement_id,
    dispute?.client_id, dispute?.contractor_id, decision?.outcome, decision?.amount]);

  useEffect(() => {
    currentScope.current = scope;
    setRecord(null); setError("");
    if (!financial) return;
    refresh();
    const visibleRefresh = () => { if (document.visibilityState !== "hidden") refresh(); };
    const timer = window.setInterval(visibleRefresh, 30000);
    window.addEventListener("focus", visibleRefresh);
    document.addEventListener("visibilitychange", visibleRefresh);
    const paymentRefresh = event => {
      if (!event.detail?.conversationId || event.detail.conversationId === dispute?.conversation_id) visibleRefresh();
    };
    window.addEventListener("ideahire:payment-updated", paymentRefresh);
    return () => {
      generation.current += 1; currentScope.current = null;
      window.clearInterval(timer);
      window.removeEventListener("focus", visibleRefresh);
      document.removeEventListener("visibilitychange", visibleRefresh);
      window.removeEventListener("ideahire:payment-updated", paymentRefresh);
    };
  }, [financial, scope, refresh, decision?.payment_action_status, dispute?.conversation_id]);

  if (!financial) return null;
  const isRefund = decision.outcome !== "release_payment";
  const deadline = new Date(dispute.appeal_deadline_at || "").getTime();
  const appealed = appeals.some(appeal => appeal.decision_id === decision.id);
  const needsReview = decision.payment_action_status === "failed" || payment?.payment_status === "disputed";
  const confirmed = !needsReview && plan
    && (isRefund ? ["refunded", "partially_refunded"].includes(payment.payment_status) && plan.refunded === plan.refundTotal
      : decision.payment_action_status === "completed" && payment.payment_status === "released");
  let status;
  if (needsReview) status = "Rozliczenie wymaga kontroli administratora. Nie potwierdzono jego prawidłowego zakończenia.";
  else if (confirmed) status = isRefund ? "Stripe potwierdził zwrot klientowi." : "Stripe potwierdził przekazanie wynagrodzenia wykonawcy.";
  else if (decision.payment_action_status === "completed") status = "Decyzja jest oznaczona jako rozliczona. Sprawdzamy zgodność ze statusem płatności.";
  else if (decision.payment_action_status === "not_connected") status = "Administrator musi uruchomić lub sprawdzić rozliczenie tej decyzji. Sam zapis decyzji nie potwierdza zwrotu.";
  else if (appealed || !["decision_issued", "closed"].includes(dispute.status)) status = "Rozliczenie wstrzymane do rozpatrzenia sprawy lub odwołania.";
  else if (Number.isFinite(deadline) && now <= deadline) status = (isRefund ? "Zwrot przyznany" : "Wynagrodzenie przyznane")
    + " — trwa 7-dniowy termin odwołania do " + settlementDate(dispute.appeal_deadline_at)
    + " (czas polski). Operacja w Stripe jeszcze nie została zakończona.";
  else if (!Number.isFinite(deadline)) status = "Rozliczenie czeka na potwierdzenie terminu odwołania przez administratora.";
  else if (["refund_pending", "release_pending"].includes(payment?.payment_status)) status = "Rozliczenie w toku. Czekamy na potwierdzenie Stripe.";
  else status = "Termin odwołania upłynął. Oczekujemy na wykonanie i potwierdzenie rozliczenia w Stripe.";

  return <section className="dispute-panel dispute-summary-card" aria-label="Status rozliczenia decyzji">
    <div className="dispute-panel-heading"><h3>{isRefund ? "Status zwrotu" : "Status wypłaty wynagrodzenia"}</h3></div>
    <p role="status"><strong>{status}</strong></p>
    {loading && !payment && <p>Sprawdzamy płatność…</p>}
    {plan && <dl>
      {isRefund && <>
        <div><dt>Zwrot za pracę</dt><dd>{money(plan.refundWork)}</dd></div>
        <div><dt>Zwrot opłaty IdeaHire</dt><dd>{money(plan.refundFee)}</dd></div>
        <div><dt>{confirmed ? "Łączny zwrot potwierdzony przez Stripe" : "Łączny zwrot przewidziany decyzją"}</dt>
          <dd><strong>{money(plan.refundTotal)}</strong></dd></div>
      </>}
      <div><dt>Wynagrodzenie wykonawcy po rozliczeniu</dt><dd>{money(plan.contractor)}</dd></div>
    </dl>}
    {isRefund && <p>Zwrot trafia do metody płatności użytej przez klienta{payment?.payment_method === "blik" ? " — BLIK" : ""}.
      {" "}Nie powiększa salda wypłat wykonawcy. Zatwierdzenie decyzji przez administratora nie oznacza wykonania zwrotu.
      {confirmed && " Termin zaksięgowania po stronie klienta zależy od banku. W trybie testowym nie ma rzeczywistego przelewu do banku."}</p>}
    {error && <p role="alert">{error}</p>}
    <button type="button" className="dispute-secondary-button" onClick={refresh} disabled={loading}>
      {loading ? "Sprawdzanie…" : "Odśwież status rozliczenia"}
    </button>
  </section>;
}

export default function DisputePaymentPanel({ client, decision, userId, conversationId, onSettled }) {
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const request = useRef(0);
  const inFlight = useRef(false);
  const completed = useRef("");
  const scope = `${userId || ""}:${decision?.id || ""}`;
  const currentScope = useRef(scope);
  currentScope.current = scope;
  const settledCallback = useRef(onSettled);
  settledCallback.current = onSettled;

  const invoke = useCallback(async (action, resumeReview = false) => {
    const { data, error } = await client.functions.invoke("resolve-dispute-payment", {
      body: { action, decision_id: decision.id, ...(action === "execute" ? { confirm_settlement: true, resume_review: resumeReview } : {}) },
    });
    if (error) {
      let detail;
      try { detail = await error.context?.json(); } catch { /* use the fallback */ }
      throw new Error(detail?.error || "Nie udało się sprawdzić rozliczenia. Odśwież status tej samej operacji.");
    }
    if (!data?.ok) throw new Error(data?.error || "Brak potwierdzenia serwera.");
    return data;
  }, [client, decision?.id]);

  const notify = useCallback(action => {
    if (action?.state !== "completed" || completed.current === action.id) return;
    completed.current = action.id;
    window.dispatchEvent(new CustomEvent("ideahire:payment-updated", { detail: { conversationId } }));
    settledCallback.current?.();
  }, [conversationId]);

  const refresh = useCallback(async () => {
    if (!userId || !decision?.id || !FINANCIAL.has(decision.outcome)) return;
    const generation = ++request.current;
    setLoading(true);
    try {
      const data = await invoke("preview");
      if (generation !== request.current || currentScope.current !== scope) return;
      setPreview(data.preview);
      setMessage("");
      notify(data.preview?.action);
    } catch (error) {
      if (generation === request.current && currentScope.current === scope) { setPreview(null); setMessage(error.message); }
    } finally {
      if (generation === request.current && currentScope.current === scope) setLoading(false);
    }
  }, [decision?.id, decision?.outcome, invoke, notify, scope, userId]);

  useEffect(() => {
    currentScope.current = scope;
    setPreview(null); setConfirmed(false); setMessage(""); setExecuting(false); inFlight.current = false;
    refresh();
    const visibleRefresh = () => { if (document.visibilityState !== "hidden" && !inFlight.current) refresh(); };
    const timer = window.setInterval(visibleRefresh, 30000);
    window.addEventListener("focus", visibleRefresh);
    return () => { request.current += 1; currentScope.current = null; window.clearInterval(timer); window.removeEventListener("focus", visibleRefresh); };
  }, [refresh, scope]);

  async function execute() {
    if (inFlight.current || !confirmed || !preview?.eligible || preview.action?.state === "completed") return;
    inFlight.current = true; setExecuting(true); setMessage("");
    const executionScope = scope;
    try {
      const result = await invoke("execute", preview.action?.state === "needs_review");
      if (currentScope.current !== executionScope) return;
      if (!["completed", "pending"].includes(result.state)) throw new Error("Nie potwierdzono końcowego statusu operacji.");
      notify(result.action);
      setConfirmed(false);
      await refresh();
    } catch (error) {
      if (currentScope.current === executionScope) setMessage(error.message);
    } finally {
      if (currentScope.current === executionScope) { inFlight.current = false; setExecuting(false); }
    }
  }

  if (!FINANCIAL.has(decision?.outcome)) return null;
  return <div className="dispute-financial-action" style={{ marginTop: 20, borderTop: "1px solid currentColor", paddingTop: 16 }}>
    <h3>Rozliczenie decyzji w Stripe</h3>
    <p>Pełny zwrot obejmuje prowizję IdeaHire. Przy częściowym zwrocie prowizja jest zwracana proporcjonalnie. Operacja może rozpocząć się po terminie odwołania, jeśli decyzja pozostaje aktualna.</p>
    {loading && <p role="status">Sprawdzamy plan rozliczenia…</p>}
    {preview && <>
      {preview.livemode === false && <strong>Sandbox — kwoty testowe</strong>}
      <dl>
        <dt>Zwrot wynagrodzenia klientowi</dt><dd>{money(preview.refund_work)}</dd>
        <dt>Zwrot prowizji klientowi</dt><dd>{money(preview.refund_fee)}</dd>
        <dt>Łączny zwrot klientowi</dt><dd><strong>{money(preview.refund_total)}</strong></dd>
        <dt>Wynagrodzenie wykonawcy po rozliczeniu</dt><dd><strong>{money(preview.contractor_target)}</strong></dd>
      </dl>
      <p role="status">{STATE[preview.action?.state] || preview.blocked_reason || "Plan gotowy do wykonania."}</p>
      {preview.action?.last_error && <p role="alert">{preview.action.last_error}</p>}
      {STATE[preview.action?.state] && !preview.eligible && preview.blocked_reason && <p>{preview.blocked_reason}</p>}
      {preview.eligible && preview.action?.state !== "completed" && <>
        <label><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} disabled={executing} /> Sprawdziłem decyzję oraz powyższe kwoty i zlecam wykonanie lub sprawdzenie tej samej operacji w Stripe.</label>
        <button type="button" className="dispute-primary-button" onClick={execute} disabled={!confirmed || loading || executing}>
          {executing ? "Sprawdzanie rozliczenia…" : preview.action?.state === "needs_review" ? "Ponów sprawdzenie tej samej operacji" : "Wykonaj / sprawdź rozliczenie"}
        </button>
      </>}
      {preview.action?.refund_id && <small>Zwrot: {preview.action.refund_id}</small>}
      {(preview.action?.original_transfer || preview.action?.transfer_id) && <p><small>Transfer: {preview.action.original_transfer || preview.action.transfer_id}</small></p>}
    </>}
    {message && <p role="alert">{message}</p>}
    <button type="button" className="dispute-secondary-button" onClick={refresh} disabled={loading || executing}>Odśwież plan i status</button>
    <p><small>Zwrot wraca do metody płatności klienta. Przekazanie wynagrodzenia na saldo Stripe wykonawcy jest odrębnym etapem od wypłaty na jego rachunek bankowy.</small></p>
  </div>;
}
