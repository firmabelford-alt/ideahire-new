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
  const responseOrigin =
    origin && allowedOrigins.has(origin)
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
    throw new Error(
      "Brak wymaganej konfiguracji funkcji serwerowej.",
    );
  }
}

Deno.serve(async (request) => {
  const origin = request.headers.get("Origin");
  let stage = "configuration";
  let failureClient: ReturnType<typeof createClient> | null = null;
  let failureCaseId = "";
  let begun = false;

  if (origin && !allowedOrigins.has(origin)) {
    return jsonResponse(
      {
        ok: false,
        error: "Niedozwolone źródło żądania.",
      },
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
      {
        ok: false,
        error: "Dozwolona jest wyłącznie metoda POST.",
      },
      405,
      origin,
    );
  }

  try {
    requireServerConfiguration();

    const authorization =
      request.headers.get("Authorization") ?? "";

    if (!authorization.startsWith("Bearer ")) {
      return jsonResponse(
        {
          ok: false,
          error: "Brak aktywnej sesji administratora.",
        },
        401,
        origin,
      );
    }

    let requestBody: {
      caseId?: unknown;
      authorizeAndExecute?: unknown;
      ownerConfirmation?: unknown;
      expectedActionType?: unknown;
    };

    try {
      requestBody = await request.json();
    } catch {
      return jsonResponse(
        {
          ok: false,
          error: "Nieprawidłowa treść żądania.",
        },
        400,
        origin,
      );
    }

    const caseId =
      typeof requestBody.caseId === "string"
        ? requestBody.caseId.trim()
        : "";

    const authorizeAndExecute =
      requestBody.authorizeAndExecute === true;

    const ownerConfirmation =
      typeof requestBody.ownerConfirmation === "string"
        ? requestBody.ownerConfirmation.trim()
        : "";
    const expectedActionType = requestBody.expectedActionType;

    if (!UUID_PATTERN.test(caseId)) {
      return jsonResponse(
        {
          ok: false,
          error: "Nieprawidłowy identyfikator sprawy.",
        },
        400,
        origin,
      );
    }

    const userClient = createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: authorization,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );

    const serviceClient = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );

    stage = "authentication";
    const {
      data: authenticated,
      error: authenticationError,
    } = await userClient.auth.getUser();

    if (authenticationError || !authenticated.user) {
      return jsonResponse(
        {
          ok: false,
          error: "Sesja administratora wygasła.",
        },
        401,
        origin,
      );
    }

    failureClient = userClient;
    failureCaseId = caseId;
    stage = "case_check";

    const {
      data: existingCase,
      error: existingCaseError,
    } = await userClient
      .from("ideahire_erasure_cases")
      .select("id, status, action_type, execution_result")
      .eq("id", caseId)
      .maybeSingle();

    if (existingCaseError) {
      throw existingCaseError;
    }
    if (!existingCase) {
      return jsonResponse({ ok:false, error:"Nie znaleziono dostępnej operacji.", stage },404,origin);
    }
    if (expectedActionType !== undefined && expectedActionType !== existingCase.action_type) {
      return jsonResponse({ok:false,error:"Zakres operacji zmienił się. Odśwież dane i sprawdź go przed wykonaniem.",stage},409,origin);
    }

    if (existingCase?.status === "completed") {
      return jsonResponse(
        {
          ok: true,
          alreadyCompleted: true,
          caseId,
          actionType: existingCase.action_type,
          executionResult: existingCase.execution_result,
        },
        200,
        origin,
      );
    }

    if (existingCase?.status === "awaiting_owner") {
      if (
        !authorizeAndExecute ||
        ownerConfirmation !== "ZATWIERDZAM USUNIECIE"
      ) {
        return jsonResponse(
          {
            ok: false,
            error:
              "Operacja oczekuje na zatwierdzenie ownera poprawną frazą.",
          },
          409,
          origin,
        );
      }

      stage = "authorization";
      const {
        error: authorizationError,
      } = await userClient.rpc(
        "owner_authorize_ideahire_erasure_case",
        {
          p_case_id: caseId,
          p_confirmation: ownerConfirmation,
        },
      );

      if (authorizationError) {
        throw authorizationError;
      }
    }

    stage = "begin";
    const {
      data: beginPayload,
      error: beginError,
    } = await userClient.rpc(
      "admin_begin_ideahire_erasure_execution",
      {
        p_case_id: caseId,
      },
    );

    if (beginError) {
      throw beginError;
    }
    begun = true;

    const targetUserId =
      typeof beginPayload?.target_user_id === "string"
        ? beginPayload.target_user_id
        : "";

    const actionType = beginPayload?.action_type;

    if (
      !UUID_PATTERN.test(targetUserId) ||
      !["minimize_data", "close_account"].includes(actionType)
    ) {
      throw new Error(
        "Funkcja bazy zwróciła nieprawidłowy zakres operacji.",
      );
    }

    if (targetUserId === authenticated.user.id) {
      throw new Error(
        "Administrator nie może wykonać operacji na własnym koncie.",
      );
    }

    const avatarPaths =
      Array.isArray(beginPayload?.avatar_objects)
        ? beginPayload.avatar_objects
          .filter(
            (item: unknown) =>
              typeof item === "object" &&
              item !== null &&
              (item as { bucket_id?: unknown }).bucket_id ===
                "avatars" &&
              typeof (item as { name?: unknown }).name ===
                "string",
          )
          .map(
            (item: unknown) =>
              (item as { name: string }).name,
          )
        : [];

    let removedAvatarObjects = 0;
    stage = "avatar_files";

    for (
      let index = 0;
      index < avatarPaths.length;
      index += 1000
    ) {
      const batch =
        avatarPaths.slice(index, index + 1000);

      const {
        data: removedObjects,
        error: storageError,
      } = await serviceClient.storage
        .from("avatars")
        .remove(batch);

      if (storageError) {
        throw storageError;
      }

      if (!Array.isArray(removedObjects)) throw new Error("Brak potwierdzenia usunięcia plików profilu.");
      removedAvatarObjects += removedObjects.length;
    }

    stage = "work_files";
    const {
      data: workObjectPayload,
      error: workObjectError,
    } = await userClient.rpc(
      "admin_get_ideahire_erasure_work_objects",
      {
        p_case_id: caseId,
      },
    );

    if (workObjectError) {
      throw workObjectError;
    }

    const privateWorkPaths =
      Array.isArray(workObjectPayload?.work_objects)
        ? workObjectPayload.work_objects
          .filter(
            (item: unknown) =>
              typeof item === "object" &&
              item !== null &&
              (
                item as {
                  bucket_id?: unknown;
                }
              ).bucket_id === "ideahire-private-work" &&
              typeof (
                item as {
                  name?: unknown;
                }
              ).name === "string",
          )
          .map(
            (item: unknown) =>
              (item as { name: string }).name,
          )
        : [];

    let removedPrivateWorkObjects = 0;

    for (
      let index = 0;
      index < privateWorkPaths.length;
      index += 100
    ) {
      const batch =
        privateWorkPaths.slice(index, index + 100);

      const {
        data: removedWorkObjects,
        error: privateWorkStorageError,
      } = await serviceClient.storage
        .from("ideahire-private-work")
        .remove(batch);

      if (privateWorkStorageError) {
        throw privateWorkStorageError;
      }

      if (!Array.isArray(removedWorkObjects)) throw new Error("Brak potwierdzenia usunięcia plików roboczych.");
      removedPrivateWorkObjects += removedWorkObjects.length;
    }

    stage = "auth_metadata";
    const {
      data: targetAuthData,
      error: targetAuthError,
    } = await serviceClient.auth.admin
      .getUserById(targetUserId);

    if (
      targetAuthError ||
      !targetAuthData.user
    ) {
      throw targetAuthError ??
        new Error(
          "Nie znaleziono konta Auth użytkownika.",
        );
    }

    const clearedUserMetadata =
      Object.fromEntries(
        Object.entries(targetAuthData.user.user_metadata ?? {})
          .filter(([, value]) => value !== null)
          .map(([key]) => [key, null]),
      );

    if (
      Object.keys(clearedUserMetadata).length > 0
    ) {
      const {
        error: metadataError,
      } = await serviceClient.auth.admin
        .updateUserById(
          targetUserId,
          {
            user_metadata: clearedUserMetadata,
          },
        );

      if (metadataError) {
        throw metadataError;
      }
    }

    stage = "apply_data";
    const {
      data: dataResult,
      error: dataError,
    } = await userClient.rpc(
      "admin_apply_ideahire_erasure_data",
      {
        p_case_id: caseId,
      },
    );

    if (dataError) {
      throw dataError;
    }

    let authSoftDeleted = false;

    if (actionType === "close_account") {
      stage = "auth_closure";
      const {
        error: deleteAuthError,
      } = await serviceClient.auth.admin
        .deleteUser(targetUserId, true);

      if (deleteAuthError) {
        throw deleteAuthError;
      }

      authSoftDeleted = true;
    }

    const executionResult = {
      data_minimization: dataResult,
      avatar_objects_removed:
        removedAvatarObjects,
      private_work_objects_removed:
        removedPrivateWorkObjects,
      auth_user_metadata_cleared:
        Object.keys(clearedUserMetadata).length > 0,
      auth_optional_metadata_removed:
        Object.keys(clearedUserMetadata).length,
      auth_soft_deleted:
        authSoftDeleted,
      resumed:
        Boolean(beginPayload?.resumed),
      executed_at:
        new Date().toISOString(),
    };

    stage = "finalize";
    const {
      error: finalizeError,
    } = await userClient.rpc(
      "admin_finalize_ideahire_erasure_case",
      {
        p_case_id: caseId,
        p_auth_soft_deleted: authSoftDeleted,
        p_execution_result: executionResult,
        p_failure_reason: null,
      },
    );

    if (finalizeError) {
      throw finalizeError;
    }

    return jsonResponse(
      {
        ok: true,
        caseId,
        actionType,
        authSoftDeleted,
        removedAvatarObjects,
        removedPrivateWorkObjects,
        executionResult,
      },
      200,
      origin,
    );
  } catch (error) {
    console.error(
      "ideahire-admin-erasure failed",
      error,
    );

    const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "ERASURE_FAILED";
    const message = code === "23503"
      ? "Usuwanie przerwano na danych powiązanych z historią współpracy. Odśwież zakres przed wznowieniem."
      : code === "42501" ? "Brak uprawnień do wykonania tej operacji."
      : publicErrorMessage(error);
    if (begun && failureClient && failureCaseId) {
      try {
        const noted = await failureClient.rpc("admin_note_ideahire_erasure_failure", {
          p_case_id:failureCaseId,p_stage:stage,p_error_code:code,p_message:message,
        });
        if (noted.error) console.error("erasure failure journal unavailable",noted.error.code);
      } catch { console.error("erasure failure journal unavailable"); }
    }
    return jsonResponse(
      {
        ok: false,
        error: message,
        code,
        stage,
        caseId:failureCaseId || undefined,
        resumable:begun,
        retryable:false,
      },
      code === "42501" ? 403 : code === "23503" ? 409 : 400,
      origin,
    );
  }
});
