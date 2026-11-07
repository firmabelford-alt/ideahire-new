import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowIcon } from "./InterfaceIcons";
import { supabase } from "./supabase";
import "./HomeCooperation.css";

export function HomeClarity({ en = false }) {
  const [reviews, setReviews] = useState([]);
  const [status, setStatus] = useState("loading");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    // The existing public SELECT policy admits only visible reviews.
    // Select only columns already granted to anonymous visitors.
    supabase.from("ideahire_job_reviews")
      .select("id, contractor_id, rating, review_text, created_at")
      .order("created_at", { ascending: false }).limit(8)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) { setStatus("error"); return; }
        setReviews((data || []).filter(row => row.review_text?.trim() && Number.isInteger(Number(row.rating)) && Number(row.rating) >= 1 && Number(row.rating) <= 5));
        setStatus("ready");
      }).catch(() => { if (!cancelled) setStatus("error"); });
    return () => { cancelled = true; };
  }, [attempt]);

  return <section className="ih-cooperation ih-real-reviews" aria-labelledby="ih-reviews-title" data-no-translate="true">
    <div className="ih-reviews-heading">
      <h2 id="ih-reviews-title">{en ? "Reviews after working together" : "Opinie po współpracy"}</h2>
      <span>{en ? "From completed projects" : "Z zakończonych zleceń"}</span>
    </div>
    {status === "loading" && <p className="ih-reviews-notice" role="status">{en ? "Loading reviews…" : "Ładowanie opinii…"}</p>}
    {status === "error" && <div className="ih-reviews-notice" role="status"><p>{en ? "Reviews are temporarily unavailable." : "Opinie są chwilowo niedostępne."}</p><button type="button" onClick={() => setAttempt(value => value + 1)}>{en ? "Try again" : "Spróbuj ponownie"}</button></div>}
    {status === "ready" && !reviews.length && <p className="ih-reviews-notice">{en ? "The first reviews will appear after completed projects." : "Pierwsze opinie pojawią się po zakończonych współpracach."}</p>}
    {status === "ready" && reviews.length > 0 && <HomeReviewRail reviews={reviews} en={en} />}
  </section>;
}

function HomeReviewRail({ reviews, en }) {
  const viewportRef = useRef(null);
  const groupRef = useRef(null);
  useEffect(() => {
    const viewport = viewportRef.current;
    const group = groupRef.current;
    if (!viewport || !group || reviews.length < 2) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const hover = window.matchMedia("(hover: hover)");
    let frame = 0, last = 0, visible = true, held = false, manualUntil = 0;
    let loopWidth = group.getBoundingClientRect().width;
    const measure = () => { loopWidth = group.getBoundingClientRect().width; };
    const pause = () => { manualUntil = performance.now() + 6000; };
    const press = () => { held = true; pause(); };
    const release = () => { if (!held) return; held = false; pause(); };
    const move = () => { if (held) pause(); };
    const resize = typeof ResizeObserver === "function" ? new ResizeObserver(measure) : null;
    resize?.observe(group);
    resize?.observe(viewport);
    const observer = typeof IntersectionObserver === "function" ? new IntersectionObserver(entries => { visible = entries.some(entry => entry.isIntersecting); }, { threshold: .05 }) : null;
    observer?.observe(viewport);
    viewport.addEventListener("wheel", pause, { passive: true });
    viewport.addEventListener("pointerdown", press, { passive: true });
    viewport.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    window.addEventListener("blur", release);
    function tick(now) {
      const playing = visible && !document.hidden && !motion.matches && !held && now > manualUntil && !viewport.contains(document.activeElement) && !(hover.matches && viewport.matches(":hover"));
      if (playing && last && loopWidth > 0) viewport.scrollLeft = (Math.max(0, viewport.scrollLeft) + Math.min(now - last, 64) * .028) % loopWidth;
      const state = playing ? "running" : "paused";
      if (viewport.dataset.autoplay !== state) viewport.dataset.autoplay = state;
      last = now;
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame); resize?.disconnect(); observer?.disconnect();
      viewport.removeEventListener("wheel", pause); viewport.removeEventListener("pointerdown", press); viewport.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", release); window.removeEventListener("pointercancel", release); window.removeEventListener("blur", release);
      delete viewport.dataset.autoplay;
    };
  }, [reviews.length]);
  return <div ref={viewportRef} className="ih-reviews-viewport" tabIndex={0} data-single={reviews.length === 1} aria-label={en ? "Reviews scroll automatically. Focus here to pause; swipe to browse." : "Opinie przewijają się automatycznie. Ustaw fokus, aby zatrzymać; przesuń, aby przeglądać."}>
    <div className="ih-reviews-track">
      {(reviews.length > 1 ? [0, 1, 2] : [0]).map(copy => <div className="ih-reviews-group" key={copy} ref={copy === 0 ? groupRef : undefined} data-review-copy={copy} aria-hidden={copy ? true : undefined}>
        {reviews.map(review => <article className="ih-real-review" key={review.id}>
        <div className="ih-review-stars" role="img" aria-label={en ? `${review.rating} out of 5 stars` : `${review.rating} z 5 gwiazdek`}>
          {Array.from({ length: 5 }, (_, index) => <span key={index} data-filled={index < Number(review.rating)} aria-hidden="true">★</span>)}
        </div>
        <blockquote>{review.review_text}</blockquote>
        <div className="ih-review-source"><span>{en ? "Client review" : "Opinia zleceniodawcy"}</span><time dateTime={review.created_at}>{new Date(review.created_at).toLocaleDateString(en ? "en-GB" : "pl-PL", { day: "numeric", month: "short", year: "numeric" })}</time></div>
        <Link className="ih-review-profile" tabIndex={copy ? -1 : undefined} onMouseDown={copy ? event => event.preventDefault() : undefined} to={`/profile/${review.contractor_id}`}>{en ? "View professional" : "Zobacz wykonawcę"}<ArrowIcon direction="up-right" /></Link>
      </article>)}
      </div>)}
    </div>
  </div>;
}

function ConnectionArtwork({ kind }) {
  const sceneRef = useRef(null);
  const lastPlay = useRef(0);
  const [active, setActive] = useState(false);
  const [cycle, setCycle] = useState(0);
  useEffect(() => {
    const node = sceneRef.current;
    if (!node) return;
    const play = () => { lastPlay.current = Date.now(); setActive(true); };
    if (typeof IntersectionObserver !== "function") { play(); return; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { play(); observer.disconnect(); }
    }, { threshold: .6 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  function replay(event) {
    if (event.pointerType !== "mouse" || !active || Date.now() - lastPlay.current < 2000) return;
    lastPlay.current = Date.now();
    setCycle(value => value + 1);
  }
  return <div ref={sceneRef} className="ih-scene-art" data-kind={kind} data-play={active} aria-hidden="true" onPointerEnter={replay}>
    <svg viewBox="0 0 400 340" focusable="false">
      {kind === "search" ? <g key={cycle}>
        <circle className="ih-scene-orbit" cx="176" cy="150" r="118" />
        <circle className="ih-scene-dot" cx="303" cy="75" r="8" />
        <circle className="ih-scene-orbit" cx="70" cy="267" r="12" />
        <g className="ih-search-lens">
          <path className="ih-search-handle" d="m246 220 66 66" />
          <circle className="ih-search-glass" cx="176" cy="150" r="90" />
          <circle className="ih-search-rim" cx="176" cy="150" r="90" />
          <g className="ih-search-person"><circle cx="176" cy="130" r="19" /><path d="M138 191c0-48 76-48 76 0Z" /></g>
          <path className="ih-search-focus" d="M113 119V91h28m70 0h28v28m0 62v28h-28m-70 0h-28v-28" />
        </g>
      </g> : <g key={cycle}>
        <circle className="ih-scene-orbit" cx="205" cy="166" r="123" />
        <path className="ih-flight-trail" d="M41 278c-26-81 49-125 88-87s-22 83-40 32 81-70 123-45" />
        <g className="ih-flight-plane">
          <path className="ih-plane-body" d="M80 165 327 68 244 274 193 198Z" />
          <path className="ih-plane-wing" d="m193 198 134-130-104 116 21 90Z" />
          <path className="ih-plane-fold" d="M193 198 327 68 223 184l21 90" />
        </g>
        <path className="ih-scene-spark" d="M76 89v25M64 101h25M324 256v18m-9-9h18" />
        <circle className="ih-scene-dot" cx="331" cy="115" r="6" />
      </g>}
    </svg>
  </div>;
}

export function HomePaths({ en = false }) {
  return <section className="ih-cooperation ih-paths" id="for-users" aria-label={en ? "Start a collaboration" : "Rozpocznij współpracę"} data-no-translate="true">
    <div className="ih-action-squares">
      <Link className="ih-action-square" to="/find-talent">
        <span className="ih-square-index"><span aria-hidden="true">01</span>{en ? "For clients" : "Dla zlecających"}</span>
        <ConnectionArtwork kind="search" />
        <div className="ih-square-action"><h2>{en ? "Hire a professional" : "Zleć pracę"}</h2><span><ArrowIcon direction="up-right" /></span></div>
      </Link>
      <Link className="ih-action-square ih-action-square-flight" to="/jobs">
        <span className="ih-square-index"><span aria-hidden="true">02</span>{en ? "For professionals" : "Dla wykonawców"}</span>
        <ConnectionArtwork kind="flight" />
        <div className="ih-square-action"><h2>{en ? "Find a project" : "Znajdź zlecenie"}</h2><span><ArrowIcon direction="up-right" /></span></div>
      </Link>
    </div>

  </section>;
}
