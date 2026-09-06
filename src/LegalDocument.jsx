/* IDEA HIRE — STRIPE CONNECT DIAGNOSTYKA WYMUSZONA — BUILD 2026-09-05-V2 */

import Stripe from "npm:stripe@^22.0.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get(
  "SUPABASE_SERVICE_ROLE_KEY",
);
const IDEAHIRE_SITE_URL = (
  Deno.env.get("IDEAHIRE_SITE_URL") ??
  "https://ideahire-new.pages.dev"
).replace(/\/$/, "");

if (!STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY secret.");
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase server environment variables.");
}

const stripe = new Stripe(STRIPE_SECRET_KEY);
const DIAGNOSTIC_BUILD = "IH-CONNECT-DIAG-20260905-V2";

const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

function isAllowedOrigin(origin: string | null) {
  if (!origin) return true;

  if (
    origin === IDEAHIRE_SITE_URL ||
    origin === "http://localhost:5173"
  ) {
    return true;
  }

  try {
    const url = new URL(origin);

    return (
      url.protocol === "https:" &&
      url.hostname.endsWith(".ideahire-new.pages.dev")
    );
  } catch {
    return false;
  }
}

function corsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin":
      origin && isAllowedOrigin(origin)
        ? origin
        : IDEAHIRE_SITE_URL,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Cache-Control": "no-store",
    Vary: "Origin",
  };
}

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  origin: string | null,
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(origin),
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

function connectStatus(account: Stripe.Account) {
  if (account.details_submitted && account.payouts_enabled) {
    return "ready";
  }

  if (account.requirements?.disabled_reason) {
    return "restricted";
  }

  return "in_progress";
}

function sanitizeDiagnosticMessage(message: string) {
  return message
    .replace(
      /\b(?:sk|rk|pk)_(?:test|live)_[A-Za-z0-9_\-]+\b/gi,
      "[UKRYTY_KLUCZ]",
    )
    .replace(
      /Bearer\s+[A-Za-z0-9._\-]+/gi,
      "Bearer [UKRYTY_TOKEN]",
    )
    .slice(0, 600);
}

Deno.serve(async (request) => {
  const origin = request.headers.get("Origin");

  if (!isAllowedOrigin(origin)) {
    return jsonResponse(
      { error: "Origin is not allowed." },
      403,
      origin,
    );
  }

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(origin),
    });
  }

  if (request.method !== "POST") {
    return jsonResponse(
      { error: "Method not allowed." },
      405,
      origin,
    );
  }

  const authorization = request.headers.get("Authorization");
  const accessToken = authorization?.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : "";

  if (!accessToken) {
    return jsonResponse(
      { error: "Musisz być zalogowany." },
      401,
      origin,
    );
  }

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(accessToken);

  if (userError || !user) {
    return jsonResponse(
      { error: "Sesja użytkownika jest nieprawidłowa." },
      401,
      origin,
    );
  }

  if (!user.email) {
    return jsonResponse(
      { error: "Konto nie ma potwierdzonego adresu e-mail." },
      400,
      origin,
    );
  }

  const { data: ageStatus, error: ageError } =
    await supabaseAdmin.rpc("ideahire_age_access_status", {
      p_user_id: user.id,
    });

  if (ageError) {
    console.error("CONNECT AGE CHECK ERROR", ageError.message);

    return jsonResponse(
      { error: "Nie udało się sprawdzić uprawnień konta." },
      500,
      origin,
    );
  }

  if (ageStatus !== "adult") {
    return jsonResponse(
      {
        error:
          "Połączenie wypłat jest dostępne wyłącznie dla pełnoletnich użytkowników.",
      },
      403,
      origin,
    );
  }

  let currentStage = "odczyt_konta_z_bazy";

  try {
    const { data: savedAccount, error: savedAccountError } =
      await supabaseAdmin
        .from("ideahire_stripe_accounts")
        .select(
          "user_id, stripe_account_id, onboarding_status, details_submitted, charges_enabled, payouts_enabled",
        )
        .eq("user_id", user.id)
        .maybeSingle();

    if (savedAccountError) {
      throw savedAccountError;
    }

    let stripeAccount: Stripe.Account;

    if (savedAccount?.stripe_account_id) {
      currentStage = "pobranie_konta_stripe";

      stripeAccount = await stripe.accounts.retrieve(
        savedAccount.stripe_account_id,
      );
    } else {
      currentStage = "utworzenie_konta_stripe";

      stripeAccount = await stripe.accounts.create(
        {
          type: "express",
          country: "PL",
          email: user.email,
          capabilities: {
            transfers: {
              requested: true,
            },
          },
          metadata: {
            ideahire_user_id: user.id,
          },
        },
        {
          idempotencyKey: `ideahire-connect-account-${user.id}`,
        },
      );
    }

    const onboardingStatus = connectStatus(stripeAccount);

    currentStage = "zapis_konta_w_supabase";

    const { error: saveError } = await supabaseAdmin
      .from("ideahire_stripe_accounts")
      .upsert(
        {
          user_id: user.id,
          stripe_account_id: stripeAccount.id,
          onboarding_status: onboardingStatus,
          details_submitted: Boolean(
            stripeAccount.details_submitted,
          ),
          charges_enabled: Boolean(stripeAccount.charges_enabled),
          payouts_enabled: Boolean(stripeAccount.payouts_enabled),
          disabled_reason:
            stripeAccount.requirements?.disabled_reason ?? null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        },
      );

    if (saveError) {
      throw saveError;
    }

    if (onboardingStatus === "ready") {
      return jsonResponse(
        {
          ok: true,
          status: "ready",
          onboarding_url: null,
        },
        200,
        origin,
      );
    }

    currentStage = "utworzenie_linku_onboardingowego";

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccount.id,
      refresh_url:
        `${IDEAHIRE_SITE_URL}/account?stripe_connect=refresh`,
      return_url:
        `${IDEAHIRE_SITE_URL}/account?stripe_connect=return`,
      type: "account_onboarding",
    });

    return jsonResponse(
      {
        ok: true,
        status: onboardingStatus,
        onboarding_url: accountLink.url,
        expires_at: accountLink.expires_at,
      },
      200,
      origin,
    );
  } catch (error) {
    const rawMessage =
      error instanceof Error ? error.message : "Unknown error";

    const message = sanitizeDiagnosticMessage(rawMessage);

    const errorCode =
      typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof error.code === "string"
        ? error.code
        : "brak_kodu";

    console.error(
      "CONNECT ONBOARDING ERROR",
      JSON.stringify({
        stage: currentStage,
        code: errorCode,
        message,
      }),
    );

    const publicMessage =
      `${DIAGNOSTIC_BUILD} | etap: ${currentStage} | kod: ${errorCode} | szczegóły: ${message}`;

    return jsonResponse(
      {
        error: publicMessage,
        diagnostic_build: DIAGNOSTIC_BUILD,
        diagnostic_stage: currentStage,
        diagnostic_code: errorCode,
      },
      500,
      origin,
    );
  }
});
