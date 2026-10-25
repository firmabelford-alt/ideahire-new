/* P69 — dedicated materials library; storage and delivery operations preserved. */
/* IdeaHire | Lucyna AI | P35 | Pełny PrivateWork z ProjectFilesPanel i integracją analizy. */
import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { Upload, Link2, FileText, ShieldCheck, X, Plus, Paperclip, ChevronDown, File as FileIcon } from "lucide-react";
import { IdeaHireDateField, MarketSelect, getSafeWebUrl } from "./MarketUI";
import { supabase } from "./supabase";

const PRIVATE_WORK_BUCKET = "ideahire-private-work";
const MAX_ITEMS = 24;
const MAX_FILE_BYTES = 50 * 1024 * 1024;
const MAX_BATCH_BYTES = 150 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([
  "jpg", "jpeg", "png", "webp", "psd", "pdf", "txt", "md", "csv",
  "json", "xml", "html", "htm", "css", "js", "jsx", "ts", "tsx",
  "py", "java", "php", "sql", "zip", "rar", "7z", "doc", "docx",
  "xls", "xlsx", "ppt", "pptx", "odt", "ods", "odp", "mp4", "webm",
  "mov", "mp3", "wav", "ogg",
]);
const FILE_ACCEPT = [...ALLOWED_EXTENSIONS].map((extension) => `.${extension}`).join(",");
const ACCEPTANCE_TERMS_VERSION = "IH-WORK-ACCEPTANCE-2026-09-26-V1";

function fileExtension(name) {
  const value = String(name || "");
  return value.includes(".") ? value.split(".").pop().toLowerCase() : "";
}

const REPORT_REASONS = [
  ["copyright", "Naruszenie praw autorskich"],
  ["privacy_or_image_rights", "Prywatność lub prawo do wizerunku"],
  ["impersonation", "Podszywanie się"],
  ["harassment_or_threats", "Nękanie lub groźby"],
  ["fraud_or_scam", "Oszustwo lub próba wyłudzenia"],
  ["illegal_goods_or_services", "Nielegalne towary lub usługi"],
  ["other_terms_breach", "Inne naruszenie Regulaminu"],
  ["other_illegal_content", "Inna nielegalna treść"],
];

const DELIVERY_LABELS = {
  submitted: "Oczekuje na odbiór",
  changes_requested: "Wymaga poprawek",
  accepted: "Praca zaakceptowana",
  blocked: "Materiały ukryte po zgłoszeniu",
};

function readableError(error, fallback) {
  const message = error?.context?.error || error?.message || fallback;
  return String(message).replace(/^.*message["']?:\s*["']?/i, "").slice(0, 500);
}

async function invokeSecureWork(body) {
  const { data, error } = await supabase.functions.invoke(
    "ideahire-secure-work",
    { body }
  );
  if (error) {
    let payload;
    try {
      payload = await error.context?.json?.();
    } catch {
      // Odpowiedź nie zawierała możliwego do odczytu JSON-u.
    }
    const failure = new Error(String(payload?.error || error.message));
    failure.safeToCleanup = payload?.safeToCleanup;
    failure.definitelyRejected = payload?.ok === false;
    throw failure;
  }
  if (!data?.ok) {
    const failure = new Error(data?.error || "Nie otrzymaliśmy potwierdzenia operacji.");
    failure.safeToCleanup = data?.safeToCleanup;
    failure.definitelyRejected = data?.ok === false;
    throw failure;
  }
  return data;
}

function formatBytes(value) {
  const bytes = Number(value);
  if (!Number.isFinite(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function getFilePresentation(item) {
  const name = String(item?.display_name || "Plik");
  const extension = name.includes(".")
    ? name.split(".").pop().toUpperCase().slice(0, 5)
    : "PLIK";
  const mimeType = String(item?.mime_type || "").toLowerCase();

  if (mimeType === "application/pdf" || extension === "PDF") {
    return { badge: "PDF", label: "Dokument PDF", action: "Otwórz" };
  }
  if (mimeType === "text/plain" || extension === "TXT") {
    return { badge: "TXT", label: "Plik tekstowy", action: "Otwórz" };
  }
  if (["ZIP", "RAR", "7Z"].includes(extension)) {
    return { badge: extension, label: "Archiwum", action: "Pobierz" };
  }
  if (["DOC", "DOCX", "ODT"].includes(extension)) {
    return { badge: extension, label: "Dokument", action: "Pobierz" };
  }
  if (["XLS", "XLSX", "ODS", "CSV"].includes(extension)) {
    return { badge: extension, label: "Arkusz", action: "Pobierz" };
  }

  return {
    badge: extension || "PLIK",
    label: mimeType || "Załącznik",
    action: "Pobierz",
  };
}

function normalizeLink(value) {
  const raw = String(value || "").trim();
  const url = new URL(raw);
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new Error("Link musi używać HTTPS i nie może zawierać loginu ani hasła.");
  }
  return url.toString();
}

export function containsCredentialLikeText(value) {
  const text = String(value || "");
  return /\b(has[łl]o|password|passwd|token|api[_ -]?key|secret|kod\s*(2fa|mfa)|recovery\s*code)\b\s*[:=]/i.test(text);
}

export function MessageText({ text }) {
  const parts = String(text || "").split(/(https:\/\/[^\s<>{}\[\]"']+)/gi);
  return (
    <p className="private-work-message-text">
      {parts.map((part, index) => {
        if (!/^https:\/\//i.test(part)) return <React.Fragment key={index}>{part}</React.Fragment>;
        let safeUrl = null;
        try {
          safeUrl = normalizeLink(part);
        } catch {
          return <React.Fragment key={index}>{part}</React.Fragment>;
        }
        return (
          <a key={index} href={safeUrl} target="_blank" rel="noopener noreferrer nofollow">
            {part}
          </a>
        );
      })}
    </p>
  );
}

const EMPTY_PRIVATE_WORK = {
  items: [], deliveries: [], events: [], signedUrls: {}, loading: false, error: "",
};

export function usePrivateWork(conversationId, userId, enabled = true) {
  // A new scope also invalidates a previous visit to the same conversation.
  const scope = useMemo(() => (
    enabled && conversationId && userId ? { conversationId, userId } : null
  ), [conversationId, enabled, userId]);
  const scopeRef = useRef(scope);
  const requestRef = useRef(0);
  const [snapshot, setSnapshot] = useState(null);
  const [report, setReport] = useState(null);
  scopeRef.current = scope;

  const load = useCallback(async () => {
    if (!scope || scopeRef.current !== scope) return;
    const request = ++requestRef.current;
    const isCurrent = () => scopeRef.current === scope && requestRef.current === request;
    setSnapshot((previous) => ({
      ...(previous?.scope === scope ? previous : EMPTY_PRIVATE_WORK),
      scope, loading: true, error: "",
    }));
    try {
      const [itemsResult, deliveriesResult] = await Promise.all([
        supabase
          .from("ideahire_shared_items")
          .select("*")
          .eq("conversation_id", scope.conversationId)
          .order("created_at", { ascending: true })
          .order("display_order", { ascending: true }),
        supabase
          .from("ideahire_work_deliveries")
          .select("*")
          .eq("conversation_id", scope.conversationId)
          .order("version", { ascending: false }),
      ]);
      if (!isCurrent()) return;
      if (itemsResult.error) throw itemsResult.error;
      if (deliveriesResult.error) throw deliveriesResult.error;

      const deliveryRows = deliveriesResult.data || [];
      let eventRows = [];
      if (deliveryRows.length) {
        const eventsResult = await supabase
          .from("ideahire_work_delivery_events")
          .select("*")
          .in("delivery_id", deliveryRows.map((row) => row.id))
          .order("created_at", { ascending: true });
        if (!isCurrent()) return;
        if (eventsResult.error) throw eventsResult.error;
        eventRows = eventsResult.data || [];
      }

      const itemRows = itemsResult.data || [];
      const activePaths = itemRows
        .filter((item) => item.storage_path && item.moderation_status === "active")
        .map((item) => item.storage_path);
      const urlMap = {};
      if (activePaths.length) {
        const { data: urlRows, error: urlError } = await supabase.storage
          .from(PRIVATE_WORK_BUCKET)
          .createSignedUrls(activePaths, 3600);
        if (!isCurrent()) return;
        if (urlError) throw urlError;
        (urlRows || []).forEach((row, index) => {
          if (row?.signedUrl) urlMap[activePaths[index]] = row.signedUrl;
        });
      }

      if (!isCurrent()) return;
      setSnapshot({
        scope, items: itemRows, deliveries: deliveryRows, events: eventRows,
        signedUrls: urlMap, loading: false, error: "",
      });
    } catch (loadError) {
      if (!isCurrent()) return;
      setSnapshot({
        ...EMPTY_PRIVATE_WORK, scope,
        error: readableError(loadError, "Nie udało się pobrać prywatnych materiałów."),
      });
    }
  }, [scope]);

  useEffect(() => {
    scopeRef.current = scope;
    setReport(null);
    if (scope) load();
    else setSnapshot(null);
    return () => {
      requestRef.current += 1;
      if (scopeRef.current === scope) scopeRef.current = null;
    };
  }, [load, scope]);

  useEffect(() => {
    if (!scope) return undefined;
    const refresh = () => load();
    const channel = supabase
      .channel(`private-work:${scope.conversationId}:${scope.userId}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "ideahire_shared_items",
        filter: `conversation_id=eq.${scope.conversationId}`,
      }, refresh)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "ideahire_work_deliveries",
        filter: `conversation_id=eq.${scope.conversationId}`,
      }, refresh)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load, scope]);

  // Hide previous data during render, before effects start the next request.
  const data = scope && snapshot?.scope === scope ? snapshot : EMPTY_PRIVATE_WORK;
  const reportTarget = scope && report?.scope === scope ? report.target : null;
  const setReportTarget = useCallback((target) => {
    if (!scope || scopeRef.current !== scope) return;
    setReport((previous) => ({
      scope,
      target: typeof target === "function"
        ? target(previous?.scope === scope ? previous.target : null)
        : target,
    }));
  }, [scope]);

  const itemsByMessage = useMemo(() => {
    const result = {};
    data.items.forEach((item) => {
      (result[item.message_id] ||= []).push(item);
    });
    return result;
  }, [data.items]);

  return {
    items: data.items,
    itemsByMessage,
    deliveries: data.deliveries,
    events: data.events,
    signedUrls: data.signedUrls,
    loading: Boolean(scope) && (snapshot?.scope !== scope || snapshot.loading),
    error: data.error,
    reload: load,
    reportTarget,
    setReportTarget,
  };
}

function PrivateImageViewer({ images, activeId, albumTitle, signedUrls, onClose, onSelect, ownMessage, onReport }) {
  const index = Math.max(0, images.findIndex((item) => item.id === activeId));
  const item = images[index];
  const previous = images[(index - 1 + images.length) % images.length];
  const next = images[(index + 1) % images.length];
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const stageRef = useRef(null);
  const imageRef = useRef(null);
  const pointersRef = useRef(new Map());
  const gestureRef = useRef(null);

  const clampPan = useCallback((position, zoomLevel) => {
    const stage = stageRef.current;
    const image = imageRef.current;
    if (!stage || !image || zoomLevel <= 1) return { x: 0, y: 0 };

    const maxX = Math.max(0, (image.clientWidth * zoomLevel - stage.clientWidth) / 2);
    const maxY = Math.max(0, (image.clientHeight * zoomLevel - stage.clientHeight) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, position.x)),
      y: Math.max(-maxY, Math.min(maxY, position.y)),
    };
  }, []);

  const applyZoom = useCallback((value) => {
    const nextZoom = Math.max(1, Math.min(4, Number(value.toFixed(2))));
    setZoom(nextZoom);
    setPan((current) => clampPan(current, nextZoom));
  }, [clampPan]);

  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    pointersRef.current.clear();
    gestureRef.current = null;
  }, [activeId]);

  useEffect(() => {
    if (!activeId || !item) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [activeId, item]);

  useEffect(() => {
    if (!activeId || !item) return undefined;
    function onKeyDown(event) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft" && images.length > 1) onSelect(previous.id);
      if (event.key === "ArrowRight" && images.length > 1) onSelect(next.id);
      if (["+", "="].includes(event.key)) applyZoom(zoom + 0.25);
      if (event.key === "-") applyZoom(zoom - 0.25);
      if (event.key === "0") applyZoom(1);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeId, applyZoom, images.length, item, next?.id, onClose, onSelect, previous?.id, zoom]);

  function handlePointerDown(event) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    const points = [...pointersRef.current.values()];
    if (points.length === 1) {
      gestureRef.current = {
        type: "pan",
        startX: event.clientX,
        startY: event.clientY,
        panX: pan.x,
        panY: pan.y,
      };
    } else if (points.length === 2) {
      gestureRef.current = {
        type: "pinch",
        distance: Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y),
        zoom,
      };
    }
  }

  function handlePointerMove(event) {
    if (!pointersRef.current.has(event.pointerId)) return;
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const points = [...pointersRef.current.values()];
    const gesture = gestureRef.current;

    if (points.length >= 2 && gesture?.type === "pinch") {
      const distance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      applyZoom(gesture.zoom * (distance / Math.max(gesture.distance, 1)));
      return;
    }

    if (points.length === 1 && gesture?.type === "pan" && zoom > 1) {
      setPan(clampPan({
        x: gesture.panX + event.clientX - gesture.startX,
        y: gesture.panY + event.clientY - gesture.startY,
      }, zoom));
    }
  }

  function handlePointerEnd(event) {
    pointersRef.current.delete(event.pointerId);
    const remaining = [...pointersRef.current.values()];
    if (remaining.length === 1) {
      gestureRef.current = {
        type: "pan",
        startX: remaining[0].x,
        startY: remaining[0].y,
        panX: pan.x,
        panY: pan.y,
      };
    } else if (remaining.length === 0) {
      gestureRef.current = null;
    }
  }

  if (!activeId || !item) return null;

  const source = signedUrls[item.storage_path];

  return createPortal((
    <div
      className="private-work-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Podgląd zdjęcia"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <header className="private-work-viewer-toolbar">
        <div className="private-work-viewer-title">
          <strong>{item.display_name}</strong>
          <span>{images.length > 1 ? `${index + 1} z ${images.length}` : "Zdjęcie"}</span>
        </div>
        <div className="private-work-viewer-controls" aria-label="Powiększenie zdjęcia">
          <button type="button" onClick={() => applyZoom(zoom - 0.25)} disabled={zoom <= 1} aria-label="Oddal">−</button>
          <button type="button" className="private-work-viewer-zoom-value" onClick={() => applyZoom(1)} aria-label="Przywróć rozmiar 100%">{Math.round(zoom * 100)}%</button>
          <button type="button" onClick={() => applyZoom(zoom + 0.25)} disabled={zoom >= 4} aria-label="Przybliż">+</button>
          <a href={source} target="_blank" rel="noopener noreferrer" download={item.display_name} aria-label="Pobierz zdjęcie">Pobierz</a>
          <button type="button" className="private-work-lightbox-close" onClick={onClose} aria-label="Zamknij">×</button>
        </div>
      </header>
      {images.length > 1 && (
        <button type="button" className="private-work-lightbox-arrow is-left" onClick={() => onSelect(previous.id)} aria-label="Poprzednie zdjęcie">Poprzednie</button>
      )}
      <figure className={zoom > 1 ? "is-zoomed" : ""}>
        <div
          ref={stageRef}
          className="private-work-viewer-stage"
          onWheel={(event) => {
            event.preventDefault();
            applyZoom(zoom + (event.deltaY < 0 ? 0.25 : -0.25));
          }}
          onDoubleClick={() => applyZoom(zoom > 1 ? 1 : 2)}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
        >
          <img
            ref={imageRef}
            src={source}
            alt={item.display_name}
            draggable="false"
            style={{
              transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
            }}
          />
        </div>
        <figcaption>
          <span>{images.length > 1 && albumTitle ? albumTitle : "Dwuklik lub kółko myszy zmienia powiększenie"}</span>
          {!ownMessage && (
            <button type="button" onClick={() => {
              onClose();
              onReport("shared_item", item.id);
            }}>
              Zgłoś to zdjęcie
            </button>
          )}
        </figcaption>
      </figure>
      {images.length > 1 && (
        <button type="button" className="private-work-lightbox-arrow is-right" onClick={() => onSelect(next.id)} aria-label="Następne zdjęcie">Następne</button>
      )}
    </div>
  ), document.body);
}

export function PrivateMessageMaterials({ items = [], signedUrls, ownMessage, onReport }) {
  const [previewId, setPreviewId] = useState(null);
  const visible = items.filter((item) => item.moderation_status === "active");
  const hidden = items.filter((item) => item.moderation_status === "hidden");
  const images = visible.filter((item) => item.item_type === "image" && signedUrls[item.storage_path]);
  const files = visible.filter((item) => item.item_type === "file");
  const links = visible.filter((item) => item.item_type === "link");
  const writtenItems = visible.filter((item) => item.item_type === "text");
  const accessItems = visible.filter((item) => item.item_type === "access");
  const imageAlbums = useMemo(() => {
    const groups = new Map();
    images.forEach((item) => {
      const key = item.batch_id || item.id;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    });
    return [...groups.entries()].map(([id, albumImages]) => ({
      id,
      title: albumImages.find((item) => item.album_title)?.album_title || "Album zdjęć",
      images: albumImages,
    }));
  }, [images]);
  const previewAlbum = imageAlbums.find((album) =>
    album.images.some((item) => item.id === previewId)
  );

  if (!items.length) return null;

  return (
    <div className="private-work-materials">
      {imageAlbums.length > 0 && (
        <div className="private-work-albums">
          {imageAlbums.map((album) => {
            const isSingleImage = album.images.length === 1;
            const displayTitle = album.title === "Album zdjęć" ? "Zdjęcia" : album.title;
            return (
            <section className={`private-work-image-set ${isSingleImage ? "is-single" : "is-gallery"}`} key={album.id}>
              {!isSingleImage && (
                <div className="private-work-image-set-heading">
                  <strong>{displayTitle}</strong>
                  <span>{album.images.length} {album.images.length < 5 ? "zdjęcia" : "zdjęć"}</span>
                </div>
              )}
              <div className={`private-work-image-grid count-${Math.min(album.images.length, 4)}`}>
                {album.images.slice(0, 4).map((item, index) => (
                  <button className="private-work-image-thumb" type="button" key={item.id} onClick={() => setPreviewId(item.id)} aria-label={isSingleImage ? `Otwórz zdjęcie ${item.display_name}` : `Otwórz zdjęcie ${index + 1} z zestawu ${displayTitle}`}>
                    <img src={signedUrls[item.storage_path]} alt={item.display_name} loading="lazy" />
                    {index === 3 && album.images.length > 4 && <span>+{album.images.length - 4}</span>}
                  </button>
                ))}
              </div>
            </section>
          );})}
        </div>
      )}

      {files.length > 0 && (
        <section className="private-work-material-group">
          <div className="private-work-section-title"><strong>Pliki</strong><span>{files.length}</span></div>
          <div className="private-work-files">
          {files.map((item) => {
            const presentation = getFilePresentation(item);
            return (
            <div className="private-work-link-row private-work-file-row" key={item.id}>
              <a href={signedUrls[item.storage_path] || undefined} target="_blank" rel="noopener noreferrer" download={item.display_name} aria-disabled={!signedUrls[item.storage_path]}>
                <span className="private-work-file-badge" aria-hidden="true">{presentation.badge}</span>
                <span className="private-work-file-copy">
                  <b>{item.display_name}</b>
                  <small>{presentation.label} · {formatBytes(item.byte_size)}</small>
                </span>
                <span className="private-work-file-action" aria-hidden="true">{presentation.action}</span>
              </a>
              {!ownMessage && <button type="button" onClick={() => onReport("shared_item", item.id)}>Zgłoś</button>}
            </div>
          );})}
          </div>
        </section>
      )}

      {links.length > 0 && (
        <section className="private-work-material-group">
          <div className="private-work-section-title"><strong>Linki</strong><span>{links.length}</span></div>
          <div className="private-work-links">
          {links.map((item) => {
            const externalUrl = getSafeWebUrl(item.external_url);
            return (
            <div className="private-work-link-row" key={item.id}>
              <a href={externalUrl || undefined} target="_blank" rel="noopener noreferrer nofollow" aria-disabled={!externalUrl}>
                <span aria-hidden="true"></span>
                <b>{item.display_name}</b>
                <small>{externalUrl ? new URL(externalUrl).hostname : "Nieprawidłowy link"}</small>
              </a>
              {!ownMessage && <button type="button" onClick={() => onReport("shared_item", item.id)}>Zgłoś</button>}
            </div>
            );
          })}
          </div>
        </section>
      )}

      {writtenItems.length > 0 && (
        <section className="private-work-material-group private-work-written-group">
          <div className="private-work-section-title"><strong>Treść przekazanej pracy</strong><span>{writtenItems.length}</span></div>
          {writtenItems.map((item) => (
            <article className="private-work-written-item" key={item.id}>
              <div><b>{item.display_name}</b><small>Tekst zapisany w tej wersji przekazania</small></div>
              <p>{item.text_content}</p>
              {!ownMessage && <button type="button" onClick={() => onReport("shared_item", item.id)}>Zgłoś</button>}
            </article>
          ))}
        </section>
      )}

      {accessItems.length > 0 && (
        <section className="private-work-material-group private-work-access-group">
          <div className="private-work-section-title"><strong>Dane dostępowe</strong><span>{accessItems.length}</span></div>
          {accessItems.map((item) => {
            const metadata = item.metadata || {};
            const serviceUrl = getSafeWebUrl(metadata.service_url);
            const secureUrl = getSafeWebUrl(item.external_url);
            return (
              <article className="private-work-access-item" key={item.id}>
                <div className="private-work-access-heading">
                  <span aria-hidden="true">⌁</span>
                  <div><b>{item.display_name}</b><small>Hasło nie jest przechowywane w czacie IdeaHire</small></div>
                </div>
                {serviceUrl && <a href={serviceUrl} target="_blank" rel="noopener noreferrer nofollow">Otwórz stronę logowania </a>}
                {metadata.login_identifier && <p><span>Login lub e-mail</span><code>{metadata.login_identifier}</code></p>}
                {metadata.instructions && <p><span>Instrukcja</span>{metadata.instructions}</p>}
                {metadata.expires_at && <small>Link zadeklarowany jako ważny do: {new Date(metadata.expires_at).toLocaleString("pl-PL")}</small>}
                <a className="private-work-secure-access-button" href={secureUrl || undefined} target="_blank" rel="noopener noreferrer nofollow" aria-disabled={!secureUrl}>Otwórz bezpieczny link do sekretu </a>
                {!ownMessage && <button type="button" onClick={() => onReport("shared_item", item.id)}>Zgłoś</button>}
              </article>
            );
          })}
        </section>
      )}

      {hidden.length > 0 && (
        <p className="private-work-hidden">{hidden.length === 1 ? "Jeden materiał został ukryty po analizie zgłoszenia." : `${hidden.length} materiały zostały ukryte po analizie zgłoszenia.`}</p>
      )}

      <PrivateImageViewer
        images={previewAlbum?.images || []}
        activeId={previewId}
        albumTitle={previewAlbum?.title || ""}
        signedUrls={signedUrls}
        onClose={() => setPreviewId(null)}
        onSelect={setPreviewId}
        ownMessage={ownMessage}
        onReport={onReport}
      />
    </div>
  );
}

function WorkspaceFilesLibrary({
  groups,
  items,
  counts,
  signedUrls,
  userId,
  loading,
  error,
  onReport,
  english
}) {
  const [filter, setFilter] = useState('all');
  const t = (pl, en) => english ? en : pl;
  const types = [['all', t('Wszystkie', 'All')], ['files', t('Pliki', 'Files')], ['images', t('Zdjęcia', 'Images')], ['links', t('Linki', 'Links')], ['texts', t('Tekst', 'Text')], ['access', t('Dostępy', 'Access')]];
  const typeOf = item => ({
    image: 'images',
    link: 'links',
    text: 'texts',
    access: 'access'
  })[item.item_type] || 'files';
  const visible = groups.map(group => ({
    ...group,
    items: group.items.filter(item => filter === 'all' || typeOf(item) === filter)
  })).filter(group => group.items.length);
  if (loading && !items.length) return <p className="ih68-loading" role="status">{t('Pobieranie materiałów…', 'Loading materials…')}</p>;
  return <section className="ih69-material-library" aria-label={t('Biblioteka materiałów', 'Materials library')}>
    {error && <p className="ih68-feedback" role="alert">{error}</p>}
    {!!groups.length && <div className="ih69-library-toolbar"><span>{t('Elementy: ', 'Items: ')}<b>{items.length}</b></span><label><span className="ih68-sr-only">{t('Rodzaj materiałów', 'Material type')}</span><select value={filter} onChange={event => setFilter(event.target.value)}>{types.filter(([key]) => key === 'all' || counts[key] > 0 || key === filter).map(([key, label]) => <option key={key} value={key}>{label}{key !== 'all' ? ' (' + counts[key] + ')' : ''}</option>)}</select></label></div>}
    {!visible.length ? <div className="ih69-material-empty"><svg viewBox="0 0 144 112" fill="none" aria-hidden="true" focusable="false"><rect x="50" y="13" width="57" height="75" rx="6" fill="currentColor" fillOpacity=".05" stroke="currentColor" strokeOpacity=".5" strokeWidth="1.5" /><path d="M63 32H93M63 43H86" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".45" /><path d="M24 47C24 43 27 40 31 40H57L65 49H116C120 49 123 52 122 56L115 94H30L24 47Z" fill="currentColor" fillOpacity=".08" stroke="currentColor" strokeWidth="1.5" /><path d="M67 65V83M58 74H76" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg><h3>{groups.length ? t('Brak materiałów tego typu', 'No materials of this type') : t('Jeszcze bez materiałów', 'No materials yet')}</h3><p>{groups.length ? t('Wybierz inny rodzaj materiałów.', 'Choose a different material type.') : t('Dodane pliki i linki pojawią się tutaj. Możecie wrócić do nich w dowolnym momencie.', 'Files and links you share will appear here. You can return to them at any time.')}</p>{groups.length > 0 && <button type="button" className="ih68-text-link" onClick={() => setFilter('all')}>{t('Pokaż wszystkie', 'Show all')}</button>}</div> : <div className="ih69-material-batches">{visible.map(group => {
        const own = group.senderId === userId;
        return <article key={group.id} className="ih69-material-batch"><header><span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z" /><path d="M14 3v6h6M8 13h8M8 17h5" /></svg><strong>{own ? t('Dodane przez Ciebie', 'Shared by you') : t('Dodane przez drugą stronę', 'Shared by the other person')}</strong></span>{group.createdAt && <time dateTime={group.createdAt}>{new Date(group.createdAt).toLocaleString(english ? 'en-GB' : 'pl-PL', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })}</time>}</header><PrivateMessageMaterials items={group.items} signedUrls={signedUrls} ownMessage={own} onReport={onReport} /></article>;
      })}</div>}
  </section>;
}

export function ProjectFilesPanel({
  workspace = false,
  english = false,
  items = [],
  signedUrls = {},
  userId,
  loading = false,
  error = "",
  onReport,
}) {
  const activeItems = items.filter((item) => item.moderation_status === "active");
  const groups = useMemo(() => {
    const grouped = new Map();

    activeItems.forEach((item) => {
      const key = item.batch_id || item.message_id || item.delivery_id || item.id;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(item);
    });

    return [...grouped.entries()]
      .map(([id, groupItems]) => ({
        id,
        items: groupItems,
        senderId: groupItems[0]?.sender_id || null,
        createdAt: groupItems[0]?.created_at || null,
      }))
      .sort((first, second) =>
        String(second.createdAt || "").localeCompare(String(first.createdAt || ""))
      );
  }, [activeItems]);

  const counts = activeItems.reduce(
    (result, item) => {
      if (item.item_type === "image") result.images += 1;
      else if (item.item_type === "link") result.links += 1;
      else if (item.item_type === "text") result.texts += 1;
      else if (item.item_type === "access") result.access += 1;
      else result.files += 1;
      return result;
    },
    { files: 0, images: 0, links: 0, texts: 0, access: 0 }
  );

  if (workspace) return <WorkspaceFilesLibrary groups={groups} items={activeItems} counts={counts} signedUrls={signedUrls} userId={userId} loading={loading} error={error} onReport={onReport} english={english} />;
  if (loading && !items.length) {
    return <p className="project-files-state">Pobieranie prywatnych materiałów…</p>;
  }

  if (!groups.length) {
    return (
      <div className="project-files-empty">
        <span aria-hidden="true">+</span>
        <div>
          <h3>Materiały projektu w jednym miejscu</h3>
          <p>
            Dodaj pliki, linki, tekst lub bezpieczny link dostępu. Materiały są
            widoczne wyłącznie dla stron tej współpracy.
          </p>
        </div>
        {error && <small role="alert">{error}</small>}
      </div>
    );
  }

  return (
    <section className="project-files-library" aria-label="Materiały projektu">
      <header className="project-files-library-header">
        <div>
          <span className="section-label">Prywatna biblioteka</span>
          <h3>Wszystkie materiały projektu</h3>
        </div>
        <div className="project-files-counts" aria-label="Podsumowanie materiałów">
          {[["files", "Pliki"], ["images", "Zdjęcia"], ["links", "Linki"], ["texts", "Tekst"], ["access", "Dostępy"]].filter(([type]) => counts[type] > 0).map(([type, label]) => (
            <span key={type}><b>{counts[type]}</b><small>{label}</small></span>
          ))}
        </div>
      </header>

      {error && <p className="project-files-state" role="alert">{error}</p>}

      <div className="project-files-groups">
        {groups.map((group) => {
          const ownGroup = group.senderId === userId;
          return (
            <article className="project-files-group" key={group.id}>
              <div className="project-files-group-meta">
                <strong>{ownGroup ? "Materiały dodane przez Ciebie" : "Materiały drugiej strony"}</strong>
                {group.createdAt && (
                  <time dateTime={group.createdAt} title={new Date(group.createdAt).toLocaleString("pl-PL")}>
                    {new Date(group.createdAt).toLocaleString("pl-PL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </time>
                )}
              </div>
              <PrivateMessageMaterials
                items={group.items}
                signedUrls={signedUrls}
                ownMessage={ownGroup}
                onReport={onReport}
              />
            </article>
          );
        })}
      </div>
    </section>
  );
}

function SelectedMaterialFile({ file, onRemove }) {
  const [preview, setPreview] = useState("");
  useEffect(() => {
    if (!["jpg", "jpeg", "png", "webp"].includes(fileExtension(file.name))) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return <li className="ih-transfer-file">
    <span className="ih-transfer-file-preview" aria-hidden="true">{preview ? <img src={preview} alt="" onError={() => setPreview("")} /> : <FileIcon size={22} />}</span>
    <div><strong>{file.name}</strong><span>{formatBytes(file.size)} · {fileExtension(file.name).toUpperCase()}</span></div>
    <button type="button" className="ih-transfer-icon-button" onClick={onRemove} aria-label={`Usuń plik ${file.name}`}><X size={18} /></button>
  </li>;
}

export function PrivateSharePanel({
  compact = false,
  openRequest = false,
  onOpenRequest,
  photoInputRef,
  conversationId,
  recipientName,
  userId,
  disabled,
  agreementAccepted,
  paymentConfirmed = false,
  isContractor,
  onComplete,
}) {
  const [open, setOpen] = useState(false);
  const transferId = useId();
  const ownPhotoInputRef = useRef(null);
  const [materialType, setMaterialType] = useState("files");
  useEffect(() => {
    if (!openRequest || disabled) return;
    setOpen(true);
    onOpenRequest?.(false);
  }, [openRequest, onOpenRequest, disabled]);
  const [mode, setMode] = useState("materials");
  const [files, setFiles] = useState([]);
  const [links, setLinks] = useState([]);
  const [caption, setCaption] = useState("");
  const [albumTitle, setAlbumTitle] = useState("");
  const [writtenTitle, setWrittenTitle] = useState("");
  const [writtenText, setWrittenText] = useState("");
  const [accessEntries, setAccessEntries] = useState([
    { label: "", serviceUrl: "", login: "", secureUrl: "", expiresAt: "", instructions: "" },
  ]);
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [safetyConfirmed, setSafetyConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [outcomeUnknown, setOutcomeUnknown] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [selectionMessage, setSelectionMessage] = useState("");
  const [dragging, setDragging] = useState(false);
  const imageCount = files.filter((file) => ["jpg", "jpeg", "png", "webp"].includes(fileExtension(file.name))).length;
  const fileBytes = files.reduce((sum, file) => sum + file.size, 0);
  const accessCount = accessEntries.filter((entry) => Object.values(entry).some((value) => String(value).trim())).length;
  const materialCount = files.length + links.filter((link) => link.url.trim()).length + accessCount + (writtenText.trim() ? 1 : 0);
  const occupiedSlots = files.length + links.length + accessCount + (writtenText.trim() ? 1 : 0);
  const canDeliver = agreementAccepted && paymentConfirmed && isContractor;
  const deliveryHint = !isContractor ? "Gotową pracę przekazuje wykonawca. Jako zleceniodawca możesz dodawać materiały do rozmowy." : !agreementAccepted ? "Przekazanie gotowej pracy będzie dostępne po akceptacji warunków przez obie strony i potwierdzeniu płatności." : !paymentConfirmed ? "Przekazanie gotowej pracy będzie dostępne po potwierdzeniu płatności w tej rozmowie." : "";
  const dialogRef = useRef(null);
  const backdropRef = useRef(null);

  useEffect(() => {
    if (!open || outcomeUnknown) return;
    setMessage("");
    setProgress(0);
  }, [open, outcomeUnknown]);

  useEffect(() => {
    if (!open) return undefined;
    const viewport = window.visualViewport;
    function updateHeight() {
      backdropRef.current?.style.setProperty("--ih9-share-viewport-height", `${Math.round(viewport?.height || window.innerHeight)}px`);
      backdropRef.current?.style.setProperty("--ih-transfer-viewport-top", `${Math.round(viewport?.offsetTop || 0)}px`);
    }
    updateHeight();
    viewport?.addEventListener("resize", updateHeight);
    viewport?.addEventListener("scroll", updateHeight);
    window.addEventListener("resize", updateHeight);
    return () => {
      viewport?.removeEventListener("resize", updateHeight);
      viewport?.removeEventListener("scroll", updateHeight);
      window.removeEventListener("resize", updateHeight);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const previousFocus = document.activeElement;
    dialogRef.current?.querySelector('h2')?.focus({ preventScroll: true });
    return () => {
      window.requestAnimationFrame(() => {
        if (previousFocus?.isConnected) previousFocus.focus?.({ preventScroll: true });
      });
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    function closeOnEscape(event) {
      if (event.key === "Escape" && !event.defaultPrevented && !busy) setOpen(false);
    }
    const background = document.getElementById("root");
    const previousInert = background?.inert;
    if (background) background.inert = true;
    const previousOverflow = document.body.style.getPropertyValue("overflow");
    const previousPriority = document.body.style.getPropertyPriority("overflow");
    document.body.style.setProperty("overflow", "hidden", "important");
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      if (previousOverflow) document.body.style.setProperty("overflow", previousOverflow, previousPriority);
      else document.body.style.removeProperty("overflow");
      if (background) background.inert = !!previousInert;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [busy, open]);

  function addFiles(next) {
    if (busy || disabled || outcomeUnknown) return;
    const valid = [];
    const errors = [];
    let bytes = fileBytes;
    for (const file of next) {
      if (!ALLOWED_EXTENSIONS.has(fileExtension(file.name))) {
        errors.push(`„${file.name}”: niedozwolony format.`);
        continue;
      }
      if (file.size < 1 || file.size > MAX_FILE_BYTES) {
        errors.push(`„${file.name}”: plik musi być niepusty i mieć do 50 MB.`);
        continue;
      }
      if ([...files, ...valid].some((item) => item.name === file.name && item.size === file.size && item.lastModified === file.lastModified)) {
        errors.push(`„${file.name}” jest już na liście.`);
        continue;
      }
      if (occupiedSlots + valid.length >= MAX_ITEMS) {
        errors.push(`„${file.name}”: osiągnięto limit 24 materiałów.`);
        continue;
      }
      if (bytes + file.size > MAX_BATCH_BYTES) {
        errors.push(`„${file.name}”: przekroczono łączny limit 150 MB.`);
        continue;
      }
      valid.push(file);
      bytes += file.size;
    }
    setFiles((current) => [...current, ...valid]);
    setSelectionMessage(errors.slice(0, 3).join(" ") + (errors.length > 3 ? ` Pozostałe pominięte pliki: ${errors.length - 3}.` : ""));
    setMessage("");
  }

  function handleFiles(event) {
    addFiles(Array.from(event.target.files || []));
    event.target.value = "";
  }

  function addLink() {
    if (occupiedSlots >= MAX_ITEMS) {
      setMessage("Możesz wysłać maksymalnie 24 materiały naraz. Usuń pozycję, aby dodać link.");
      return;
    }
    setLinks((current) => [...current, { id: crypto.randomUUID(), url: "", label: "" }]);
    window.requestAnimationFrame(() => dialogRef.current?.querySelector('.ih-transfer-links > :last-child input[type="url"]')?.focus());
  }

  async function submit(event) {
    event.preventDefault();
    if (busy || disabled || outcomeUnknown) return;
    if (mode === "delivery" && (!agreementAccepted || !paymentConfirmed || !isContractor)) {
      setMessage("Pracę przekazuje wykonawca po wspólnej akceptacji warunków i potwierdzeniu płatności.");
      return;
    }
    let preparedLinks;
    let preparedAccess;
    try {
      const totalFileBytes = files.reduce((sum, file) => sum + file.size, 0);
      if (totalFileBytes > MAX_BATCH_BYTES) throw new Error("Łączny rozmiar jednej paczki plików nie może przekroczyć 150 MB.");
      preparedLinks = links.filter((link) => link.url.trim()).map((link, index) => {
        try { return { ...link, url: normalizeLink(link.url) }; }
        catch { throw new Error(`Link nr ${index + 1}: podaj pełny adres HTTPS bez loginu ani hasła w adresie.`); }
      });
      preparedAccess = accessEntries.filter((entry) => Object.values(entry).some((value) => String(value).trim())).map((entry, index) => {
        if (!entry.secureUrl.trim()) throw new Error(`Dostęp nr ${index + 1}: uzupełnij bezpieczny link dostępu albo usuń dane tego dostępu.`);
        let secureUrl, serviceUrl;
        try {
          secureUrl = normalizeLink(entry.secureUrl);
          serviceUrl = entry.serviceUrl.trim() ? normalizeLink(entry.serviceUrl) : "";
        } catch { throw new Error(`Dostęp nr ${index + 1}: linki muszą używać HTTPS i nie mogą zawierać loginu ani hasła w adresie.`); }
        const expires = entry.expiresAt ? new Date(entry.expiresAt) : null;
        if (expires && (!Number.isFinite(expires.getTime()) || expires.getTime() <= Date.now())) throw new Error(`Dostęp nr ${index + 1}: termin ważności linku musi przypadać w przyszłości.`);
        if (containsCredentialLikeText(entry.login) || containsCredentialLikeText(entry.instructions)) throw new Error("Nie wpisuj jawnego hasła, tokenu ani kodu 2FA. Użyj bezpiecznego linku dostępu.");
        return { ...entry, secureUrl, serviceUrl, expiresAt: expires ? expires.toISOString() : "" };
      });
      if (containsCredentialLikeText(writtenText)) throw new Error("Treść przypomina zapis jawnego hasła lub sekretu. Użyj bezpiecznego linku dostępu.");
    } catch (validationError) {
      const detail = readableError(validationError, "Sprawdź dane materiałów.");
      if (/^Link nr/.test(detail)) setMaterialType("links");
      else if (/^Dostęp nr|Nie wpisuj jawnego/.test(detail)) setMaterialType("access");
      else if (/^Treść/.test(detail)) setMaterialType("text");
      setMessage(detail);
      return;
    }
    const hasWrittenText = writtenText.trim().length > 0;
    const total = files.length + preparedLinks.length + preparedAccess.length + (hasWrittenText ? 1 : 0);
    if (total < 1 || total > MAX_ITEMS) {
      setMessage("Dodaj od 1 do 24 materiałów: plików, linków, tekstów lub danych dostępowych.");
      return;
    }
    if (mode === "delivery" && caption.trim().length < 20) {
      setMessage("Opis przekazanej pracy musi mieć co najmniej 20 znaków.");
      return;
    }
    if (mode === "delivery" && (!rightsConfirmed || !safetyConfirmed)) {
      setMessage("Potwierdź oba oświadczenia dotyczące przekazywanej pracy.");
      return;
    }

    let batchId = crypto.randomUUID();
    const uploaded = [];
    let committed = false;
    let finalizationStarted = false;
    setBusy(true);
    setProgress(0);
    setMessage("");

    try {
      let preparedFiles = [];
      if (files.length) {
        const preparation = await invokeSecureWork({
          action: "prepare_upload",
          conversationId,
          fileSpecs: files.map((file) => ({
            displayName: file.name,
            mimeType: file.type,
            byteSize: file.size,
          })),
        });
        batchId = preparation.batchId;
        preparedFiles = preparation.files || [];
        if (
          !batchId ||
          preparedFiles.length !== files.length
        ) {
          throw new Error(
            "Serwer nie przygotował kompletnej sesji uploadu."
          );
        }
      }

      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        const prepared = preparedFiles[index];
        const { error } = await supabase.storage
          .from(PRIVATE_WORK_BUCKET)
          .uploadToSignedUrl(
            prepared.path,
            prepared.token,
            file,
            {
              contentType: prepared.mimeType,
              cacheControl: "3600",
            }
          );
        if (error) throw error;
        uploaded.push({
          id: prepared.id,
          path: prepared.path,
          displayName: file.name,
        });
        setProgress(Math.round(((index + 1) / Math.max(files.length, 1)) * 70));
      }

      const preparedBody = {
        action: mode === "delivery" ? "submit_delivery" : "send_materials",
        conversationId,
        caption: mode === "materials" ? caption.trim() : undefined,
        summary: mode === "delivery" ? caption.trim() : undefined,
        rightsConfirmed: mode === "delivery" ? rightsConfirmed : undefined,
        safetyConfirmed: mode === "delivery" ? safetyConfirmed : undefined,
        albumTitle: imageCount > 1 ? albumTitle.trim() || "Zdjęcia" : undefined,
        writtenTitle: writtenTitle.trim() || undefined,
        writtenText: hasWrittenText ? writtenText.trim() : undefined,
        files: uploaded,
        links: preparedLinks.map((link) => ({
          id: crypto.randomUUID(),
          batchId,
          url: link.url,
          label: link.label.trim() || new URL(link.url).hostname,
          materialKind: link.materialKind || "link",
        })),
        accessEntries: preparedAccess.map((entry) => ({
          label: entry.label.trim() || "Dane dostępowe",
          serviceUrl: entry.serviceUrl,
          login: entry.login.trim(),
          secureUrl: entry.secureUrl,
          expiresAt: entry.expiresAt,
          instructions: entry.instructions.trim(),
        })),
      };

      setProgress(82);
      finalizationStarted = true;
      await invokeSecureWork(preparedBody);
      committed = true;

      setProgress(100);
      setFiles([]);
      setLinks([]);
      setCaption("");
      setAlbumTitle("");
      setWrittenTitle("");
      setWrittenText("");
      setAccessEntries([{ label: "", serviceUrl: "", login: "", secureUrl: "", expiresAt: "", instructions: "" }]);
      setRightsConfirmed(false);
      setSafetyConfirmed(false);
      setMessage(mode === "delivery" ? "Praca została przekazana do odbioru." : "Materiały zostały bezpiecznie przekazane.");
      if (mode === "delivery") {
        window.dispatchEvent(new CustomEvent("ideahire:payment-updated", {
          detail: { conversationId, status: "work_submitted" },
        }));
      }
      try { await onComplete?.(); } catch {
        setMessage("Materiały zostały zapisane. Odśwież rozmowę, aby je zobaczyć.");
      }
      window.setTimeout(() => setOpen(false), 650);
    } catch (submitError) {
      // A lost response is not proof of failure. Never remove potentially committed files.
      if (!committed && uploaded.length && (!finalizationStarted || submitError.safeToCleanup === true)) {
        try { await supabase.storage.from(PRIVATE_WORK_BUCKET).remove(uploaded.map((item) => item.path)); } catch { /* The original error remains visible. */ }
      }
      const unknown = finalizationStarted && (!submitError.definitelyRejected || submitError.safeToCleanup === false);
      setOutcomeUnknown(unknown);
      setMessage(unknown
        ? "Nie udało się potwierdzić zapisu. Pliki nie zostały usunięte. Wróć do rozmowy i sprawdź zakładkę Pliki; odśwież stronę przed ponowną wysyłką, aby nie powielić materiałów."
        : readableError(submitError, "Nie udało się przekazać materiałów."));
    } finally {
      setBusy(false);
    }
  }

  function selectMaterialType(type) {
    setMaterialType(type);
    if (type === "links" && !links.length) addLink();
  }
  function selectTabByKeyboard(event) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    const tabs = [...event.currentTarget.querySelectorAll('[role="tab"]:not(:disabled)')];
    if (!tabs.length) return;
    const index = tabs.indexOf(document.activeElement);
    const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + (event.key === "ArrowLeft" ? -1 : 1) + tabs.length) % tabs.length;
    event.preventDefault(); tabs[next].focus(); tabs[next].click();
  }
  function handlePhotoFiles(event) {
    const selected = Array.from(event.target.files || []);
    event.target.value = "";
    if (!selected.length || busy || disabled || outcomeUnknown) return;
    const photos = selected.filter(file => ["jpg", "jpeg", "png", "webp"].includes(fileExtension(file.name)));
    setMode("materials"); setRightsConfirmed(false); setSafetyConfirmed(false); setMaterialType("files"); setOpen(true);
    if (photos.length) addFiles(photos);
    if (photos.length !== selected.length) setSelectionMessage("Wybierz zdjęcia JPG, PNG lub WebP. Pozostałe formaty nie zostały dodane.");
  }
  function updateAccess(index, field, value) {
    setAccessEntries(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
  }
  const kindTabs = [
    ["files", "Pliki", <Paperclip size={18} aria-hidden="true" />, files.length],
    ["links", "Link", <Link2 size={18} aria-hidden="true" />, links.filter(link => link.url.trim()).length],
    ["text", "Tekst", <FileText size={18} aria-hidden="true" />, writtenText.trim() ? 1 : 0],
    ["access", "Dostęp", <ShieldCheck size={18} aria-hidden="true" />, accessCount],
  ];
  return (
    <section className={`private-work-share ${open ? "is-open" : ""}`}>
      <input ref={photoInputRef || ownPhotoInputRef} className="ih-transfer-native-photos" type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={disabled || busy || outcomeUnknown} onChange={handlePhotoFiles} tabIndex={-1} aria-hidden="true" />
      <button type="button" className="private-work-share-toggle" onClick={() => { setSelectionMessage(""); setOpen(true); }} disabled={disabled || busy}>
        <span aria-hidden="true">＋</span><b>Dodaj materiały</b>{!compact && <small>Pliki, zdjęcia, link lub tekst</small>}
      </button>
      {open && createPortal((
        <div ref={backdropRef} className="ih-transfer-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !busy) setOpen(false); }}>
          <form ref={dialogRef} onSubmit={submit} noValidate className="ih-transfer-dialog" role="dialog" aria-modal="true" aria-labelledby="ih-transfer-title" aria-describedby="ih-transfer-recipient" aria-busy={busy} onKeyDown={event => {
            if (event.key !== "Tab") return;
            const all = [...event.currentTarget.querySelectorAll('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], summary')].filter(node => !node.closest('[hidden], [inert]') && node.getClientRects().length);
            const first = all[0], last = all[all.length - 1];
            if (event.shiftKey && (document.activeElement === first || !event.currentTarget.contains(document.activeElement))) { event.preventDefault(); last?.focus(); }
            else if (!event.shiftKey && (document.activeElement === last || !event.currentTarget.contains(document.activeElement))) { event.preventDefault(); first?.focus(); }
          }}>
            <header className="ih-transfer-header"><div><h2 id="ih-transfer-title" tabIndex={-1}>{mode === "delivery" ? "Przekaż gotową pracę" : "Wyślij materiały"}</h2><p id="ih-transfer-recipient">Odbiorca: <strong title={recipientName || undefined}>{recipientName || "druga strona"}</strong></p></div><button type="button" className="ih-transfer-icon-button" onClick={() => setOpen(false)} disabled={busy} aria-label="Zamknij okno materiałów"><X size={22} /></button></header>
            <div className="ih-transfer-body">
              <div className="ih-transfer-modes" role="tablist" aria-label="Sposób przekazania" onKeyDown={selectTabByKeyboard}>
                <button type="button" role="tab" id="ih9-share-tab-materials" aria-controls="ih9-share-panel" aria-selected={mode === "materials"} tabIndex={mode === "materials" ? 0 : -1} className={mode === "materials" ? "is-active" : ""} onClick={() => setMode("materials")} disabled={busy || outcomeUnknown}><strong>Do rozmowy</strong></button>
                <button type="button" role="tab" id="ih9-share-tab-delivery" aria-controls="ih9-share-panel" aria-selected={mode === "delivery"} aria-describedby={!canDeliver ? "ih-transfer-delivery-hint" : undefined} tabIndex={mode === "delivery" ? 0 : -1} className={mode === "delivery" ? "is-active" : ""} onClick={() => setMode("delivery")} disabled={!canDeliver || busy || outcomeUnknown}><strong>Gotowa praca do odbioru</strong></button>
              </div>
              {deliveryHint && <p className="ih-transfer-delivery-hint" id="ih-transfer-delivery-hint">{deliveryHint}</p>}
              <fieldset className="ih-transfer-fields" role="tabpanel" id="ih9-share-panel" aria-labelledby={`ih9-share-tab-${mode}`} disabled={busy || outcomeUnknown}>
                <legend>{mode === "delivery" ? "Gotowa praca do odbioru" : "Materiały do rozmowy"}</legend>
                <div className="ih-transfer-kind-tabs" role="tablist" aria-label="Rodzaj materiału" onKeyDown={selectTabByKeyboard}>{kindTabs.map(([key,label,icon,count]) => <button type="button" role="tab" key={key} id={`${transferId}-tab-${key}`} aria-controls={`${transferId}-panel-${key}`} aria-selected={materialType === key} tabIndex={materialType === key ? 0 : -1} onClick={() => selectMaterialType(key)} disabled={busy || outcomeUnknown}>{icon}<span>{label}</span>{count > 0 && <small>{count}</small>}</button>)}</div>
                <section className="ih-transfer-kind-panel ih-transfer-section" role="tabpanel" id={`${transferId}-panel-files`} aria-labelledby={`${transferId}-tab-files`} hidden={materialType !== "files"}>
                  <div className="ih-transfer-section-heading"><h3>Dodaj pliki lub zdjęcia</h3><span>{files.length} / 24</span></div>
                  <label className={'ih-transfer-dropzone' + (dragging ? ' is-dragging' : '')} onDragOver={event => { event.preventDefault(); setDragging(true); }} onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false); }} onDrop={event => { event.preventDefault(); setDragging(false); addFiles(Array.from(event.dataTransfer.files || [])); }}>
                    <input className="ih-transfer-file-input" type="file" multiple accept={FILE_ACCEPT} onChange={handleFiles} aria-label="Wybierz pliki do przesłania" />
                    <span className="ih-upload-icon"><Upload size={26} aria-hidden="true" /></span><span className="ih-upload-copy"><strong>{files.length ? "Dodaj kolejne pliki" : "Wybierz pliki z urządzenia"}</strong><span>Zdjęcia, dokumenty i pliki projektu<span className="ih-transfer-drop-hint"> · możesz też przeciągnąć je tutaj</span></span><small>Do 50 MB na plik · 150 MB łącznie</small></span>
                  </label>
                  {selectionMessage && <p className="ih-transfer-notice" role="status">{selectionMessage}</p>}
                  {files.length > 0 && <ul className="ih-transfer-files" aria-label="Wybrane pliki">{files.map((file,index) => <SelectedMaterialFile key={`${file.name}-${file.size}-${file.lastModified}`} file={file} onRemove={() => { setFiles(current => current.filter((_,itemIndex) => itemIndex !== index)); setSelectionMessage(""); }} />)}</ul>}
                  {imageCount > 1 && <label className="ih-transfer-field"><span>Nazwa albumu <small>opcjonalnie</small></span><input type="text" value={albumTitle} onChange={event => setAlbumTitle(event.target.value)} maxLength={120} placeholder="Np. Grafiki projektu" /></label>}
                </section>
                <section className="ih-transfer-kind-panel" role="tabpanel" id={`${transferId}-panel-links`} aria-labelledby={`${transferId}-tab-links`} hidden={materialType !== "links"}>
                  <div className="ih-transfer-section-heading"><h3>Dodaj link</h3></div>
                  <div className="ih-transfer-links">{links.map((link,index) => <div className="ih-transfer-link" key={link.id || index}>
                    <div className="ih-transfer-item-heading"><strong>Link {index + 1}</strong><button type="button" className="ih-transfer-icon-button" onClick={() => setLinks(current => current.filter((_,itemIndex) => itemIndex !== index))} aria-label={`Usuń link ${index + 1}`}><X size={18} /></button></div>
                    <label className="ih-transfer-field"><span>Adres HTTPS</span><input type="url" value={link.url} onChange={event => setLinks(current => current.map((item,itemIndex) => itemIndex === index ? { ...item, url:event.target.value } : item))} placeholder="https://…" autoComplete="off" /></label>
                    <div className="ih-transfer-two-fields"><label className="ih-transfer-field"><span>Nazwa linku <small>opcjonalnie</small></span><input type="text" value={link.label} onChange={event => setLinks(current => current.map((item,itemIndex) => itemIndex === index ? { ...item,label:event.target.value } : item))} maxLength={180} placeholder="Np. Podgląd projektu" /></label><MarketSelect label="Rodzaj linku" value={link.materialKind || "link"} disabled={busy || outcomeUnknown} options={[{value:"link",label:"Link do materiału"},{value:"preview",label:"Podgląd / wersja testowa"},{value:"repository",label:"Repozytorium kodu"}]} onChange={value => setLinks(current => current.map((item,itemIndex) => itemIndex === index ? {...item,materialKind:value} : item))} /></div>
                  </div>)}</div><button type="button" className="ih-transfer-add-link" onClick={addLink} disabled={occupiedSlots >= MAX_ITEMS}><Plus size={18} aria-hidden="true" />Dodaj kolejny link</button>
                </section>
                <section className="ih-transfer-kind-panel" role="tabpanel" id={`${transferId}-panel-text`} aria-labelledby={`${transferId}-tab-text`} hidden={materialType !== "text"}>
                  <div className="ih-transfer-section-heading"><h3>Przekaż tekst</h3></div><label className="ih-transfer-field"><span>Treść</span><textarea value={writtenText} onChange={event => setWrittenText(event.target.value)} maxLength={20000} rows={5} placeholder="Wklej gotowy tekst lub instrukcję…" /><small>{writtenText.length.toLocaleString()} / 20 000 znaków</small></label>
                  <label className="ih-transfer-field"><span>Tytuł tekstu <small>opcjonalnie</small></span><input type="text" value={writtenTitle} onChange={event => setWrittenTitle(event.target.value)} maxLength={180} placeholder="Np. Treść strony głównej" /></label>
                </section>
                <section className="ih-transfer-kind-panel" role="tabpanel" id={`${transferId}-panel-access`} aria-labelledby={`${transferId}-tab-access`} hidden={materialType !== "access"}>
                  <div className="ih-transfer-section-heading"><h3>Przekaż bezpieczny dostęp</h3></div><p className="ih-transfer-kind-help">Wstaw wygasający link z menedżera haseł. Nie wpisuj tutaj samego hasła.</p>
                  {accessEntries.map((entry,index) => <div className="ih-transfer-access" key={index}>
                    <div className="ih-transfer-item-heading"><strong>Dostęp {index + 1}</strong>{accessEntries.length > 1 && <button type="button" className="ih-transfer-icon-button" onClick={() => setAccessEntries(current => current.filter((_,itemIndex) => itemIndex !== index))} aria-label={`Usuń dostęp ${index + 1}`}><X size={18} /></button>}</div>
                    <label className="ih-transfer-field"><span>Nazwa dostępu <small>opcjonalnie</small></span><input type="text" value={entry.label} onChange={event => updateAccess(index,"label",event.target.value)} maxLength={180} placeholder="Np. Panel strony" autoComplete="off" /></label>
                    <label className="ih-transfer-field"><span>Bezpieczny link dostępu</span><input type="url" value={entry.secureUrl} onChange={event => updateAccess(index,"secureUrl",event.target.value)} placeholder="https://…" autoComplete="off" /></label>
                    <details className="ih-transfer-optional"><summary>Dodatkowe informacje <span>opcjonalnie</span><ChevronDown size={17} aria-hidden="true" /></summary><div className="ih-transfer-two-fields">
                      <label className="ih-transfer-field"><span>Adres usługi</span><input type="url" value={entry.serviceUrl} onChange={event => updateAccess(index,"serviceUrl",event.target.value)} placeholder="https://adres-usługi.pl" autoComplete="off" /></label>
                      <label className="ih-transfer-field"><span>Login lub e-mail</span><input type="text" value={entry.login} onChange={event => updateAccess(index,"login",event.target.value)} maxLength={320} placeholder="Login do usługi" autoComplete="off" /></label>
                      <label className="ih-transfer-field"><span>Link ważny do</span><IdeaHireDateField aria-label={`Termin ważności dostępu ${index + 1}`} type="datetime-local" value={entry.expiresAt} disabled={busy || outcomeUnknown} onChange={event => updateAccess(index,"expiresAt",event.target.value)} /></label>
                      <label className="ih-transfer-field ih-transfer-field-wide"><span>Instrukcja logowania</span><textarea value={entry.instructions} onChange={event => updateAccess(index,"instructions",event.target.value)} maxLength={2000} rows={3} placeholder="Instrukcja bez hasła, tokenu ani kodu 2FA" /></label>
                    </div></details>
                  </div>)}<button type="button" className="ih-transfer-add-link" disabled={accessEntries.length >= 5 || occupiedSlots >= MAX_ITEMS} onClick={() => setAccessEntries(current => current.length < 5 ? [...current,{label:"",serviceUrl:"",login:"",secureUrl:"",expiresAt:"",instructions:""}] : current)}><Plus size={18} aria-hidden="true" />Dodaj kolejny dostęp</button>
                </section>
                <details className="ih-transfer-caption-toggle" open={mode === "delivery" || undefined}><summary>{mode === "delivery" ? "Opis przekazywanej pracy" : "Dołącz wiadomość"}{mode !== "delivery" && <span>opcjonalnie</span>}<ChevronDown size={17} aria-hidden="true" /></summary><label className="ih-transfer-field" htmlFor="ih-transfer-caption"><span>{mode === "delivery" ? "Co przekazujesz i jak to sprawdzić?" : "Wiadomość"}</span><textarea id="ih-transfer-caption" value={caption} onChange={event => setCaption(event.target.value)} maxLength={4000} rows={3} placeholder={mode === "delivery" ? "Opisz rezultat i sposób jego sprawdzenia…" : "Krótka informacja do przesyłki…"} /><small>{mode === "delivery" ? "Minimum 20 znaków. Klient otrzyma te materiały do odbioru pracy." : "Wiadomość pojawi się razem z materiałami w rozmowie."}</small></label></details>
                {mode === "delivery" && <div className="ih-transfer-confirmations">
                  <label><input type="checkbox" checked={rightsConfirmed} onChange={(event) => setRightsConfirmed(event.target.checked)} /><span>Mam prawa lub wymagane zgody do przekazywanych materiałów.</span></label>
                  <label><input type="checkbox" checked={safetyConfirmed} onChange={(event) => setSafetyConfirmed(event.target.checked)} /><span>Nie dołączam świadomie złośliwego kodu ani danych, których nie wolno mi ujawniać.</span></label>
                </div>}
                <details className="ih-transfer-safety"><summary><ShieldCheck size={17} aria-hidden="true" /><span>Zasady bezpiecznego przesyłania</span><ChevronDown size={16} aria-hidden="true" /></summary><p>Nie wysyłaj haseł, kodów 2FA, kluczy API ani danych kart. Do sekretów używaj menedżera haseł z dostępem czasowym. IdeaHire sprawdza format i sygnaturę pliku, ale nie gwarantuje, że każdy plik jest wolny od złośliwego kodu.</p></details>
              </fieldset>
            </div>
            <footer className="ih-transfer-footer">
              {materialCount > MAX_ITEMS && <p className="ih-transfer-notice" role="alert">Przekroczono limit 24 materiałów. Usuń nadmiarowe pozycje.</p>}
              {message && <p className={'ih-transfer-notice' + (progress === 100 && !outcomeUnknown ? ' is-success' : '')} role={progress === 100 && !outcomeUnknown ? "status" : "alert"}>{message}</p>}
              {busy && <div className="ih-transfer-progress" role="progressbar" aria-label="Wysyłanie materiałów" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{width:`${progress}%`}} /></div>}
              <div className="ih-transfer-footer-row"><div className="ih-transfer-summary" aria-live="polite" aria-atomic="true"><strong>{materialCount ? `Do wysłania: ${materialCount} z 24 materiałów` : "Wybierz, co chcesz przekazać"}</strong><span>{files.length ? `Pliki: ${files.length} · ${formatBytes(fileBytes)} / 150 MB` : "Wszystkie wybrane materiały pozostają w tej przesyłce."}</span></div><div className="ih-transfer-actions"><button type="button" onClick={async () => { setOpen(false); if (outcomeUnknown) { try { await onComplete?.(); } catch { /* Refresh the existing conversation after an uncertain response. */ } } }} disabled={busy}>{outcomeUnknown ? "Wróć do rozmowy" : "Anuluj"}</button><button type="submit" className="is-primary" aria-label={mode === "delivery" ? "Przekaż pracę do odbioru" : "Wyślij materiały"} disabled={busy || disabled || outcomeUnknown || materialCount < 1 || materialCount > MAX_ITEMS || (mode === "delivery" && !canDeliver)}>{busy ? `Wysyłanie… ${progress}%` : mode === "delivery" ? "Przekaż do odbioru" : "Wyślij"}</button></div></div>
            </footer>
          </form>
        </div>
      ), document.body)}
    </section>
  );
}

export function WorkDeliveryPanel({ deliveries, events, conversation, userId, paymentStatus, disabled, onComplete, onReport }) {
  const [changes, setChanges] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [reviewState, setReviewState] = useState({
    loading: false,
    canReview: false,
    alreadyReviewed: false,
    review: null,
  });
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");
  const [releaseOpen, setReleaseOpen] = useState(false);
  const [releaseSummary, setReleaseSummary] = useState(null);
  const [releaseLoading, setReleaseLoading] = useState(false);
  const [reviewedWork, setReviewedWork] = useState(false);
  const [confirmRelease, setConfirmRelease] = useState(false);
  const releaseInFlight = useRef(false);
  const latest = deliveries[0];

  const loadReviewState = useCallback(async () => {
    if (!conversation?.id || !userId || latest?.status !== "accepted") {
      setReviewState({
        loading: false,
        canReview: false,
        alreadyReviewed: false,
        review: null,
      });
      return;
    }

    setReviewState((current) => ({ ...current, loading: true }));

    try {
      const { data, error } = await supabase.rpc(
        "get_my_ideahire_review_state",
        { p_conversation_id: conversation.id }
      );
      if (error) throw error;

      const payload = data || {};
      setReviewState({
        loading: false,
        canReview: payload.can_review === true,
        alreadyReviewed: payload.already_reviewed === true,
        review: payload.review || null,
      });
    } catch (reviewStateError) {
      setReviewState({
        loading: false,
        canReview: false,
        alreadyReviewed: false,
        review: null,
      });
      setReviewMessage(
        readableError(
          reviewStateError,
          "Nie udało się sprawdzić możliwości wystawienia opinii."
        )
      );
    }
  }, [conversation?.id, latest?.status, userId]);

  useEffect(() => {
    loadReviewState();
  }, [loadReviewState]);

  if (!latest) return null;
  const isClient = conversation?.client_id === userId;
  const history = events.filter((event) => event.delivery_id === latest.id);

  async function respond(action) {
    if (busy || disabled) return;
    if (action === "request_changes" && changes.trim().length < 20) {
      setMessage("Opisz wymagane poprawki w co najmniej 20 znakach.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const { error } = await supabase.rpc("respond_to_ideahire_work_delivery", {
        p_delivery_id: latest.id,
        p_action: action,
        p_response: changes.trim() || null,
      });
      if (error) throw error;
      setChanges("");
      setMessage("Wykonawca otrzymał listę poprawek.");
      await onComplete?.();
    } catch (responseError) {
      setMessage(readableError(responseError, "Nie udało się zapisać decyzji."));
    } finally {
      setBusy(false);
    }
  }

  async function openReleaseConfirmation() {
    if (busy || disabled || !conversation?.id) return;
    setReleaseLoading(true);
    setMessage("");
    try {
      const { data, error } = await supabase.rpc("get_ideahire_payment_summary", {
        p_conversation_id: conversation.id,
      });
      if (error) throw error;
      const summary = data?.[0];
      if (!summary || !["work_submitted", "release_pending", "release_failed"].includes(summary.payment_status)) {
        throw new Error("Płatność nie jest gotowa do zwolnienia po odbiorze pracy.");
      }
      if (summary.currency !== "PLN" || !Number.isFinite(Number(summary.contractor_amount))
        || Number(summary.contractor_amount) <= 0
        || latest.payment_id && summary.payment_id !== latest.payment_id) {
        throw new Error("Nie potwierdzono kwoty lub płatności za tę wersję pracy. Odśwież status.");
      }
      setReleaseSummary(summary);
      setReviewedWork(false);
      setConfirmRelease(false);
      setReleaseOpen(true);
    } catch (releaseError) {
      setMessage(readableError(releaseError, "Nie udało się przygotować odbioru pracy."));
    } finally {
      setReleaseLoading(false);
    }
  }

  async function acceptAndRelease() {
    if (busy || releaseInFlight.current || disabled || !isClient || !reviewedWork || !confirmRelease || !latest?.id) return;
    releaseInFlight.current = true;
    setBusy(true);
    setMessage("");
    try {
      const { data, error } = await supabase.functions.invoke("accept-work-release", {
        body: {
          delivery_id: latest.id,
          reviewed_work: true,
          confirm_release: true,
          terms_version: ACCEPTANCE_TERMS_VERSION,
        },
      });
      if (error) {
        let serverMessage = "";
        try {
          const payload = await error.context?.json?.();
          serverMessage = String(payload?.error || "");
        } catch {
          serverMessage = "";
        }
        throw new Error(serverMessage || error.message);
      }
      if (!data?.ok) throw new Error(data?.error || "Stripe nie potwierdził zwolnienia środków.");
      if (data.status !== "released" || !/^tr_[A-Za-z0-9]+$/.test(String(data.transfer_id || ""))) {
        window.dispatchEvent(new CustomEvent("ideahire:payment-updated", {
          detail: { conversationId: conversation.id },
        }));
        throw new Error("Odbiór wymaga potwierdzenia przekazania wynagrodzenia. Sprawdź aktualny status płatności.");
      }
      setReleaseOpen(false);
      setMessage(data.message || "Praca została zaakceptowana, a wynagrodzenie przekazane wykonawcy.");
      window.dispatchEvent(new CustomEvent("ideahire:payment-updated", {
        detail: { conversationId: conversation.id },
      }));
      await onComplete?.();
    } catch (releaseError) {
      setMessage(readableError(releaseError, "Nie udało się potwierdzić przekazania wynagrodzenia. Sprawdź aktualny status tej płatności."));
    } finally {
      releaseInFlight.current = false;
      setBusy(false);
    }
  }

  async function submitReview(event) {
    event.preventDefault();
    if (reviewBusy || disabled || !reviewState.canReview) return;

    if (!Number.isInteger(reviewRating) || reviewRating < 1 || reviewRating > 5) {
      setReviewMessage("Wybierz ocenę od 1 do 5 gwiazdek.");
      return;
    }

    if (reviewText.trim().length < 10) {
      setReviewMessage("Napisz opinię zawierającą co najmniej 10 znaków.");
      return;
    }

    setReviewBusy(true);
    setReviewMessage("");

    try {
      const { error } = await supabase.rpc(
        "submit_ideahire_job_review",
        {
          p_conversation_id: conversation.id,
          p_rating: reviewRating,
          p_review_text: reviewText.trim(),
        }
      );
      if (error) throw error;

      setReviewMessage("Opinia została opublikowana na profilu wykonawcy.");
      setReviewText("");
      await loadReviewState();
    } catch (reviewError) {
      setReviewMessage(
        readableError(reviewError, "Nie udało się opublikować opinii.")
      );
    } finally {
      setReviewBusy(false);
    }
  }

  const savedReview = reviewState.review;
  const savedRating = Math.max(0, Math.min(5, Number(savedReview?.rating) || 0));

  return (
    <section className={`private-work-delivery is-${latest.status}`}>
      <div className="private-work-delivery-heading">
        <div><span>Odbiór pracy · wersja {latest.version}</span><h3>{DELIVERY_LABELS[latest.status] || latest.status}</h3></div>
        {!isClient && latest.status !== "blocked" && <small>{["refunded", "partially_refunded"].includes(paymentStatus) ? "Rozliczenie obejmuje zwrot" : latest.status === "submitted" ? "Czekamy na decyzję zleceniodawcy" : "Status formalnego przekazania"}</small>}
      </div>
      <p>{latest.summary}</p>
      {latest.acceptance_source === "auto" && <p>Praca została odebrana automatycznie po upływie terminu. Nie jest to zapis ręcznego potwierdzenia zleceniodawcy.</p>}
      {["refunded", "partially_refunded"].includes(paymentStatus) && <p>Rozliczenie obejmuje zwrot. Aktualne kwoty i wynik decyzji sprawdź w panelu płatności oraz centrum sporów.</p>}
      {latest.status === "submitted" && <p>Na odbiór pracy, zgłoszenie poprawek lub otwarcie sporu przewidziano 10 dni od przekazania. Automatyczny odbiór obejmuje prace przekazane po włączeniu tej funkcji. Aktywny spór wstrzymuje przekazanie wynagrodzenia.</p>}
      {import.meta.env.VITE_LUCYNA_ENABLED !== "false" && !disabled && latest.status !== "blocked" && (
        <p className="private-work-lucyna-link"><Link to={"/lucyna?mode=review&delivery="+encodeURIComponent(latest.id)}>
          Sprawdź rezultat względem kryteriów z Lucyną AI
        </Link><small> Wstępna pomoc; decyzja o odbiorze należy do Ciebie.</small></p>
      )}
      {latest.requested_changes && <blockquote><b>Wymagane poprawki</b>{latest.requested_changes}</blockquote>}
      {history.length > 0 && (
        <details><summary>Historia odbioru ({history.length})</summary>{history.map((event) => <p key={event.id}><time>{new Date(event.created_at).toLocaleString("pl-PL")}</time>{event.message}</p>)}</details>
      )}
      {isClient && latest.status === "submitted" && ["work_submitted", "release_pending", "release_failed"].includes(paymentStatus) && (
        <div className="private-work-delivery-actions">
          <textarea value={changes} onChange={(event) => setChanges(event.target.value)} minLength={20} maxLength={4000} rows={3} placeholder="Jeśli potrzebujesz zmian, opisz je konkretnie…" />
          <div>
            <button type="button" onClick={() => respond("request_changes")} disabled={busy || disabled}>Poproś o poprawki</button>
            <button type="button" className="is-primary" onClick={openReleaseConfirmation} disabled={busy || disabled || releaseLoading}>{releaseLoading ? "Sprawdzanie płatności…" : "Zaakceptuj i zwolnij środki"}</button>
          </div>
        </div>
      )}
      {releaseOpen && (
        <div className="private-work-release-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !busy && setReleaseOpen(false)}>
          <section className="private-work-release-dialog" role="dialog" aria-modal="true" aria-labelledby="private-work-release-title">
            <button type="button" className="private-work-report-close" onClick={() => setReleaseOpen(false)} disabled={busy} aria-label="Zamknij">×</button>
            <span className="section-label">Ostateczny odbiór · wersja {latest.version}</span>
            <h2 id="private-work-release-title">Zaakceptuj rezultat i wypłać wykonawcę</h2>
            <p>Po potwierdzeniu IdeaHire zleci Stripe przekazanie pełnego wynagrodzenia na saldo połączonego konta wykonawcy.</p>
            <div className="private-work-release-amount">
              <span>Kwota dla wykonawcy</span>
              <strong>{new Intl.NumberFormat("pl-PL", { style: "currency", currency: releaseSummary?.currency || "PLN" }).format(Number(releaseSummary?.contractor_amount || 0))}</strong>
            </div>
            <label><input type="checkbox" checked={reviewedWork} onChange={(event) => setReviewedWork(event.target.checked)} /> Przejrzałem najnowszą wersję, otworzyłem potrzebne materiały i wynik odpowiada ustaleniom.</label>
            <label><input type="checkbox" checked={confirmRelease} onChange={(event) => setConfirmRelease(event.target.checked)} /> Akceptuję pracę i zlecam przekazanie wskazanej kwoty wykonawcy przez Stripe.</label>
            <small>Akceptacja dotyczy odbioru rezultatu i wypłaty. Zakres praw autorskich wynika z ustaleń stron; sam przycisk nie zastępuje wymaganej prawem formy pisemnej przeniesienia praw.</small>
            <div className="private-work-form-actions">
              <button type="button" onClick={() => setReleaseOpen(false)} disabled={busy}>Wróć do sprawdzania</button>
              <button type="button" className="is-primary" onClick={acceptAndRelease} disabled={busy || !reviewedWork || !confirmRelease}>{busy ? "Stripe przekazuje środki…" : "Potwierdź odbiór i wypłatę "}</button>
            </div>
          </section>
        </div>
      )}
      {latest.status === "accepted" && (
        <div className="private-work-completion" role="status">
          <span aria-hidden="true">✓</span>
          <div>
            <strong>{paymentStatus === "released" ? "Zlecenie zakończone" : "Praca zaakceptowana"}</strong>
            <p>{paymentStatus === "released"
              ? "Współpraca została zapisana jako wykonana, a wynagrodzenie przekazane na saldo Stripe wykonawcy."
              : "Odbiór pracy został zapisany. Aktualny etap rozliczenia sprawdź w statusie płatności."}</p>
          </div>
        </div>
      )}
      {latest.status === "accepted" && reviewState.loading && (
        <p className="private-work-review-status">Sprawdzanie opinii…</p>
      )}
      {latest.status === "accepted" && savedReview && (
        <div className="private-work-saved-review">
          <div className="private-work-saved-review-heading">
            <strong>Zweryfikowana opinia</strong>
            <span aria-label={`${savedRating} z 5 gwiazdek`}>
              {Array.from({ length: 5 }, (_, index) => (
                <b className={index < savedRating ? "is-active" : ""} key={index}>★</b>
              ))}
            </span>
          </div>
          <p>{savedReview.review_text}</p>
        </div>
      )}
      {latest.status === "accepted" && isClient && reviewState.canReview && !savedReview && (
        <form className="private-work-review-form" onSubmit={submitReview}>
          <div>
            <span className="section-label">Opinia po zakończeniu</span>
            <h3>Oceń wykonawcę</h3>
            <p>Opinię można wystawić tylko raz dla tej współpracy.</p>
          </div>
          <div className="private-work-review-stars" role="radiogroup" aria-label="Ocena wykonawcy">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                type="button"
                key={value}
                className={reviewRating >= value ? "is-active" : ""}
                onClick={() => setReviewRating(value)}
                role="radio"
                aria-checked={reviewRating === value}
                aria-label={`${value} ${value === 1 ? "gwiazdka" : value < 5 ? "gwiazdki" : "gwiazdek"}`}
                disabled={reviewBusy || disabled}
              >
                ★
              </button>
            ))}
            <span>{reviewRating ? `${reviewRating}/5` : "Wybierz ocenę"}</span>
          </div>
          <label htmlFor={`ideahire-review-${conversation.id}`}>Twoja opinia</label>
          <textarea
            id={`ideahire-review-${conversation.id}`}
            value={reviewText}
            onChange={(event) => setReviewText(event.target.value)}
            minLength={10}
            maxLength={2000}
            rows={4}
            placeholder="Napisz, jak przebiegła współpraca i jak oceniasz rezultat…"
            disabled={reviewBusy || disabled}
          />
          <button type="submit" className="is-primary" disabled={reviewBusy || disabled || reviewRating < 1}>
            {reviewBusy ? "Publikowanie…" : "Opublikuj opinię"}
          </button>
        </form>
      )}
      {latest.status === "accepted" && !isClient && !savedReview && !reviewState.loading && (
        <p className="private-work-review-status">
          Zleceniodawca może teraz wystawić opinię na Twoim profilu.
        </p>
      )}
      {userId !== latest.submitted_by && <button type="button" className="private-work-report-link" onClick={() => onReport("work_delivery", latest.id)}>Zgłoś przekazaną pracę</button>}
      {message && <p className="private-work-form-message" role="status">{message}</p>}
      {reviewMessage && <p className="private-work-form-message" role="status">{reviewMessage}</p>}
    </section>
  );
}

export function PrivateReportDialog({ target, onClose, onSubmitted }) {
  const [reason, setReason] = useState("other_terms_breach");
  const [explanation, setExplanation] = useState("");
  const [legalReference, setLegalReference] = useState("");
  const [goodFaith, setGoodFaith] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  if (!target) return null;

  async function submit(event) {
    event.preventDefault();
    if (explanation.trim().length < 50 || !goodFaith) {
      setMessage("Wyjaśnij zgłoszenie w co najmniej 50 znakach i potwierdź dobrą wiarę.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const { data, error } = await supabase.rpc("submit_ideahire_private_content_report", {
        p_target_type: target.type,
        p_target_id: target.id,
        p_reason_code: reason,
        p_explanation: explanation.trim(),
        p_legal_reference: legalReference.trim() || null,
        p_good_faith_confirmed: true,
      });
      if (error) throw error;
      setMessage(`Zgłoszenie ${data?.report_number || ""} zostało przekazane do ręcznej analizy.`);
      await onSubmitted?.();
      window.setTimeout(onClose, 900);
    } catch (reportError) {
      setMessage(readableError(reportError, "Nie udało się wysłać zgłoszenia."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="private-work-report-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="private-work-report-dialog" role="dialog" aria-modal="true" aria-labelledby="private-report-title" onSubmit={submit}>
        <button type="button" className="private-work-report-close" onClick={onClose} aria-label="Zamknij">×</button>
        <span className="section-label">Zgłoszenie treści</span>
        <h2 id="private-report-title">Przekaż materiał do ręcznej analizy</h2>
        <p>Zgłoszenie nie nakłada sankcji automatycznie. Administrator oceni treść, kontekst i proporcjonalność ewentualnego działania.</p>
        <label>Powód<select value={reason} onChange={(event) => setReason(event.target.value)}>{REPORT_REASONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Co dokładnie jest niezgodne?<textarea value={explanation} onChange={(event) => setExplanation(event.target.value)} minLength={50} maxLength={5000} rows={5} placeholder="Opisz konkretne elementy i kontekst — minimum 50 znaków…" /></label>
        <label>Przepis lub punkt Regulaminu (opcjonalnie)<input type="text" value={legalReference} onChange={(event) => setLegalReference(event.target.value)} maxLength={1500} /></label>
        <label className="private-work-good-faith"><input type="checkbox" checked={goodFaith} onChange={(event) => setGoodFaith(event.target.checked)} /> Potwierdzam, że zgłaszam treść w dobrej wierze, a podane informacje są zgodne z moją wiedzą.</label>
        {message && <p className="private-work-form-message" role="status">{message}</p>}
        <div className="private-work-form-actions"><button type="button" onClick={onClose} disabled={busy}>Anuluj</button><button type="submit" className="is-primary" disabled={busy}>{busy ? "Wysyłanie…" : "Wyślij zgłoszenie"}</button></div>
      </form>
    </div>
  );
}
