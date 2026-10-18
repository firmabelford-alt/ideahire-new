/* P64 — a movable, non-modal window for the existing Lucyna assistant. */
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import "./LucynaDock.css";

const Assistant = React.lazy(() => import("./Lucyna"));

export function requestLucynaDock(event) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !document.getElementById("ih64-lucyna")) return;
  event.preventDefault();
  window.dispatchEvent(new Event("ideahire:lucyna-open"));
}

export function canShowLucynaDock({ enabled, userId, authLoading, ageLoading, ageError, isAdult, canTransact, restrictionLoading, restricted, restrictionError, pathname = "/" }) {
  return Boolean(enabled && userId && authLoading === false && ageLoading === false && !ageError
    && isAdult === true && canTransact === true && restrictionLoading === false && !restricted && !restrictionError
    && !/^\/(?:lucyna|admin|login|register|auth|reset-password|forgot-password)(?:\/|$)/.test(pathname));
}

function viewportBounds() {
  const viewport = window.visualViewport;
  return { x: viewport?.offsetLeft || 0, y: viewport?.offsetTop || 0,
    width: viewport?.width || window.innerWidth, height: viewport?.height || window.innerHeight };
}

export function dockLayout(bounds, position) {
  const margin = Math.min(12, bounds.width / 10);
  const width = Math.min(408, Math.max(1, bounds.width - margin * 2));
  const availableHeight = Math.max(1, bounds.height - margin * 2);
  const height = Math.min(bounds.width <= 640 ? 520 : 560,
    bounds.height < 520 ? availableHeight : Math.round(bounds.height * (bounds.width <= 640 ? .66 : .72)), availableHeight);
  const bottom = bounds.height < 520 ? margin : 88;
  const x = position?.x ?? bounds.x + bounds.width - width - margin;
  const y = position?.y ?? bounds.y + bounds.height - height - bottom;
  return { width, height,
    x: Math.max(bounds.x + margin, Math.min(x, bounds.x + bounds.width - width - margin)),
    y: Math.max(bounds.y + margin, Math.min(y, bounds.y + bounds.height - height - margin)) };
}

function Icon({ kind }) {
  const paths = { close: "M6 6l12 12M18 6 6 18", minimise: "M5 12h14", return: "m14 7-5 5 5 5", move: "M8 7h.01M12 7h.01M16 7h.01M8 12h.01M12 12h.01M16 12h.01M8 17h.01M12 17h.01M16 17h.01" };
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={paths[kind]}/></svg>;
}

class DockBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <div className="ih64-dock-status" role="status"><strong>Nie udało się otworzyć Lucyny.</strong><p>Możesz wrócić do pracy i spróbować ponownie.</p><Link to="/lucyna">Otwórz pełny widok</Link></div> : this.props.children;
  }
}

export default function LucynaDock({ supabase, user }) {
  const [open, setOpen] = useState(false), [loaded, setLoaded] = useState(false), [hidden, setHidden] = useState(false);
  const [bounds, setBounds] = useState(viewportBounds), [position, setPosition] = useState(null);
  const panel = useRef(null), launcher = useRef(null), returnTab = useRef(null), drag = useRef(null);
  const layout = dockLayout(bounds, position);
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
    if (open) panel.current?.focus({ preventScroll: true });
  }, [open]);
  useEffect(() => {
    const openFromMenu = () => { setHidden(false); setLoaded(true); setOpen(true); };
    window.addEventListener("ideahire:lucyna-open", openFromMenu);
    return () => window.removeEventListener("ideahire:lucyna-open", openFromMenu);
  }, []);
  function show() { setHidden(false); setLoaded(true); setOpen(true); }
  function minimise(hideLauncher = false) {
    // A hidden chat must not keep a mobile keyboard over the page.
    if (panel.current?.contains(document.activeElement)) document.activeElement?.blur();
    setOpen(false); setHidden(hideLauncher);
    requestAnimationFrame(() => (hideLauncher ? returnTab : launcher).current?.focus({ preventScroll: true }));
  }
  function beginDrag(event) {
    if (event.button !== 0 || !event.isPrimary) return;
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, startX: layout.x, startY: layout.y };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }
  function moveDrag(event) {
    const start = drag.current;
    if (!start || start.id !== event.pointerId) return;
    const next = dockLayout(viewportBounds(), { x: start.startX + event.clientX - start.x, y: start.startY + event.clientY - start.y });
    setPosition({ x: next.x, y: next.y });
  }
  function endDrag(event) {
    if (drag.current?.id !== event.pointerId) return;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function moveWithKeyboard(event) {
    const delta = { ArrowLeft: [-16, 0], ArrowRight: [16, 0], ArrowUp: [0, -16], ArrowDown: [0, 16] }[event.key];
    if (event.key === "Home") { event.preventDefault(); setPosition(null); }
    if (!delta) return;
    event.preventDefault();
    const next = dockLayout(bounds, { x: layout.x + delta[0], y: layout.y + delta[1] });
    setPosition({ x: next.x, y: next.y });
  }
  return createPortal(<div id="ih64-lucyna" data-no-translate="true">
    {loaded && <section ref={panel} id="ih64-lucyna-window" className="ih64-dock-window" role="dialog" aria-modal="false" aria-labelledby="ih64-lucyna-title" tabIndex={-1} hidden={!open}
      style={{ left: layout.x, top: layout.y, width: layout.width, height: layout.height }}
      onKeyDown={event => {
        if (event.key !== "Escape" || event.defaultPrevented || panel.current?.querySelector(".lu-info-shade,.lu-sidebar.is-open")) return;
        event.preventDefault(); event.stopPropagation(); minimise();
      }}>
      <header className="ih64-dock-heading">
        <button className="ih64-dock-handle" type="button" aria-label="Przesuń okno Lucyny. Użyj przeciągania lub klawiszy strzałek. Home przywraca pozycję."
          onPointerDown={beginDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={() => { drag.current = null; }} onKeyDown={moveWithKeyboard} onDoubleClick={() => setPosition(null)}>
          <Icon kind="move"/><span><strong id="ih64-lucyna-title">Lucyna <span>AI</span></strong><small>Pomoc w IdeaHire</small></span>
        </button>
        <button className="ih64-dock-control" type="button" title="Zwiń okno" aria-label="Zwiń okno Lucyny" onClick={() => minimise()}><Icon kind="minimise"/></button>
        <button className="ih64-dock-control" type="button" title="Zamknij i schowaj przycisk" aria-label="Zamknij Lucynę i schowaj przycisk" onClick={() => minimise(true)}><Icon kind="close"/></button>
      </header>
      <div className="ih64-dock-body"><DockBoundary><React.Suspense fallback={<p className="ih64-dock-status" role="status">Otwieram Lucynę…</p>}><Assistant supabase={supabase} user={user} embedded visible={open}/></React.Suspense></DockBoundary></div>
    </section>}
    {!open && !hidden && <div className="ih64-dock-launcher" style={{ right: 16, bottom: 88 }}>
      <button ref={launcher} className="ih64-dock-open" type="button" aria-label="Otwórz okno Lucyny AI" aria-expanded="false" aria-controls="ih64-lucyna-window" onClick={show}><span aria-hidden="true">L</span><strong>Lucyna <small>AI</small></strong></button>
      <button className="ih64-dock-hide" type="button" aria-label="Schowaj przycisk Lucyny" title="Schowaj przycisk" onClick={() => { setHidden(true); requestAnimationFrame(() => returnTab.current?.focus()); }}><Icon kind="close"/></button>
    </div>}
    {!open && hidden && <button ref={returnTab} className="ih64-dock-return" type="button" aria-label="Otwórz schowaną Lucynę AI" title="Otwórz Lucynę" onClick={show}><Icon kind="return"/><span aria-hidden="true">L</span></button>}
  </div>, document.body);
}
