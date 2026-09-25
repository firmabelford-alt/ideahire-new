import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "./supabase";

const PRIVATE_WORK_BUCKET = "ideahire-private-work";
const MAX_ITEMS = 12;
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "text/plain",
]);

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
    let serverMessage = "";
    try {
      const payload = await error.context?.json?.();
      serverMessage = String(payload?.error || "");
    } catch {
      // Odpowiedź nie zawierała możliwego do odczytu JSON-u.
    }
    throw new Error(serverMessage || error.message);
  }
  if (!data?.ok) {
    throw new Error(data?.error || "Funkcja serwerowa odrzuciła operację.");
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

export function usePrivateWork(conversationId, userId, enabled = true) {
  const [items, setItems] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [events, setEvents] = useState([]);
  const [signedUrls, setSignedUrls] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reportTarget, setReportTarget] = useState(null);

  const load = useCallback(async () => {
    if (!enabled || !conversationId || !userId) return;
    setLoading(true);
    try {
      const [itemsResult, deliveriesResult] = await Promise.all([
        supabase
          .from("ideahire_shared_items")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true })
          .order("display_order", { ascending: true }),
        supabase
          .from("ideahire_work_deliveries")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("version", { ascending: false }),
      ]);
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
        if (urlError) throw urlError;
        (urlRows || []).forEach((row, index) => {
          if (row?.signedUrl) urlMap[activePaths[index]] = row.signedUrl;
        });
      }

      setItems(itemRows);
      setDeliveries(deliveryRows);
      setEvents(eventRows);
      setSignedUrls(urlMap);
      setError("");
    } catch (loadError) {
      setError(readableError(loadError, "Nie udało się pobrać prywatnych materiałów."));
    } finally {
      setLoading(false);
    }
  }, [conversationId, enabled, userId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!enabled || !conversationId || !userId) return undefined;
    const refresh = () => load();
    const channel = supabase
      .channel(`private-work:${conversationId}:${userId}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "ideahire_shared_items",
        filter: `conversation_id=eq.${conversationId}`,
      }, refresh)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "ideahire_work_deliveries",
        filter: `conversation_id=eq.${conversationId}`,
      }, refresh)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [conversationId, enabled, load, userId]);

  const itemsByMessage = useMemo(() => {
    const result = {};
    items.forEach((item) => {
      (result[item.message_id] ||= []).push(item);
    });
    return result;
  }, [items]);

  return {
    items,
    itemsByMessage,
    deliveries,
    events,
    signedUrls,
    loading,
    error,
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
          <a href={source} target="_blank" rel="noopener noreferrer" download={item.display_name} aria-label="Pobierz zdjęcie">↓</a>
          <button type="button" className="private-work-lightbox-close" onClick={onClose} aria-label="Zamknij">×</button>
        </div>
      </header>
      {images.length > 1 && (
        <button type="button" className="private-work-lightbox-arrow is-left" onClick={() => onSelect(previous.id)} aria-label="Poprzednie zdjęcie">‹</button>
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
        <button type="button" className="private-work-lightbox-arrow is-right" onClick={() => onSelect(next.id)} aria-label="Następne zdjęcie">›</button>
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
                <span className="private-work-file-action" aria-hidden="true">{presentation.action} ↓</span>
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
          {links.map((item) => (
            <div className="private-work-link-row" key={item.id}>
              <a href={item.external_url} target="_blank" rel="noopener noreferrer nofollow">
                <span aria-hidden="true">↗</span>
                <b>{item.display_name}</b>
                <small>{new URL(item.external_url).hostname}</small>
              </a>
              {!ownMessage && <button type="button" onClick={() => onReport("shared_item", item.id)}>Zgłoś</button>}
            </div>
          ))}
          </div>
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

export function PrivateSharePanel({
  conversationId,
  userId,
  disabled,
  agreementAccepted,
  isContractor,
  onComplete,
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("materials");
  const [files, setFiles] = useState([]);
  const [links, setLinks] = useState([{ url: "", label: "" }]);
  const [caption, setCaption] = useState("");
  const [albumTitle, setAlbumTitle] = useState("");
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [safetyConfirmed, setSafetyConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const imageCount = files.filter((file) => file.type.startsWith("image/")).length;

  useEffect(() => {
    if (!open) return undefined;
    function closeOnEscape(event) {
      if (event.key === "Escape" && !busy) setOpen(false);
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [busy, open]);

  function handleFiles(event) {
    const next = Array.from(event.target.files || []);
    const valid = [];
    for (const file of next) {
      if (!ALLOWED_MIME_TYPES.has(file.type)) {
        setMessage(`Plik „${file.name}” ma niedozwolony format.`);
        continue;
      }
      if (file.size < 1 || file.size > MAX_FILE_BYTES) {
        setMessage(`Plik „${file.name}” musi mieć maksymalnie 20 MB.`);
        continue;
      }
      valid.push(file);
    }
    setFiles((current) => [...current, ...valid].slice(0, MAX_ITEMS));
    event.target.value = "";
  }

  async function submit(event) {
    event.preventDefault();
    if (busy || disabled) return;
    const preparedLinks = links.filter((link) => link.url.trim());
    const total = files.length + preparedLinks.length;
    if (total < 1 || total > MAX_ITEMS) {
      setMessage("Dodaj od 1 do 12 plików, zdjęć albo linków.");
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
    setBusy(true);
    setProgress(0);
    setMessage("");

    try {
      const totalFileBytes = files.reduce(
        (sum, file) => sum + file.size,
        0
      );
      if (totalFileBytes > 60 * 1024 * 1024) {
        throw new Error(
          "Łączny rozmiar jednej paczki plików nie może przekroczyć 60 MB."
        );
      }

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
              contentType: file.type,
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
        files: uploaded,
        links: preparedLinks.map((link) => ({
          id: crypto.randomUUID(),
          batchId,
          url: normalizeLink(link.url),
          label: link.label.trim() || new URL(normalizeLink(link.url)).hostname,
        })),
      };

      setProgress(82);
      await invokeSecureWork(preparedBody);

      setProgress(100);
      setFiles([]);
      setLinks([{ url: "", label: "" }]);
      setCaption("");
      setAlbumTitle("");
      setRightsConfirmed(false);
      setSafetyConfirmed(false);
      setMessage(mode === "delivery" ? "Praca została przekazana do odbioru." : "Materiały zostały bezpiecznie przekazane.");
      await onComplete?.();
      window.setTimeout(() => setOpen(false), 650);
    } catch (submitError) {
      if (uploaded.length) {
        await supabase.storage.from(PRIVATE_WORK_BUCKET).remove(uploaded.map((item) => item.path));
      }
      setMessage(readableError(submitError, "Nie udało się przekazać materiałów."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={`private-work-share ${open ? "is-open" : ""}`}>
      <button type="button" className="private-work-share-toggle" onClick={() => setOpen((value) => !value)} disabled={disabled}>
        <span aria-hidden="true">＋</span>
        <b>Dodaj</b>
        <small>zdjęcia, pliki lub linki</small>
      </button>
      {open && (
        <div className="private-work-share-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !busy) setOpen(false);
        }}>
        <form onSubmit={submit} className="private-work-share-form" role="dialog" aria-modal="true" aria-labelledby="private-work-share-title">
          <div className="private-work-share-heading">
            <div>
              <span className="section-label">Prywatna przestrzeń pracy</span>
              <h2 id="private-work-share-title">Dodaj materiały do rozmowy</h2>
            </div>
            <button type="button" onClick={() => setOpen(false)} disabled={busy} aria-label="Zamknij okno dodawania materiałów">×</button>
          </div>
          <div className="private-work-tabs" role="tablist" aria-label="Sposób wysyłki">
            <button type="button" className={mode === "materials" ? "is-active" : ""} onClick={() => setMode("materials")}>Materiały do rozmowy</button>
            <button
              type="button"
              className={mode === "delivery" ? "is-active" : ""}
              onClick={() => setMode("delivery")}
              disabled={!agreementAccepted || !isContractor}
              title={!agreementAccepted ? "Najpierw zaakceptujcie Formularz współpracy" : !isContractor ? "Pracę przekazuje wykonawca" : ""}
            >
              Przekaż pracę
            </button>
          </div>

          <div className="private-work-field">
            <label htmlFor="private-work-caption">{mode === "delivery" ? "Co przekazujesz i jak sprawdzić rezultat?" : "Wiadomość do materiałów (opcjonalnie)"}</label>
            <textarea id="private-work-caption" value={caption} onChange={(event) => setCaption(event.target.value)} maxLength={4000} rows={3} placeholder={mode === "delivery" ? "Opisz gotową pracę, zawartość plików i sposób ich weryfikacji…" : "Dodaj krótki kontekst…"} />
          </div>

          <div className="private-work-picker-row">
            <label className="private-work-file-picker">
              <input type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf,text/plain" onChange={handleFiles} />
              <span>Dodaj zdjęcia lub pliki</span>
              <small>JPG, PNG, WEBP, PDF lub TXT · do 20 MB</small>
            </label>
            <button type="button" className="private-work-add-link" onClick={() => setLinks((current) => current.length + files.length < MAX_ITEMS ? [...current, { url: "", label: "" }] : current)}>
              + Dodaj kolejny link
            </button>
          </div>

          {files.length > 0 && (
            <div className="private-work-selected-files">
              {files.map((file, index) => (
                <span key={`${file.name}-${file.lastModified}-${index}`}>
                  <b>{file.name}</b><small>{formatBytes(file.size)}</small>
                  <button type="button" onClick={() => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Usuń ${file.name}`}>×</button>
                </span>
              ))}
            </div>
          )}

          {imageCount > 1 && (
            <div className="private-work-field private-work-album-name-field">
              <label htmlFor="private-work-album-title">Nazwa zestawu zdjęć (opcjonalnie)</label>
              <input id="private-work-album-title" type="text" value={albumTitle} onChange={(event) => setAlbumTitle(event.target.value)} maxLength={120} placeholder="Np. Grafiki na Instagram — wersja finalna" />
              <small>{imageCount} {imageCount < 5 ? "zdjęcia" : "zdjęć"} zostanie pokazanych jako jedna schludna galeria.</small>
            </div>
          )}

          <div className="private-work-link-inputs">
            {links.map((link, index) => (
              <div key={index}>
                <input type="url" value={link.url} onChange={(event) => setLinks((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, url: event.target.value } : item))} placeholder="https://link-do-pracy.pl" />
                <input type="text" value={link.label} onChange={(event) => setLinks((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item))} placeholder="Nazwa linku (opcjonalnie)" maxLength={180} />
                {links.length > 1 && <button type="button" onClick={() => setLinks((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label="Usuń link">×</button>}
              </div>
            ))}
          </div>

          <aside className="private-work-security-note">
            <b>Nie wysyłaj haseł, kodów 2FA, kluczy API ani danych kart.</b>
            <span>Do sekretów używaj osobnego menedżera haseł z dostępem czasowym. IdeaHire sprawdza format i sygnaturę pliku, ale nie gwarantuje, że każdy plik jest wolny od złośliwego kodu.</span>
          </aside>

          {mode === "delivery" && (
            <div className="private-work-confirmations">
              <label><input type="checkbox" checked={rightsConfirmed} onChange={(event) => setRightsConfirmed(event.target.checked)} /> Mam prawa lub wymagane zgody do przekazywanych materiałów.</label>
              <label><input type="checkbox" checked={safetyConfirmed} onChange={(event) => setSafetyConfirmed(event.target.checked)} /> Nie dołączam świadomie złośliwego kodu ani danych, których nie wolno mi ujawniać.</label>
            </div>
          )}

          {busy && <div className="private-work-progress"><span style={{ width: `${progress}%` }} /></div>}
          {message && <p className="private-work-form-message" role="status">{message}</p>}
          <div className="private-work-form-actions">
            <button type="button" onClick={() => setOpen(false)} disabled={busy}>Anuluj</button>
            <button type="submit" className="is-primary" disabled={busy || disabled}>
              {busy ? "Sprawdzanie i wysyłanie…" : mode === "delivery" ? "Przekaż pracę do odbioru" : "Wyślij materiały"}
            </button>
          </div>
        </form>
        </div>
      )}
    </section>
  );
}

export function WorkDeliveryPanel({ deliveries, events, conversation, userId, disabled, onComplete, onReport }) {
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
    if (action === "accept" && !window.confirm("Akceptujesz tę wersję pracy i oznaczasz współpracę jako zakończoną. Kontynuować?")) return;
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
      setMessage(action === "accept" ? "Praca została zaakceptowana." : "Wykonawca otrzymał listę poprawek.");
      await onComplete?.();
    } catch (responseError) {
      setMessage(readableError(responseError, "Nie udało się zapisać decyzji."));
    } finally {
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
        {!isClient && latest.status !== "blocked" && <small>{latest.status === "submitted" ? "Czekamy na decyzję zleceniodawcy" : "Status formalnego przekazania"}</small>}
      </div>
      <p>{latest.summary}</p>
      {latest.requested_changes && <blockquote><b>Wymagane poprawki</b>{latest.requested_changes}</blockquote>}
      {history.length > 0 && (
        <details><summary>Historia odbioru ({history.length})</summary>{history.map((event) => <p key={event.id}><time>{new Date(event.created_at).toLocaleString("pl-PL")}</time>{event.message}</p>)}</details>
      )}
      {isClient && latest.status === "submitted" && (
        <div className="private-work-delivery-actions">
          <textarea value={changes} onChange={(event) => setChanges(event.target.value)} minLength={20} maxLength={4000} rows={3} placeholder="Jeśli potrzebujesz zmian, opisz je konkretnie…" />
          <div>
            <button type="button" onClick={() => respond("request_changes")} disabled={busy || disabled}>Poproś o poprawki</button>
            <button type="button" className="is-primary" onClick={() => respond("accept")} disabled={busy || disabled}>Zaakceptuj i zakończ</button>
          </div>
        </div>
      )}
      {latest.status === "accepted" && (
        <div className="private-work-completion" role="status">
          <span aria-hidden="true">✓</span>
          <div>
            <strong>Zlecenie zakończone</strong>
            <p>Współpraca została zapisana jako wykonana na profilu wykonawcy.</p>
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
