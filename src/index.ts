import { createClient } from "npm:@supabase/supabase-js@2.53.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const PRIVATE_BUCKET = "ideahire-private-work";
const MAX_ITEMS = 24;
const MAX_FILE_BYTES = 50 * 1024 * 1024;
const MAX_BATCH_BYTES = 150 * 1024 * 1024;

const ALLOWED_ORIGINS = new Set([
  "https://ideahire-new.pages.dev",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

type Json = Record<string, unknown>;
type FileSpec = {
  id: string;
  display_name: string;
  extension: string;
  mime_type: string;
  byte_size: number;
  material_kind: string;
  path: string;
};

const EXTENSIONS: Record<string, { mime: string; kind: string; signature: string }> = {
  jpg: { mime: "image/jpeg", kind: "image", signature: "jpg" },
  jpeg: { mime: "image/jpeg", kind: "image", signature: "jpg" },
  png: { mime: "image/png", kind: "image", signature: "png" },
  webp: { mime: "image/webp", kind: "image", signature: "webp" },
  psd: { mime: "image/vnd.adobe.photoshop", kind: "design", signature: "psd" },
  pdf: { mime: "application/pdf", kind: "document", signature: "pdf" },
  txt: { mime: "text/plain", kind: "document", signature: "text" },
  md: { mime: "text/markdown", kind: "written_work", signature: "text" },
  csv: { mime: "text/csv", kind: "document", signature: "text" },
  json: { mime: "application/json", kind: "source_code", signature: "text" },
  xml: { mime: "application/xml", kind: "source_code", signature: "text" },
  html: { mime: "text/html", kind: "source_code", signature: "text" },
  htm: { mime: "text/html", kind: "source_code", signature: "text" },
  css: { mime: "text/css", kind: "source_code", signature: "text" },
  js: { mime: "text/javascript", kind: "source_code", signature: "text" },
  jsx: { mime: "text/javascript", kind: "source_code", signature: "text" },
  ts: { mime: "text/plain", kind: "source_code", signature: "text" },
  tsx: { mime: "text/plain", kind: "source_code", signature: "text" },
  py: { mime: "text/plain", kind: "source_code", signature: "text" },
  java: { mime: "text/plain", kind: "source_code", signature: "text" },
  php: { mime: "text/plain", kind: "source_code", signature: "text" },
  sql: { mime: "text/plain", kind: "source_code", signature: "text" },
  zip: { mime: "application/zip", kind: "archive", signature: "zip" },
  rar: { mime: "application/vnd.rar", kind: "archive", signature: "rar" },
  "7z": { mime: "application/x-7z-compressed", kind: "archive", signature: "7z" },
  doc: { mime: "application/msword", kind: "document", signature: "ole" },
  docx: { mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", kind: "document", signature: "zip" },
  xls: { mime: "application/vnd.ms-excel", kind: "document", signature: "ole" },
  xlsx: { mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", kind: "document", signature: "zip" },
  ppt: { mime: "application/vnd.ms-powerpoint", kind: "document", signature: "ole" },
  pptx: { mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation", kind: "document", signature: "zip" },
  odt: { mime: "application/vnd.oasis.opendocument.text", kind: "document", signature: "zip" },
  ods: { mime: "application/vnd.oasis.opendocument.spreadsheet", kind: "document", signature: "zip" },
  odp: { mime: "application/vnd.oasis.opendocument.presentation", kind: "document", signature: "zip" },
  mp4: { mime: "video/mp4", kind: "video", signature: "mp4" },
  webm: { mime: "video/webm", kind: "video", signature: "webm" },
  mov: { mime: "video/quicktime", kind: "video", signature: "mp4" },
  mp3: { mime: "audio/mpeg", kind: "audio", signature: "mp3" },
  wav: { mime: "audio/wav", kind: "audio", signature: "wav" },
  ogg: { mime: "audio/ogg", kind: "audio", signature: "ogg" },
};

function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("Origin") ?? "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.has(origin)
      ? origin
      : "https://ideahire-new.pages.dev",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

function reply(request: Request, status: number, body: Json): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(request),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function text(value: unknown, max = 4000): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function safeUuid(value: unknown): string | null {
  const candidate = text(value, 80);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidate)
    ? candidate
    : null;
}

function normalizeHttps(value: unknown): string {
  const url = new URL(text(value, 2048));
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new Error("Link musi używać HTTPS i nie może zawierać loginu ani hasła w adresie.");
  }
  return url.toString();
}

function containsPlainSecret(value: unknown): boolean {
  return /\b(has[łl]o|password|passwd|token|api[_ -]?key|secret|kod\s*(2fa|mfa)|recovery\s*code)\b\s*[:=]/i.test(text(value, 20000));
}

function cleanFileName(value: unknown): { name: string; extension: string } {
  const original = text(value, 180).normalize("NFKC");
  const safe = original.replace(/[\\/\u0000-\u001f\u007f]/g, "_").replace(/\s+/g, " ").trim();
  const extension = safe.includes(".") ? safe.split(".").pop()!.toLowerCase() : "";
  if (!safe || !EXTENSIONS[extension]) {
    throw new Error(`Plik „${safe || "bez nazwy"}” ma niedozwolone rozszerzenie.`);
  }
  return { name: safe, extension };
}

function resolveSpec(raw: Json, batchId: string, conversationId: string, userId: string): FileSpec {
  const { name, extension } = cleanFileName(raw.displayName);
  const definition = EXTENSIONS[extension];
  const byteSize = Number(raw.byteSize);
  if (!Number.isSafeInteger(byteSize) || byteSize < 1 || byteSize > MAX_FILE_BYTES) {
    throw new Error(`Plik „${name}” musi mieć od 1 B do 50 MB.`);
  }
  const id = crypto.randomUUID();
  const storedName = `${crypto.randomUUID()}.${extension}`;
  return {
    id,
    display_name: name,
    extension,
    mime_type: definition.mime,
    byte_size: byteSize,
    material_kind: definition.kind,
    path: `${conversationId}/${userId}/${batchId}/${storedName}`,
  };
}

function starts(bytes: Uint8Array, signature: number[]): boolean {
  return signature.every((value, index) => bytes[index] === value);
}

function ascii(bytes: Uint8Array, start: number, end: number): string {
  return new TextDecoder("latin1").decode(bytes.slice(start, end));
}

function signatureMatches(extension: string, bytes: Uint8Array): boolean {
  const signature = EXTENSIONS[extension]?.signature;
  if (!signature || bytes.length < 4) return false;
  if (signature === "jpg") return starts(bytes, [0xff, 0xd8, 0xff]);
  if (signature === "png") return starts(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (signature === "webp") return ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP";
  if (signature === "psd") return ascii(bytes, 0, 4) === "8BPS";
  if (signature === "pdf") return ascii(bytes, 0, 5) === "%PDF-";
  if (signature === "zip") return starts(bytes, [0x50, 0x4b, 0x03, 0x04]) || starts(bytes, [0x50, 0x4b, 0x05, 0x06]) || starts(bytes, [0x50, 0x4b, 0x07, 0x08]);
  if (signature === "rar") return ascii(bytes, 0, 4) === "Rar!";
  if (signature === "7z") return starts(bytes, [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c]);
  if (signature === "ole") return starts(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
  if (signature === "mp4") return ascii(bytes, 4, 8) === "ftyp";
  if (signature === "webm") return starts(bytes, [0x1a, 0x45, 0xdf, 0xa3]);
  if (signature === "mp3") return ascii(bytes, 0, 3) === "ID3" || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);
  if (signature === "wav") return ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WAVE";
  if (signature === "ogg") return ascii(bytes, 0, 4) === "OggS";
  if (signature === "text") return !bytes.some((value) => value === 0);
  return false;
}

async function readPrefix(path: string): Promise<Uint8Array> {
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  const result = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${PRIVATE_BUCKET}/${encodedPath}`,
    {
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Range: "bytes=0-8191",
      },
    },
  );
  if (!result.ok || ![200, 206].includes(result.status)) {
    throw new Error("Nie udało się zweryfikować zawartości przesłanego pliku.");
  }
  // Storage may ignore Range. Read only the signature instead of buffering a 50 MB file.
  const reader = result.body?.getReader();
  if (!reader) throw new Error("Nie udało się odczytać zawartości przesłanego pliku.");
  const prefix = new Uint8Array(8192);
  let length = 0;
  try {
    while (length < prefix.length) {
      const { done, value } = await reader.read();
      if (done) break;
      const part = value.subarray(0, prefix.length - length);
      prefix.set(part, length);
      length += part.length;
    }
  } finally {
    try { await reader.cancel(); } catch { /* Only the verified prefix is needed. */ }
    reader.releaseLock();
  }
  return prefix.subarray(0, length);
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request) });
  if (request.method !== "POST") return reply(request, 405, { ok: false, error: "Method not allowed" });
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return reply(request, 500, { ok: false, error: "Brak konfiguracji funkcji serwerowej." });

  const authorization = request.headers.get("Authorization") ?? "";
  const jwt = authorization.replace(/^Bearer\s+/i, "").trim();
  if (!jwt) return reply(request, 401, { ok: false, error: "Zaloguj się ponownie." });

  const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await service.auth.getUser(jwt);
  const user = userData?.user;
  if (userError || !user) return reply(request, 401, { ok: false, error: "Sesja wygasła. Zaloguj się ponownie." });

  let body: Json;
  try {
    body = await request.json();
  } catch {
    return reply(request, 400, { ok: false, error: "Nieprawidłowe dane żądania." });
  }

  const action = text(body.action, 50);
  const conversationId = safeUuid(body.conversationId);
  if (!conversationId) return reply(request, 400, { ok: false, error: "Brak prawidłowego identyfikatora rozmowy." });

  const { data: conversation, error: conversationError } = await service
    .from("conversations")
    .select("id,client_id,contractor_id")
    .eq("id", conversationId)
    .maybeSingle();
  if (conversationError || !conversation || ![conversation.client_id, conversation.contractor_id].includes(user.id)) {
    return reply(request, 403, { ok: false, error: "Nie masz dostępu do tej rozmowy." });
  }

  const { error: actorAccessError } = await service.rpc("ideahire_assert_private_work_actor", {
    p_conversation_id: conversationId,
    p_actor_user_id: user.id,
  });
  if (actorAccessError) {
    return reply(request, 403, { ok: false, error: actorAccessError.message || "Konto nie może teraz przekazywać materiałów." });
  }

  let writeAttempted = false;
  try {
    if (action === "prepare_upload") {
      const rawSpecs = Array.isArray(body.fileSpecs) ? body.fileSpecs : [];
      if (rawSpecs.length < 1 || rawSpecs.length > MAX_ITEMS) throw new Error("Jednorazowo dodaj od 1 do 24 plików.");
      const batchId = crypto.randomUUID();
      const specs = rawSpecs.map((value) => resolveSpec(value as Json, batchId, conversationId, user.id));
      const totalBytes = specs.reduce((sum, item) => sum + item.byte_size, 0);
      if (totalBytes > MAX_BATCH_BYTES) throw new Error("Łączny rozmiar paczki nie może przekroczyć 150 MB.");

      const { error: sessionError } = await service
        .from("ideahire_private_upload_sessions")
        .insert({
          id: batchId,
          conversation_id: conversationId,
          actor_user_id: user.id,
          expected_files: specs.length,
          expected_bytes: totalBytes,
          expected_manifest: specs,
          status: "prepared",
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        });
      if (sessionError) throw sessionError;

      const prepared = [];
      for (const spec of specs) {
        const { data, error } = await service.storage.from(PRIVATE_BUCKET).createSignedUploadUrl(spec.path);
        if (error || !data?.token) throw error ?? new Error("Nie udało się przygotować uploadu.");
        prepared.push({
          id: spec.id,
          path: spec.path,
          token: data.token,
          mimeType: spec.mime_type,
          materialKind: spec.material_kind,
        });
      }

      return reply(request, 200, { ok: true, batchId, files: prepared, expiresInSeconds: 900 });
    }

    if (!new Set(["send_materials", "submit_delivery"]).has(action)) {
      throw new Error("Nieobsługiwana operacja przekazania materiałów.");
    }

    const uploaded = Array.isArray(body.files) ? body.files as Json[] : [];
    const links = Array.isArray(body.links) ? body.links as Json[] : [];
    const accessEntries = Array.isArray(body.accessEntries) ? body.accessEntries as Json[] : [];
    const writtenText = text(body.writtenText, 20000);
    const items: Json[] = [];
    let defaultBatchId = crypto.randomUUID();

    if (uploaded.length) {
      const paths = uploaded.map((entry) => text(entry.path, 500));
      if (paths.some((path) => !path)) throw new Error("Lista przesłanych plików jest niepełna.");
      const firstParts = paths[0].split("/");
      defaultBatchId = safeUuid(firstParts[2]) ?? defaultBatchId;

      const { data: session, error: sessionError } = await service
        .from("ideahire_private_upload_sessions")
        .select("id,expected_files,expected_bytes,expected_manifest,status,expires_at")
        .eq("id", defaultBatchId)
        .eq("conversation_id", conversationId)
        .eq("actor_user_id", user.id)
        .maybeSingle();
      if (sessionError || !session || session.status !== "prepared" || new Date(session.expires_at).getTime() <= Date.now()) {
        throw new Error("Sesja przesyłania wygasła. Dodaj pliki ponownie.");
      }
      const manifest = Array.isArray(session.expected_manifest) ? session.expected_manifest as FileSpec[] : [];
      if (manifest.length !== uploaded.length || session.expected_files !== uploaded.length) {
        throw new Error("Liczba plików nie odpowiada przygotowanej paczce.");
      }

      if (new Set(paths).size !== paths.length) throw new Error("Lista plików zawiera powtórzenia.");
      // Validate session ownership and the full manifest before requesting storage data.
      for (const entry of uploaded) {
        if (!manifest.some((row) => row.path === text(entry.path, 500) && row.id === text(entry.id, 80))) {
          throw new Error("Plik nie należy do przygotowanej paczki.");
        }
      }
      const objects: { name: string; metadata: { size: number } }[] = [];
      const folders = [...new Set(paths.map((path) => path.slice(0, path.lastIndexOf("/"))))];
      for (const folder of folders) {
        const { data: listed, error: storageError } = await service.storage
          .from(PRIVATE_BUCKET).list(folder, { limit: MAX_ITEMS, sortBy: { column: "name", order: "asc" } });
        if (storageError) {
          console.error("Private storage verification failed:", storageError.message);
          throw new Error("Nie udało się sprawdzić magazynu plików. Spróbuj ponownie lub skontaktuj się z pomocą.");
        }
        for (const path of paths.filter((entry) => entry.slice(0, entry.lastIndexOf("/")) === folder)) {
          const filename = path.slice(path.lastIndexOf("/") + 1);
          const object = listed?.find((row) => row.name === filename);
          if (!object || !object.metadata) throw new Error("Nie wszystkie pliki dotarły do prywatnego magazynu.");
          objects.push({ name: path, metadata: { size: Number(object.metadata.size) } });
        }
      }

      for (const entry of uploaded) {
        const path = text(entry.path, 500);
        const expected = manifest.find((row) => row.path === path && row.id === text(entry.id, 80));
        const object = objects?.find((row) => row.name === path);
        const actualSize = Number((object?.metadata as Json | undefined)?.size);
        if (!expected || !object || actualSize !== expected.byte_size) throw new Error("Rozmiar lub identyfikator pliku nie zgadza się z manifestem.");
        const prefix = await readPrefix(path);
        if (!signatureMatches(expected.extension, prefix)) throw new Error(`Plik „${expected.display_name}” ma rozszerzenie niezgodne z zawartością.`);
        items.push({
          id: expected.id,
          batch_id: defaultBatchId,
          item_type: expected.material_kind === "image" ? "image" : "file",
          material_kind: expected.material_kind,
          display_name: expected.display_name,
          storage_bucket: PRIVATE_BUCKET,
          storage_path: expected.path,
          mime_type: expected.mime_type,
          byte_size: expected.byte_size,
          album_title: expected.material_kind === "image" ? text(body.albumTitle, 120) || "Zdjęcia" : null,
          metadata: { verified_signature: true, verified_at: new Date().toISOString() },
        });
      }
    }

    for (const entry of links) {
      const url = normalizeHttps(entry.url);
      const batchId = safeUuid(entry.batchId) ?? defaultBatchId;
      items.push({
        id: safeUuid(entry.id) ?? crypto.randomUUID(),
        batch_id: batchId,
        item_type: "link",
        material_kind: ["repository", "preview", "link"].includes(text(entry.materialKind, 30)) ? text(entry.materialKind, 30) : "link",
        display_name: text(entry.label, 180) || new URL(url).hostname,
        external_url: url,
        metadata: {},
      });
    }

    if (writtenText) {
      if (containsPlainSecret(writtenText)) throw new Error("Treść zawiera zapis przypominający jawne hasło lub sekret. Użyj bezpiecznego linku dostępowego.");
      items.push({
        id: crypto.randomUUID(), batch_id: defaultBatchId, item_type: "text",
        material_kind: "written_work", display_name: text(body.writtenTitle, 180) || "Praca pisemna",
        text_content: writtenText, metadata: {},
      });
    }

    for (const entry of accessEntries) {
      const secureUrl = normalizeHttps(entry.secureUrl);
      const serviceUrl = entry.serviceUrl ? normalizeHttps(entry.serviceUrl) : "";
      const instructions = text(entry.instructions, 2000);
      const expiresRaw = text(entry.expiresAt, 80);
      const expiresAt = expiresRaw ? new Date(expiresRaw) : null;
      if (expiresAt && (!Number.isFinite(expiresAt.getTime()) || expiresAt.getTime() <= Date.now())) {
        throw new Error("Termin ważności bezpiecznego linku musi przypadać w przyszłości.");
      }
      if (containsPlainSecret(instructions) || containsPlainSecret(entry.login)) {
        throw new Error("Nie wpisuj jawnego hasła, tokenu ani kodu 2FA. Wklej je wyłącznie jako bezpieczny link.");
      }
      items.push({
        id: crypto.randomUUID(), batch_id: defaultBatchId, item_type: "access",
        material_kind: "access", display_name: text(entry.label, 180) || "Dane dostępowe",
        external_url: secureUrl,
        metadata: {
          service_url: serviceUrl || null,
          login_identifier: text(entry.login, 320) || null,
          instructions: instructions || null,
          expires_at: expiresAt ? expiresAt.toISOString() : null,
          contains_plain_secret: false,
        },
      });
    }

    if (items.length < 1 || items.length > MAX_ITEMS) throw new Error("Przekaż od 1 do 24 materiałów łącznie.");
    if (action === "submit_delivery") {
      if (user.id !== conversation.contractor_id) throw new Error("Formalną pracę przekazuje wykonawca.");
      writeAttempted = true;
      const { data, error } = await service.rpc("ideahire_server_submit_work_delivery", {
        p_actor_user_id: user.id,
        p_conversation_id: conversationId,
        p_summary: text(body.summary, 4000),
        p_rights_confirmed: body.rightsConfirmed === true,
        p_safety_confirmed: body.safetyConfirmed === true,
        p_items: items,
      });
      if (error) throw error;
      return reply(request, 200, { ok: true, ...data });
    }

    const messageId = crypto.randomUUID();
    const caption = text(body.caption, 4000);
    writeAttempted = true;
    const { error: messageError } = await service.from("messages").insert({
      id: messageId,
      conversation_id: conversationId,
      sender_id: user.id,
      content: caption || `Przekazano prywatne materiały (${items.length}).`,
    });
    if (messageError) throw messageError;
    const { data: insertedCount, error: itemsError } = await service.rpc("ideahire_insert_secure_shared_items", {
      p_actor_user_id: user.id,
      p_conversation_id: conversationId,
      p_message_id: messageId,
      p_delivery_id: null,
      p_items: items,
    });
    if (itemsError) {
      await service.from("messages").delete().eq("id", messageId);
      throw itemsError;
    }
    return reply(request, 200, { ok: true, messageId, itemCount: insertedCount });
  } catch (error) {
    console.error("IDEAHIRE SECURE WORK", { action, conversationId, userId: user.id, message: error instanceof Error ? error.message : String(error) });
    return reply(request, 400, { ok: false, safeToCleanup: !writeAttempted, error: error instanceof Error ? error.message.slice(0, 500) : "Nie udało się przekazać materiałów." });
  }
});
