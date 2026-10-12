/* IdeaHire | Stripe Checkout | 2026-10-12 | Pelny index.ts istniejacej funkcji. */
import { createClient } from "npm:@supabase/supabase-js@2.53.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const RAW_APP_URL = Deno.env.get("APP_URL") ?? "https://ideahire-new.pages.dev";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const BEFORE_PAYMENT = ["awaiting_payment", "checkout_open", "failed", "cancelled"];
const RULES: Record<string, { basis: number; minimum: number; maximum: number; limit: number; label: string }> = {
  PLN_7_5_MIN20_MAX300_V1: { basis: 750, minimum: 2000, maximum: 30000, limit: 1500000, label: "7,5% wartości zlecenia, minimum 20 zł i maksimum 300 zł" },
  PLN_7_MIN20_MAX300_V2: { basis: 700, minimum: 2000, maximum: 30000, limit: 1500000, label: "7% wartości zlecenia, minimum 20 zł i maksimum 300 zł" },
  PLN_5_5_MIN20_MAX229_V3: { basis: 550, minimum: 2000, maximum: 22900, limit: 1000000, label: "5,5% wartości zlecenia, minimum 20 zł i maksimum 229 zł" },
};

type Reservation = {
  payment_id: string; conversation_id: string; agreement_id: string; client_id: string;
  contractor_id: string; job_id: string; job_title: string; work_amount_grosz: number;
  platform_fee_grosz: number; total_amount_grosz: number; currency: string;
  pricing_rule_code: string; checkout_attempt: number; checkout_session_id: string | null;
  checkout_expires_at: string | null; transfer_group: string; contractor_stripe_account_id: string;
};
type Session = {
  id: string; object: string; url: string | null; status: string; payment_status: string;
  amount_total: number; currency: string; client_reference_id: string | null;
  metadata?: Record<string, string>; expires_at: number; livemode: boolean;
};
type CheckoutError = Error & { code?: string; httpStatus?: number; definitive?: boolean };

function appUrl(): string {
  const parsed = new URL(RAW_APP_URL);
  const local = ["localhost", "127.0.0.1"].includes(parsed.hostname);
  if ((parsed.protocol !== "https:" && !(local && parsed.protocol === "http:"))
    || parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== "/") {
    throw new Error("Nieprawidłowa konfiguracja APP_URL.");
  }
  return parsed.origin;
}
function allowedOrigin(origin: string): boolean {
  if (!origin) return true; // Kazde zadanie nadal wymaga zweryfikowanego JWT.
  try {
    const url = new URL(origin);
    if (url.origin !== origin) return false;
    return origin === appUrl() || origin === "https://ideahire-new.pages.dev"
      || ["http://localhost:5173", "http://127.0.0.1:5173"].includes(origin)
      || (url.protocol === "https:" && !url.port && url.hostname.endsWith(".ideahire-new.pages.dev"));
  } catch { return false; }
}
function cors(request: Request): Record<string, string> {
  const origin = request.headers.get("Origin") ?? "";
  return { "Access-Control-Allow-Origin": origin && allowedOrigin(origin) ? origin : "https://ideahire-new.pages.dev",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Max-Age": "86400", Vary: "Origin" };
}
function respond(request: Request, status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...cors(request),
    "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
}
function fail(message: string, code: string, httpStatus = 400): never {
  throw Object.assign(new Error(message), { code, httpStatus });
}
function safeMessage(error: unknown): string {
  let message = error && typeof error === "object" && "message" in error
    ? String(error.message) : "Nie udało się rozpocząć płatności.";
  for (const secret of [STRIPE_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY]) {
    if (secret) message = message.split(secret).join("[ukryte]");
  }
  return message.slice(0, 400);
}
function stripeLiveMode(): boolean {
  const mode = /^(?:sk|rk)_(test|live)_/.exec(STRIPE_SECRET_KEY)?.[1];
  if (!mode) fail("Konfiguracja klucza Stripe jest nieprawidłowa.", "stripe_setup", 503);
  return mode === "live";
}
export function validateReservation(value: unknown, agreementId: string, userId: string): Reservation {
  if (!value || typeof value !== "object") fail("Nie udało się zarezerwować płatności.", "reservation");
  const r = value as Reservation;
  for (const id of [r.payment_id, r.conversation_id, r.agreement_id, r.client_id, r.contractor_id, r.job_id]) {
    if (typeof id !== "string" || !UUID.test(id)) fail("Dane płatności są niekompletne.", "snapshot");
  }
  if (r.agreement_id !== agreementId || r.client_id !== userId || r.client_id === r.contractor_id
    || r.currency !== "PLN" || !/^acct_[A-Za-z0-9]+$/.test(r.contractor_stripe_account_id)
    || typeof r.transfer_group !== "string" || !r.transfer_group || r.transfer_group.length > 200
    || !Number.isSafeInteger(r.checkout_attempt) || r.checkout_attempt < 1) {
    fail("Dane płatności są niespójne.", "snapshot");
  }
  const rule = RULES[r.pricing_rule_code];
  if (!rule) fail("Ta wersja cennika wymaga aktualizacji obsługi płatności.", "pricing_rule", 409);
  const a = r.work_amount_grosz;
  const fee = Math.max(rule.minimum, Math.min(rule.maximum, Math.floor((a * rule.basis + 5000) / 10000)));
  if (!Number.isSafeInteger(a) || a < 100 || a > rule.limit
    || !Number.isSafeInteger(r.platform_fee_grosz) || r.platform_fee_grosz !== fee
    || !Number.isSafeInteger(r.total_amount_grosz) || r.total_amount_grosz !== a + fee) {
    fail("Kwoty płatności nie odpowiadają zapisanej wersji cennika.", "snapshot_amount", 409);
  }
  return r;
}
function validateSession(s: Session, r: Reservation, live: boolean): void {
  if (!s || s.object !== "checkout.session" || !/^cs_(?:test_|live_)?[A-Za-z0-9]+$/.test(s.id)
    || s.client_reference_id !== r.payment_id || s.metadata?.payment_id !== r.payment_id
    || s.currency !== "pln" || s.amount_total !== r.total_amount_grosz
    || s.livemode !== live || !Number.isSafeInteger(s.expires_at)) {
    fail("Stripe zwrócił sesję niezgodną z płatnością.", "session_mismatch", 409);
  }
  if (s.url) {
    const url = new URL(s.url);
    if (url.protocol !== "https:" || url.hostname !== "checkout.stripe.com" || url.username || url.password) {
      fail("Stripe zwrócił nieprawidłowy adres płatności.", "session_url", 409);
    }
  }
}
async function stripeRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch("https://api.stripe.com" + path, { ...init, signal: controller.signal,
      headers: { Authorization: "Bearer " + STRIPE_SECRET_KEY, ...(init.headers ?? {}) } });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const code = String(payload?.error?.code || payload?.error?.type || "stripe_error").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 120);
      // 429, 5xx, konflikt idempotencji i zerwane polaczenie nie dowodza nieutworzenia sesji.
      const definitive = [400, 401, 403, 404, 422].includes(response.status)
        && !code.includes("idempotency") && code !== "api_error";
      throw Object.assign(new Error(response.status >= 500 || response.status === 429
        ? "Stripe jest chwilowo niedostępny. Ponów tę samą płatność za chwilę."
        : "Nie udało się przygotować sesji Stripe. Konfiguracja płatności wymaga sprawdzenia."),
        { code, httpStatus: response.status, definitive });
    }
    if (!payload) fail("Stripe nie zwrócił poprawnej odpowiedzi. Ponów tę samą płatność.", "stripe_response", 502);
    return payload as T;
  } finally { clearTimeout(timeout); }
}
function lineItem(params: URLSearchParams, index: number, name: string, description: string, amount: number): void {
  const prefix = "line_items[" + index + "]";
  params.set(prefix + "[price_data][currency]", "pln");
  params.set(prefix + "[price_data][product_data][name]", name);
  params.set(prefix + "[price_data][product_data][description]", description);
  params.set(prefix + "[price_data][unit_amount]", String(amount));
  params.set(prefix + "[quantity]", "1");
}

export async function handleCheckout(request: Request): Promise<Response> {
  const origin = request.headers.get("Origin") ?? "";
  if (!allowedOrigin(origin)) return respond(request, 403, { error: "Nieprawidłowe źródło żądania." });
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(request) });
  if (request.method !== "POST") return respond(request, 405, { error: "Dozwolona jest tylko metoda POST." });
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY || !STRIPE_SECRET_KEY) {
    return respond(request, 503, { error: "Konfiguracja płatności po stronie serwera jest niekompletna." });
  }
  const authorization = request.headers.get("Authorization") ?? "";
  if (!/^Bearer\s+\S+$/i.test(authorization)) return respond(request, 401, { error: "Musisz być zalogowany." });
  let agreementId: string;
  try {
    if (Number(request.headers.get("Content-Length") || 0) > 8192) throw Error();
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > 8192) throw Error();
    const body = JSON.parse(raw);
    if (!body || typeof body !== "object" || Array.isArray(body)
      || Object.keys(body).some(key => key !== "agreement_id")
      || typeof body.agreement_id !== "string" || !UUID.test(body.agreement_id)) throw Error();
    agreementId = body.agreement_id;
  } catch { return respond(request, 400, { error: "Nieprawidłowe dane żądania." }); }

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false } });
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user || !UUID.test(user.id)) return respond(request, 401, { error: "Sesja wygasła. Zaloguj się ponownie." });
  let paymentId = "";
  let reservation: Reservation | null = null;
  try {
    const application = appUrl();
    const live = stripeLiveMode();
    const { data: ensured, error: ensureError } = await userClient.rpc("ensure_ideahire_payment", { p_agreement_id: agreementId });
    if (ensureError) throw ensureError;
    paymentId = String(ensured ?? "");
    if (!UUID.test(paymentId)) fail("Nie udało się przygotować płatności.", "payment");
    const { data: saved, error: savedError } = await serviceClient.from("ideahire_payments")
      .select("id,status,stripe_livemode").eq("id", paymentId).maybeSingle();
    if (savedError) throw savedError;
    if (!saved || !BEFORE_PAYMENT.includes(saved.status)) fail("Ta płatność jest już opłacona albo rozliczana.", "payment_state", 409);
    if (saved.stripe_livemode !== null && saved.stripe_livemode !== live) {
      fail("Ta płatność pochodzi z innego trybu Stripe. Utwórz osobne ustalenia testowe.", "stripe_mode", 409);
    }
    async function reserve(): Promise<Reservation> {
      const { data, error } = await serviceClient.rpc("ideahire_reserve_checkout", { p_payment_id: paymentId, p_actor_user_id: user.id });
      if (error) throw error;
      return validateReservation(data?.[0], agreementId, user.id);
    }
    reservation = await reserve();
    if (reservation.checkout_session_id) {
      const old = await stripeRequest<Session>("/v1/checkout/sessions/" + encodeURIComponent(reservation.checkout_session_id));
      validateSession(old, reservation, live);
      if (old.id !== reservation.checkout_session_id) fail("Nieprawidłowa sesja płatności.", "session_mismatch", 409);
      if (old.status === "complete" || old.payment_status !== "unpaid") {
        fail("Ta płatność została już zakończona albo jest potwierdzana.", "payment_complete", 409);
      }
      if (old.status === "open" && old.url && old.expires_at * 1000 > Date.now()) {
        return respond(request, 200, { url: old.url, session_id: old.id, payment_id: paymentId, reused: true });
      }
      if (old.status !== "expired") fail("Status poprzedniej sesji wymaga sprawdzenia.", "session_state", 409);
      const { data: cleared, error: clearError } = await serviceClient.from("ideahire_payments").update({
        stripe_checkout_session_id: null, checkout_expires_at: null, checkout_reservation_expires_at: null, status: "awaiting_payment",
      }).eq("id", paymentId).eq("stripe_checkout_session_id", old.id)
        .eq("checkout_attempt", reservation.checkout_attempt).in("status", BEFORE_PAYMENT).select("id");
      if (clearError) throw clearError;
      if (!cleared?.length) fail("Status płatności zmienił się. Odśwież podsumowanie.", "payment_state", 409);
      reservation = await reserve();
    }
    const params = new URLSearchParams();
    params.set("mode", "payment"); // Domyslny interfejs Stripe jest hostowany.
    params.set("success_url", application + "/chat/" + reservation.conversation_id + "?payment=success&session_id={CHECKOUT_SESSION_ID}");
    params.set("cancel_url", application + "/chat/" + reservation.conversation_id + "?payment=cancelled");
    params.set("client_reference_id", paymentId);
    params.set("locale", "pl"); params.set("submit_type", "pay");
    params.append("payment_method_types[]", "card"); params.append("payment_method_types[]", "blik");
    if (user.email) params.set("customer_email", user.email);
    const title = String(reservation.job_title || "Zlecenie IdeaHire").replace(/\s+/g, " ").trim().slice(0, 180);
    lineItem(params, 0, title || "Zlecenie IdeaHire", "Pełna kwota wynagrodzenia wykonawcy", reservation.work_amount_grosz);
    lineItem(params, 1, "Opłata serwisowa IdeaHire", RULES[reservation.pricing_rule_code].label, reservation.platform_fee_grosz);
    const metadata = { payment_id: paymentId, agreement_id: reservation.agreement_id,
      conversation_id: reservation.conversation_id, job_id: reservation.job_id,
      client_id: reservation.client_id, contractor_id: reservation.contractor_id, pricing_rule: reservation.pricing_rule_code };
    for (const [key, value] of Object.entries(metadata)) {
      params.set("metadata[" + key + "]", value); params.set("payment_intent_data[metadata][" + key + "]", value);
    }
    // Transfer do freelancera jest osobna operacja po odbiorze pracy.
    params.set("payment_intent_data[transfer_group]", reservation.transfer_group);
    params.set("payment_intent_data[description]", ("IdeaHire — " + title).slice(0, 500));
    const session = await stripeRequest<Session>("/v1/checkout/sessions", {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded",
        "Idempotency-Key": "ideahire_checkout_" + paymentId + "_" + reservation.checkout_attempt }, body: params.toString() });
    validateSession(session, reservation, live);
    if (session.status !== "open" || session.payment_status !== "unpaid" || !session.url) {
      fail("Sesja płatności nie jest gotowa do otwarcia.", "session_state", 409);
    }
    const { error: attachError } = await serviceClient.rpc("ideahire_attach_checkout_session", {
      p_payment_id: paymentId, p_checkout_attempt: reservation.checkout_attempt,
      p_checkout_session_id: session.id, p_checkout_expires_at: new Date(session.expires_at * 1000).toISOString(),
      p_stripe_livemode: session.livemode });
    if (attachError) throw attachError;
    return respond(request, 200, { url: session.url, session_id: session.id, payment_id: paymentId, reused: false });
  } catch (error) {
    const e = error as CheckoutError;
    const message = safeMessage(error);
    const code = String(e?.code || "checkout_error").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 120);
    console.error("CREATE CHECKOUT", { paymentId, code });
    // Zapis bledu nie moze cofnac wplaty, sporu, zwrotu ani zwolnienia srodkow.
    if (paymentId && reservation) {
      try {
        await serviceClient.from("ideahire_payments").update({ last_error_code: code, last_error_message: message,
          ...(e?.definitive && !reservation.checkout_session_id ? { status: "failed", checkout_reservation_expires_at: null } : {}),
        }).eq("id", paymentId).eq("checkout_attempt", reservation.checkout_attempt).in("status", BEFORE_PAYMENT);
      } catch { /* Odpowiedz nie ujawnia konfiguracji serwera. */ }
    }
    const status = e?.httpStatus === 409 ? 409 : e?.httpStatus === 503 || (e?.httpStatus ?? 0) >= 500 ? 503 : 400;
    return respond(request, status, { error: message, code });
  }
}
if (typeof Deno !== "undefined") Deno.serve(handleCheckout);
