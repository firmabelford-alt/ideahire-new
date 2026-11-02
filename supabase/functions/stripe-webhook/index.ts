/* IdeaHire | Stripe Webhook | 2026-10-12 | Supabase: stripe-webhook / index.ts */
import { createClient } from "npm:@supabase/supabase-js@2.53.0";

type JsonObject = Record<string, unknown>;
type Env = { SUPABASE_URL?: string; SUPABASE_SERVICE_ROLE_KEY?: string; STRIPE_WEBHOOK_SECRET?: string };
type StripeEvent = { id: string; object: string; type: string; created: number;
  livemode: boolean; account?: string; data: { object: JsonObject } };
type Payment = { id: string; stripe_livemode: boolean | null };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_BODY_BYTES = 1024 * 1024;
const HANDLED_EVENTS = new Set([
  "checkout.session.completed", "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed", "checkout.session.expired",
  "payment_intent.succeeded", "payment_intent.payment_failed",
  "charge.refunded", "charge.dispute.created", "charge.dispute.updated", "charge.dispute.closed",
  "refund.created", "refund.updated", "refund.failed",
  "transfer.created", "transfer.updated", "transfer.reversed",
]);

function response(status: number, body: JsonObject): Response {
  return new Response(JSON.stringify(body), { status, headers: {
    "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  } });
}
function reject(code: string): never { throw Object.assign(new Error(code), { code }); }
function objectValue(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : {};
}
function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
function integerValue(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : null;
}
function reference(value: unknown): string | null {
  return stringValue(value) ?? stringValue(objectValue(value).id);
}
function requireId(value: unknown, kind: string): string {
  const id = reference(value);
  const pattern = kind === "cs" ? /^cs_(?:test_|live_)?[A-Za-z0-9]+$/
    : kind === "charge" ? /^(?:ch|py)_[A-Za-z0-9]+$/
    : kind === "re" ? /^(?:re|pyr)_[A-Za-z0-9]+$/
    : new RegExp("^" + kind + "_[A-Za-z0-9]+$");
  if (!id || id.length > 255 || !pattern.test(id)) reject("invalid_object_id");
  return id;
}
function optionalId(value: unknown, kind: string): string | null {
  return value == null ? null : requireId(value, kind);
}

export async function verifyStripeSignature(raw: Uint8Array, header: string, secret: string): Promise<boolean> {
  if (!secret || !header || header.length > 8192) return false;
  const parts = header.split(",").map(part => part.trim());
  const timestamps = parts.filter(part => part.startsWith("t=")).map(part => part.slice(2));
  const signatures = parts.filter(part => part.startsWith("v1=")).map(part => part.slice(3));
  if (timestamps.length !== 1 || !/^\d{1,12}$/.test(timestamps[0])
    || !signatures.some(value => /^[a-f0-9]{64}$/.test(value))) return false;
  const timestamp = Number(timestamps[0]);
  if (!Number.isSafeInteger(timestamp) || Math.abs(Math.floor(Date.now() / 1000) - timestamp) > 300) return false;
  // HMAC jest liczony z oryginalnych bajtow, przed parsowaniem JSON.
  const prefix = new TextEncoder().encode(timestamps[0] + ".");
  const signed = new Uint8Array(prefix.length + raw.length);
  signed.set(prefix); signed.set(raw, prefix.length);
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = new Uint8Array(await crypto.subtle.sign("HMAC", key, signed));
  const expected = Array.from(digest).map(byte => byte.toString(16).padStart(2, "0")).join("");
  let verified = false;
  for (const value of signatures) {
    if (!/^[a-f0-9]{64}$/.test(value)) continue;
    let difference = 0;
    for (let index = 0; index < expected.length; index++) difference |= expected.charCodeAt(index) ^ value.charCodeAt(index);
    verified = difference === 0 || verified;
  }
  return verified;
}
async function readRawBody(request: Request): Promise<Uint8Array> {
  const declared = request.headers.get("Content-Length");
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > MAX_BODY_BYTES)) reject("size");
  const reader = request.body?.getReader();
  if (!reader) reject("invalid_body");
  const chunks: Uint8Array[] = []; let length = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      length += chunk.value.byteLength;
      if (length > MAX_BODY_BYTES) { await reader.cancel(); reject("size"); }
      chunks.push(chunk.value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(length); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return bytes;
}
export function validateEvent(value: unknown): StripeEvent {
  const e = objectValue(value);
  const data = objectValue(e.data);
  if (e.object !== "event" || typeof e.id !== "string" || !/^evt_[A-Za-z0-9]+$/.test(e.id) || e.id.length > 255
    || typeof e.type !== "string" || e.type.length > 120 || !/^[a-z0-9_.]+$/.test(e.type)
    || typeof e.livemode !== "boolean" || !Number.isSafeInteger(e.created) || Number(e.created) <= 0
    || Number(e.created) > Math.floor(Date.now() / 1000) + 300
    || !data.object || typeof data.object !== "object" || Array.isArray(data.object)) reject("invalid_event");
  return e as StripeEvent;
}
export function detectedPaymentMethod(object: JsonObject): string | null {
  if (objectValue(object.payment_method_details).type === "blik") return "blik";
  // Lista dozwolonych metod nie wskazuje wybranej metody ani taryfy karty.
  // Nie oznaczamy kazdej karty jako standardowej EOG: premium/inne kraje maja inne koszty.
  return null;
}

export function createWebhookHandler(env: Env, clientFactory: typeof createClient = createClient) {
  return async (request: Request): Promise<Response> => {
    if (request.method !== "POST") return response(405, { error: "Method not allowed" });
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || !env.STRIPE_WEBHOOK_SECRET) {
      console.error("STRIPE WEBHOOK", { code: "missing_configuration" });
      return response(500, { error: "Webhook configuration is incomplete" });
    }
    let event: StripeEvent;
    try {
      const raw = await readRawBody(request);
      if (!await verifyStripeSignature(raw, request.headers.get("Stripe-Signature") ?? "", env.STRIPE_WEBHOOK_SECRET)) {
        return response(400, { error: "Invalid Stripe signature" });
      }
      event = validateEvent(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(raw)));
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === "size") return response(413, { error: "Webhook payload is too large" });
      if (code?.startsWith("invalid_") || error instanceof SyntaxError || error instanceof TypeError) {
        return response(400, { error: "Invalid Stripe event" });
      }
      console.error("STRIPE WEBHOOK", { code: "verification_unavailable" });
      return response(500, { error: "Webhook verification is temporarily unavailable" });
    }
    if (!HANDLED_EVENTS.has(event.type)) return response(200, { received: true, ignored: true });
    // Checkout i transfery tego modelu powstaja na koncie platformy.
    if (event.account) return response(200, { received: true, ignored: true, reason: "connected_account" });

    try {
      const serviceClient = clientFactory(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { fetch: (input: RequestInfo | URL, init?: RequestInit) =>
          fetch(input, { ...init, signal: AbortSignal.timeout(15000) }) },
      });
      const object = event.data.object;
      if (object.livemode !== undefined && object.livemode !== event.livemode) reject("invalid_object_mode");
      const { data: managed, error: managedError } = await serviceClient.rpc("ideahire_observe_financial_event", {
        p_event_id: event.id, p_type: event.type, p_object: object, p_livemode: event.livemode, p_created: event.created,
      });
      if (managedError) throw Object.assign(new Error("Financial event routing unavailable"), { code: "financial_event_apply" });
      if (managed === true) return response(200, { received: true, financial_event: true });
      const metadata = objectValue(object.metadata);
      let paymentId = stringValue(metadata.payment_id);
      if (paymentId && !UUID.test(paymentId)) reject("invalid_payment_id");
      let checkoutSessionId: string | null = null;
      let paymentIntentId: string | null = null;
      let chargeId: string | null = null;
      let refundId: string | null = null;
      let amountTotalGrosz: number | null = null;
      let amountRefundedGrosz: number | null = null;
      const currency = stringValue(object.currency)?.toLowerCase() ?? null;
      let paymentStatus = stringValue(object.payment_status);
      const paymentMethod = detectedPaymentMethod(object);
      let deliveryId: string | null = null;
      let transferId: string | null = null;
      let transferDestination: string | null = null;
      let transferAmountGrosz: number | null = null;
      let transferAmountReversedGrosz = 0;
      let transferReversed = false;

      if (event.type.startsWith("checkout.session.")) {
        if (object.object !== "checkout.session") reject("invalid_object_type");
        checkoutSessionId = requireId(object.id, "cs");
        paymentIntentId = optionalId(object.payment_intent, "pi");
        amountTotalGrosz = integerValue(object.amount_total);
        const clientReference = stringValue(object.client_reference_id);
        if (clientReference && UUID.test(clientReference)) {
          if (paymentId && paymentId !== clientReference) reject("invalid_payment_reference");
          paymentId = paymentId ?? clientReference;
        }
        if (!currency || amountTotalGrosz === null || !["paid", "unpaid", "no_payment_required"].includes(paymentStatus ?? "")) reject("invalid_checkout");
        if (event.type === "checkout.session.async_payment_succeeded" && paymentStatus !== "paid") reject("invalid_checkout");
        if (paymentStatus === "paid" && !paymentIntentId) reject("invalid_checkout");
      } else if (event.type.startsWith("payment_intent.")) {
        if (object.object !== "payment_intent") reject("invalid_object_type");
        paymentIntentId = requireId(object.id, "pi");
        chargeId = optionalId(object.latest_charge, "charge");
        amountTotalGrosz = integerValue(event.type === "payment_intent.succeeded" ? object.amount_received : object.amount);
        paymentStatus = stringValue(object.status);
        if (!currency || amountTotalGrosz === null || event.type === "payment_intent.succeeded" && paymentStatus !== "succeeded") reject("invalid_payment_intent");
      } else if (event.type === "charge.refunded") {
        if (object.object !== "charge") reject("invalid_object_type");
        chargeId = requireId(object.id, "charge");
        paymentIntentId = optionalId(object.payment_intent, "pi");
        amountTotalGrosz = integerValue(object.amount);
        amountRefundedGrosz = integerValue(object.amount_refunded);
        const refunds = objectValue(object.refunds);
        const rows = Array.isArray(refunds.data) ? refunds.data : [];
        refundId = optionalId(objectValue(rows[0]).id, "re");
        if (!currency || amountTotalGrosz === null || amountRefundedGrosz === null) reject("invalid_refund");
      } else if (event.type === "charge.dispute.created") {
        if (object.object !== "dispute") reject("invalid_object_type");
        requireId(object.id, "dp");
        chargeId = requireId(object.charge, "charge");
        paymentIntentId = optionalId(object.payment_intent, "pi");
        amountTotalGrosz = integerValue(object.amount);
        if (!currency || amountTotalGrosz === null) reject("invalid_dispute");
      } else {
        if (object.object !== "transfer") reject("invalid_object_type");
        deliveryId = stringValue(metadata.delivery_id);
        transferId = requireId(object.id, "tr");
        transferDestination = requireId(object.destination, "acct");
        transferAmountGrosz = integerValue(object.amount);
        const reversedAmount = integerValue(object.amount_reversed ?? 0);
        if (!deliveryId || !UUID.test(deliveryId) || transferAmountGrosz === null
          || reversedAmount === null || reversedAmount > transferAmountGrosz
          || typeof object.reversed !== "boolean" || !currency) reject("invalid_transfer");
        transferAmountReversedGrosz = reversedAmount;
        transferReversed = object.reversed;
      }

      async function lookup(column: string, id: string): Promise<Payment | null> {
        const { data, error } = await serviceClient.from("ideahire_payments")
          .select("id,stripe_livemode").eq(column, id).maybeSingle();
        if (error) throw Object.assign(new Error("Payment lookup failed"), { code: "database_lookup" });
        return data as Payment | null;
      }
      let payment: Payment | null = paymentId ? await lookup("id", paymentId) : null;
      if (!paymentId) {
        for (const [column, id] of [
          ["stripe_payment_intent_id", paymentIntentId], ["stripe_charge_id", chargeId],
          ["stripe_checkout_session_id", checkoutSessionId], ["stripe_transfer_id", transferId],
        ]) {
          if (id && !payment) payment = await lookup(column!, id);
        }
      }
      // Zdarzenie moze przyjsc przed zapisem ID przez inny callback. Stripe ma je ponowic.
      if (!payment || !UUID.test(payment.id)) reject("payment_not_found");
      paymentId = payment.id;
      if (payment.stripe_livemode !== null && payment.stripe_livemode !== event.livemode) reject("stripe_mode_mismatch");
      if (transferId && payment.stripe_livemode === null) reject("stripe_transfer_mode_unknown");

      const { data: status, error } = transferId
        ? await serviceClient.rpc("ideahire_apply_stripe_transfer_event", {
          p_stripe_event_id: event.id, p_event_type: event.type, p_payment_id: paymentId,
          p_delivery_id: deliveryId, p_transfer_id: transferId, p_destination: transferDestination,
          p_amount_grosz: transferAmountGrosz, p_amount_reversed_grosz: transferAmountReversedGrosz,
          p_currency: currency, p_reversed: transferReversed,
        })
        : await serviceClient.rpc("ideahire_apply_stripe_event", {
          p_stripe_event_id: event.id, p_event_type: event.type, p_payment_id: paymentId,
          p_checkout_session_id: checkoutSessionId, p_payment_intent_id: paymentIntentId,
          p_charge_id: chargeId, p_refund_id: refundId, p_livemode: event.livemode,
          p_amount_total_grosz: amountTotalGrosz, p_amount_refunded_grosz: amountRefundedGrosz,
          p_currency: currency, p_payment_status: paymentStatus, p_payment_method: paymentMethod,
          p_event_created_at: new Date(event.created * 1000).toISOString(),
        });
      if (error) throw Object.assign(new Error("Could not apply Stripe event"), { code: "database_apply" });
      return response(200, { received: true, payment_id: paymentId,
        ...(transferId ? { transfer_id: transferId } : {}), status });
    } catch (error) {
      const rawCode = (error as { code?: string }).code;
      const code = typeof rawCode === "string" ? rawCode.replace(/[^a-z0-9_]/gi, "").slice(0, 80) : "webhook_unavailable";
      console.error("STRIPE WEBHOOK", { eventId: event.id, eventType: event.type, code });
      return response(code.startsWith("invalid_") ? 400 : 500, {
        error: code.startsWith("invalid_") ? "Invalid Stripe event" : "Could not apply Stripe event", code,
      });
    }
  };
}

if (typeof Deno !== "undefined") Deno.serve(createWebhookHandler({
  SUPABASE_URL: Deno.env.get("SUPABASE_URL"),
  SUPABASE_SERVICE_ROLE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
  STRIPE_WEBHOOK_SECRET: Deno.env.get("STRIPE_WEBHOOK_SECRET"),
}));


