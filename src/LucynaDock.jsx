/* P64 — a movable, non-modal window for the existing Lucyna assistant. */
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { SubpageLoading } from "./Subpages";
import LucynaSymbol from "./LucynaSymbol";
import "./LucynaDock.css";

export function requestLucynaDock(event) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !document.getElementById("ih64-lucyna")) return;
  event.preventDefault();
  window.dispatchEvent(new Event("ideahire:lucyna-open"));
}

export function canShowLucynaDock({ enabled, userId, authLoading, ageLoading, ageError, isAdult, canTransact, restrictionLoading, restricted, restrictionError, pathname = "/", isStaff = false, staffLoading = true }) {
  if (/^\/admin(?:\/|$)/.test(pathname)) return Boolean(enabled && userId && authLoading === false && isStaff === true && staffLoading === false && !/^\/admin\/lucyna\/?$/.test(pathname));
  return Boolean(enabled && userId && authLoading === false && ageLoading === false && !ageError
    && isAdult === true && canTransact === true && restrictionLoading === false && !restricted && !restrictionError
    && !/^\/(?:lucyna|admin|login|register|auth|reset-password|forgot-password)(?:\/|$)/.test(pathname));
}

function viewportBounds() {
  const viewport = window.visualViewport;
  const x = viewport?.offsetLeft || 0, y = viewport?.offsetTop || 0;
  const width = viewport?.width || window.innerWidth, height = viewport?.height || window.innerHeight;
  const navigation = document.querySelector(".ih68-top-nav");
  const rect = navigation?.getBoundingClientRect();
  const navigationInset = rect?.width > 0 && window.getComputedStyle(navigation).position === "fixed"
    && rect.top >= y && rect.top < y + height && rect.bottom >= y + height - 1 ? y + height - rect.top : 0;
  const host = document.getElementById("ih64-lucyna");
  const safeInset = host ? parseFloat(window.getComputedStyle(host).getPropertyValue("--ih84-safe-bottom")) || 0 : 0;
  return { x, y, width, height, bottomInset: Math.max(navigationInset, safeInset) };
}

export function dockLayout(bounds, position) {
  const margin = Math.min(12, bounds.width / 10);
  const width = Math.min(408, Math.max(1, bounds.width - margin * 2));
  const reservedBottom = Math.max(margin, (bounds.bottomInset || 0) + margin);
  const availableHeight = Math.max(1, bounds.height - margin - reservedBottom);
  const height = Math.min(bounds.width <= 640 ? 520 : 560,
    bounds.height < 520 ? availableHeight : Math.round(bounds.height * (bounds.width <= 640 ? .66 : .72)), availableHeight);
  const bottom = Math.min(reservedBottom + 56, bounds.height - height - margin);
  const x = position?.x ?? bounds.x + bounds.width - width - margin;
  const y = position?.y ?? bounds.y + bounds.height - height - bottom;
  return { width, height,
    x: Math.max(bounds.x + margin, Math.min(x, bounds.x + bounds.width - width - margin)),
    y: Math.max(bounds.y + margin, Math.min(y, bounds.y + bounds.height - height - reservedBottom)) };
}

function launcherLayout(bounds, position) {
  const margin = Math.min(12, bounds.width / 10);
  const width = Math.min(72, Math.max(1, bounds.width - margin * 2));
  const height = 44;
  const bottom = Math.max(22, (bounds.bottomInset || 0) + 12);
  return { width, height,
    x: Math.max(bounds.x + margin, Math.min(position?.x ?? bounds.x + bounds.width - width - margin, bounds.x + bounds.width - width - margin)),
    y: Math.max(bounds.y + margin, Math.min(position?.y ?? bounds.y + bounds.height - height - bottom, bounds.y + bounds.height - height - bottom)) };
}

function windowNearLauncher(bounds, launcher) {
  const size = dockLayout(bounds);
  const above = launcher.y - size.height - 10;
  return { x: launcher.x + launcher.width - size.width,
    y: above >= bounds.y + 12 ? above : launcher.y + launcher.height + 10 };
}

function Icon({ kind }) {
  const paths = { close: "M6 6l12 12M18 6 6 18", minimise: "M5 12h14", return: "m14 7-5 5 5 5", move: "M8 7h.01M12 7h.01M16 7h.01M8 12h.01M12 12h.01M16 12h.01M8 17h.01M12 17h.01M16 17h.01" };
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={paths[kind]}/></svg>;
}

class DockBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <div className="ih64-dock-status" role="alert"><strong>Nie udało się otworzyć Lucyny.</strong><p>Otwórz rozmowę ponownie albo przejdź do pełnego widoku.</p><button type="button" onClick={this.props.onRetry}>Spróbuj ponownie</button><Link to={this.props.administration ? "/admin/lucyna" : "/lucyna"}>Otwórz pełny widok</Link></div> : this.props.children;
  }
}

export default function LucynaDock({ supabase, user, administration = false }) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false), [loaded, setLoaded] = useState(false);
  const [attempt, setAttempt] = useState(0);
  // The assistant code is downloaded when its window is first opened.
  const Assistant = useMemo(() => React.lazy(() => import("./Lucyna")), [attempt]);
  const [bounds, setBounds] = useState(viewportBounds), [position, setPosition] = useState(null);
  const [launcherPosition, setLauncherPosition] = useState(null), [dragging, setDragging] = useState(null);
  const panel = useRef(null), returnTab = useRef(null), drag = useRef(null);
  const suppressLauncherClick = useRef(false);
  const placementRef = useRef(null);
  placementRef.current = { position, launcherPosition };
  const launcher = launcherLayout(bounds, launcherPosition);
  const layout = dockLayout(bounds, position || (launcherPosition ? windowNearLauncher(bounds, launcher) : null));
  useEffect(() => {
    const viewport = window.visualViewport;
    const update = () => setBounds(viewportBounds());
    window.addEventListener("resize", update);
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    return () => {
      window.removeEventListener("resize", update);
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
    };
  }, []);
  useLayoutEffect(() => {
    setBounds(viewportBounds());
  }, [pathname, open]);
  useLayoutEffect(() => {
    if (open) panel.current?.focus({ preventScroll: true });
  }, [open]);
  useEffect(() => {
    const openFromMenu = () => show();
    window.addEventListener("ideahire:lucyna-open", openFromMenu);
    return () => window.removeEventListener("ideahire:lucyna-open", openFromMenu);
  }, []);
  function show(event) {
    if (event && suppressLauncherClick.current) {
      suppressLauncherClick.current = false;
      event.preventDefault();
      return;
    }
    suppressLauncherClick.current = false;
    setBounds(viewportBounds());
    if (!placementRef.current.position && !placementRef.current.launcherPosition) {
      const anchor = [...document.querySelectorAll('.ih-top-assistant,.ih-room-assistant')].find(element => element.getClientRects().length);
      if (anchor) {
        const rect = anchor.getBoundingClientRect();
        setPosition(windowNearLauncher(viewportBounds(), { x: rect.left, y: rect.top, width: rect.width, height: rect.height }));
      }
    }
    setLoaded(true);
    setOpen(true);
  }
  function minimise() {
    // A hidden chat must not keep a mobile keyboard over the page.
    if (panel.current?.contains(document.activeElement)) document.activeElement?.blur();
    setOpen(false);
    requestAnimationFrame(() => {
      const shortcut = [...document.querySelectorAll('.ih-top-assistant,.ih-room-assistant')].find(element => element.getClientRects().length);
      (shortcut || returnTab.current)?.focus({ preventScroll: true });
    });
  }
  function beginDrag(event, kind) {
    if (event.button !== 0 || event.isPrimary === false) return;
    suppressLauncherClick.current = false;
    const current = kind === "launcher" ? launcher : layout;
    drag.current = { id: event.pointerId, kind, x: event.clientX, y: event.clientY, startX: current.x, startY: current.y, moved: false };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }
  function moveDrag(event) {
    const start = drag.current;
    if (!start || start.id !== event.pointerId) return;
    if (!start.moved && Math.hypot(event.clientX - start.x, event.clientY - start.y) < 6) return;
    start.moved = true;
    setDragging(start.kind);
    if (start.kind === "launcher") suppressLauncherClick.current = true;
    const next = (start.kind === "launcher" ? launcherLayout : dockLayout)(viewportBounds(),
      { x: start.startX + event.clientX - start.x, y: start.startY + event.clientY - start.y });
    (start.kind === "launcher" ? setLauncherPosition : setPosition)({ x: next.x, y: next.y });
  }
  function endDrag(event) {
    if (drag.current?.id !== event.pointerId) return;
    drag.current = null;
    setDragging(null);
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function cancelDrag() {
    drag.current = null;
    setDragging(null);
  }
  function moveWithKeyboard(event, kind) {
    suppressLauncherClick.current = false;
    const delta = { ArrowLeft: [-16, 0], ArrowRight: [16, 0], ArrowUp: [0, -16], ArrowDown: [0, 16] }[event.key];
    const updatePosition = kind === "launcher" ? setLauncherPosition : setPosition;
    if (event.key === "Home") { event.preventDefault(); updatePosition(null); }
    if (!delta) return;
    event.preventDefault();
    const current = kind === "launcher" ? launcher : layout;
    const next = (kind === "launcher" ? launcherLayout : dockLayout)(bounds, { x: current.x + delta[0], y: current.y + delta[1] });
    updatePosition({ x: next.x, y: next.y });
  }
  return createPortal(<div id="ih64-lucyna" data-no-translate="true" data-dragging={dragging || undefined}>
    {loaded && <section ref={panel} id="ih64-lucyna-window" className="ih64-dock-window" role="dialog" aria-modal="false" aria-labelledby="ih64-lucyna-title" tabIndex={-1} hidden={!open}
      style={{ left: layout.x, top: layout.y, width: layout.width, height: layout.height }}
      onKeyDown={event => {
        if (event.key !== "Escape" || event.defaultPrevented || panel.current?.querySelector(".lu-info-shade,.lu-sidebar.is-open")) return;
        event.preventDefault(); event.stopPropagation(); minimise();
      }}>
      <header className="ih64-dock-heading">
        <button className="ih64-dock-handle" type="button" aria-label="Przesuń okno Lucyny. Użyj przeciągania lub klawiszy strzałek. Home przywraca pozycję."
          onPointerDown={event => beginDrag(event, "window")} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={cancelDrag} onKeyDown={event => moveWithKeyboard(event, "window")} onDoubleClick={() => setPosition(null)}>
          <LucynaSymbol/><span><strong id="ih64-lucyna-title">Lucyna <span>AI</span></strong><small>Asystent AI IdeaHire</small></span>
        </button>
        <button className="ih64-dock-control" type="button" title="Zwiń okno" aria-label="Zwiń okno Lucyny" onClick={() => minimise()}><Icon kind="minimise"/></button>
        <button className="ih64-dock-control" type="button" title="Zamknij okno" aria-label="Zamknij okno Lucyny AI" onClick={() => minimise()}><Icon kind="close"/></button>
      </header>
      <div className="ih64-dock-body"><DockBoundary administration={administration} key={attempt} onRetry={() => setAttempt(value => value + 1)}><React.Suspense fallback={<SubpageLoading />}><Assistant supabase={supabase} user={user} embedded visible={open} administration={administration}/></React.Suspense></DockBoundary></div>
    </section>}
    {!open && !administration && <button ref={returnTab} className="ih64-dock-return" type="button" aria-label="Otwórz Lucynę — asystenta AI. Przeciągnij, aby przesunąć przycisk, lub użyj klawiszy strzałek. Home przywraca pozycję." aria-haspopup="dialog" aria-expanded="false" aria-controls={loaded ? "ih64-lucyna-window" : undefined} title="Lucyna AI — kliknij, aby otworzyć; przeciągnij, aby przesunąć"
      style={{ "--ih84-launcher-x": launcher.x + "px", "--ih84-launcher-y": launcher.y + "px", "--ih84-launcher-width": launcher.width + "px" }}
      onPointerDown={event => beginDrag(event, "launcher")} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={cancelDrag} onKeyDown={event => moveWithKeyboard(event, "launcher")} onClick={show}><strong>AI</strong><LucynaSymbol/></button>}
  </div>, document.body);
}
