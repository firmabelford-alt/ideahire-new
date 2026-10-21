import React, { useCallback, useEffect, useRef, useState } from "react";

const FINANCIAL = new Set(["full_refund", "partial_refund", "release_payment"]);
const money = value => new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(Number(value || 0) / 100);
const STATE = { pending: "Oczekiwanie na potwierdzenie Stripe", processing: "Rozliczenie w toku", completed: "Stripe potwierdził rozliczenie", needs_review: "Wymagana kontrola operatora" };

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
      {!preview.eligible && preview.blocked_reason && <p>{preview.blocked_reason}</p>}
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
    <p><small>Przekazanie wynagrodzenia na saldo Stripe wykonawcy jest odrębnym etapem od wypłaty na jego rachunek bankowy.</small></p>
  </div>;
}
