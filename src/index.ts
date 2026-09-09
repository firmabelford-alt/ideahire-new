import { createClient } from "npm:@supabase/supabase-js@2.53.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const DEFAULT_ALLOWED_ORIGINS = [
  "https://ideahire-new.pages.dev",
  "https://3438c65b.ideahire-new.pages.dev",
  "http://localhost:5173",
];

const configuredAllowedOrigins = (
  Deno.env.get("IDEAHIRE_ALLOWED_ORIGINS") ?? ""
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = new Set([
  ...DEFAULT_ALLOWED_ORIGINS,
  ...configuredAllowedOrigins,
]);

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function corsHeaders(origin: string | null) {
  const responseOrigin = origin && allowedOrigins.has(origin)
    ? origin
    : DEFAULT_ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": responseOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Content-Type": "application/json; charset=utf-8",
    "Vary": "Origin",
  };
}

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  origin: string | null,
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders(origin),
  });
}

function publicErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message.slice(0, 500);
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.trim()
  ) {
    return error.message.slice(0, 500);
  }

  return "Nie udało się bezpiecznie wykonać operacji.";
}

function requireServerConfiguration() {
  if (
    !SUPABASE_URL ||
    !SUPABASE_ANON_KEY ||
    !SUPABASE_SERVICE_ROLE_KEY
  ) {
    throw new Error("Brak wymaganej konfiguracji funkcji serwerowej.");
  }
}

Deno.serve(async (request) => {
  const origin = request.headers.get("Origin");

  if (origin && !allowedOrigins.has(origin)) {
    return jsonResponse(
      { ok: false, error: "Niedozwolone źródło żądania." },
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
      { ok: false, error: "Dozwolona jest wyłącznie metoda POST." },
      405,
      origin,
    );
  }

  try {
    requireServerConfiguration();

    const authorization = request.headers.get("Authorization") ?? "";
    if (!authorization.startsWith("Bearer ")) {
      return jsonResponse(
        { ok: false, error: "Brak aktywnej sesji administratora." },
        401,
        origin,
      );
    }

    let requestBody: { caseId?: unknown };
    try {
      requestBody = await request.json();
    } catch {
      return jsonResponse(
        { ok: false, error: "Nieprawidłowa treść żądania." },
        400,
        origin,
      );
    }

    const caseId = typeof requestBody.caseId === "string"
      ? requestBody.caseId.trim()
      : "";

    if (!UUID_PATTERN.test(caseId)) {
      return jsonResponse(
        { ok: false, error: "Nieprawidłowy identyfikator sprawy." },
        400,
        origin,
      );
    }

    const userClient = createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        global: { headers: { Authorization: authorization } },
        auth: { persistSession: false, autoRefreshToken: false },
      },
    );

    const serviceClient = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: { persistSession: false, autoRefreshToken: false },
      },
    );

    const { data: authenticated, error: authenticationError } =
      await userClient.auth.getUser();

    if (authenticationError || !authenticated.user) {
      return jsonResponse(
        { ok: false, error: "Sesja administratora wygasła." },
        401,
        origin,
      );
    }

    const { data: existingCase, error: existingCaseError } = await userClient
      .from("ideahire_erasure_cases")
      .select("id, status, action_type")
      .eq("id", caseId)
      .maybeSingle();

    if (existingCaseError) throw existingCaseError;

    if (existingCase?.status === "completed") {
      return jsonResponse(
        {
          ok: true,
          alreadyCompleted: true,
          caseId,
          actionType: existingCase.action_type,
        },
        200,
        origin,
      );
    }

    const { data: beginPayload, error: beginError } = await userClient.rpc(
      "admin_begin_ideahire_erasure_execution",
      { p_case_id: caseId },
    );

    if (beginError) throw beginError;

    const targetUserId = typeof beginPayload?.target_user_id === "string"
      ? beginPayload.target_user_id
      : "";
    const actionType = beginPayload?.action_type;

    if (
      !UUID_PATTERN.test(targetUserId) ||
      !["minimize_data", "close_account"].includes(actionType)
    ) {
      throw new Error("Funkcja bazy zwróciła nieprawidłowy zakres operacji.");
    }

    if (targetUserId === authenticated.user.id) {
      throw new Error("Administrator nie może wykonać operacji na własnym koncie.");
    }

    const avatarPaths = Array.isArray(beginPayload?.avatar_objects)
      ? beginPayload.avatar_objects
        .filter((item: unknown) => (
          typeof item === "object" &&
          item !== null &&
          (item as { bucket_id?: unknown }).bucket_id === "avatars" &&
          typeof (item as { name?: unknown }).name === "string"
        ))
        .map((item: unknown) => (item as { name: string }).name)
      : [];

    let removedAvatarObjects = 0;
    for (let index = 0; index < avatarPaths.length; index += 1000) {
      const batch = avatarPaths.slice(index, index + 1000);
      const { error: storageError } = await serviceClient.storage
        .from("avatars")
        .remove(batch);

      if (storageError) throw storageError;
      removedAvatarObjects += batch.length;
    }

    const { data: targetAuthData, error: targetAuthError } =
      await serviceClient.auth.admin.getUserById(targetUserId);

    if (targetAuthError || !targetAuthData.user) {
      throw targetAuthError ?? new Error("Nie znaleziono konta Auth użytkownika.");
    }

    const clearedUserMetadata = Object.fromEntries(
      Object.keys(targetAuthData.user.user_metadata ?? {})
        .map((key) => [key, null]),
    );

    if (Object.keys(clearedUserMetadata).length > 0) {
      const { error: metadataError } =
        await serviceClient.auth.admin.updateUserById(targetUserId, {
          user_metadata: clearedUserMetadata,
        });

      if (metadataError) throw metadataError;
    }

    const { data: dataResult, error: dataError } = await userClient.rpc(
      "admin_apply_ideahire_erasure_data",
      { p_case_id: caseId },
    );

    if (dataError) throw dataError;

    let authSoftDeleted = false;
    if (actionType === "close_account") {
      const { error: deleteAuthError } =
        await serviceClient.auth.admin.deleteUser(targetUserId, true);

      if (deleteAuthError) throw deleteAuthError;
      authSoftDeleted = true;
    }

    const executionResult = {
      data_minimization: dataResult,
      avatar_objects_removed: removedAvatarObjects,
      auth_user_metadata_cleared:
        Object.keys(clearedUserMetadata).length > 0,
      auth_soft_deleted: authSoftDeleted,
      resumed: Boolean(beginPayload?.resumed),
      executed_at: new Date().toISOString(),
    };

    const { error: finalizeError } = await userClient.rpc(
      "admin_finalize_ideahire_erasure_case",
      {
        p_case_id: caseId,
        p_auth_soft_deleted: authSoftDeleted,
        p_execution_result: executionResult,
        p_failure_reason: null,
      },
    );

    if (finalizeError) throw finalizeError;

    return jsonResponse(
      {
        ok: true,
        caseId,
        actionType,
        authSoftDeleted,
        removedAvatarObjects,
      },
      200,
      origin,
    );
  } catch (error) {
    console.error("ideahire-admin-erasure failed", error);

    return jsonResponse(
      {
        ok: false,
        error: publicErrorMessage(error),
        retryable: true,
      },
      400,
      origin,
    );
  }
});
