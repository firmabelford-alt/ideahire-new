import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowIcon } from "./InterfaceIcons";
import { IDEA_HIRE_MARK } from "./Brand";
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
    let frame = 0, last = 0, visible = true, held = false, manualUntil = 0;
    let loopWidth = group.getBoundingClientRect().width;
    const measure = () => { loopWidth = group.getBoundingClientRect().width; };
    const pause = () => { manualUntil = performance.now() + 6000; };
    const press = () => { held = true; pause(); };
    const release = () => { if (!held) return; held = false; manualUntil = performance.now() + 1600; };
    const move = () => { if (held) pause(); };
    const wheel = event => { if (Math.abs(event.deltaX) > Math.abs(event.deltaY) || event.shiftKey) pause(); };
    const resize = typeof ResizeObserver === "function" ? new ResizeObserver(measure) : null;
    resize?.observe(group);
    resize?.observe(viewport);
    const observer = typeof IntersectionObserver === "function" ? new IntersectionObserver(entries => { visible = entries.some(entry => entry.isIntersecting); }, { threshold: .05 }) : null;
    observer?.observe(viewport);
    viewport.addEventListener("wheel", wheel, { passive: true });
    viewport.addEventListener("pointerdown", press, { passive: true });
    viewport.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    window.addEventListener("blur", release);
    function tick(now) {
      const keyboardFocus = viewport.contains(document.activeElement) && document.activeElement.matches(":focus-visible");
      const playing = visible && !document.hidden && !motion.matches && !held && now > manualUntil && !keyboardFocus;
      if (playing && last && loopWidth > 0) viewport.scrollLeft = (Math.max(0, viewport.scrollLeft) + Math.min(now - last, 64) * .028) % loopWidth;
      const state = playing ? "running" : "paused";
      if (viewport.dataset.autoplay !== state) viewport.dataset.autoplay = state;
      last = now;
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame); resize?.disconnect(); observer?.disconnect();
      viewport.removeEventListener("wheel", wheel); viewport.removeEventListener("pointerdown", press); viewport.removeEventListener("pointermove", move);
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
  const [active, setActive] = useState(false);
  useEffect(() => {
    const node = sceneRef.current;
    if (!node) return;
    if (typeof IntersectionObserver !== "function") { setActive(true); return; }
    const observer = new IntersectionObserver(entries => {
      setActive(entries.some(entry => entry.isIntersecting));
    }, { threshold: .15 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return <div ref={sceneRef} className="ih-scene-art" data-kind={kind} data-play={active} aria-hidden="true">
    <svg viewBox="0 0 400 400" focusable="false">
      {kind === "assemble" ? <>
        <path className="ih-poster-guide" d="M24 88H376M24 200H376M24 312H376M88 24V376M200 24V376M312 24V376" />
        <g transform="translate(24 24) scale(5.5)">
          <g className="ih-build-piece ih-build-left"><path d="M8 28H22V56H8Z" /></g>
          <g className="ih-build-piece ih-build-bridge"><path d="M22 28H42V42H22Z" /></g>
          <g className="ih-build-piece ih-build-right"><path d="M42 8H50L56 14V56H42Z" /></g>
          <g className="ih-build-piece ih-build-dot"><path d={IDEA_HIRE_MARK.dot} /></g>
        </g>
      </> : <>
        <g className="ih-poster-orbit ih-poster-orbit-outer"><rect x="47" y="47" width="306" height="306" rx="30" /></g>
        <g className="ih-poster-orbit ih-poster-orbit-inner"><rect x="76" y="76" width="248" height="248" rx="22" /></g>
        <g className="ih-poster-stamp" transform="translate(88 88) scale(3.5)">
          <path d={IDEA_HIRE_MARK.join} /><path className="ih-stamp-dot" d={IDEA_HIRE_MARK.dot} />
        </g>
      </>}
    </svg>
  </div>;
}

export function HomePaths({ en = false }) {
  return <section className="ih-cooperation ih-paths" id="for-users" aria-label={en ? "Start a collaboration" : "Rozpocznij współpracę"} data-no-translate="true">
    <div className="ih-action-squares">
      <Link className="ih-action-square" to="/find-talent">
        <span className="ih-square-index"><span aria-hidden="true">01</span>{en ? "For clients" : "Dla zlecających"}</span>
        <ConnectionArtwork kind="assemble" />
        <div className="ih-square-action"><h2>{en ? "Hire a professional" : "Zleć pracę"}</h2><span><ArrowIcon direction="up-right" /></span></div>
      </Link>
      <Link className="ih-action-square ih-action-square-orbit" to="/jobs">
        <span className="ih-square-index"><span aria-hidden="true">02</span>{en ? "For professionals" : "Dla wykonawców"}</span>
        <ConnectionArtwork kind="orbit" />
        <div className="ih-square-action"><h2>{en ? "Find a project" : "Znajdź zlecenie"}</h2><span><ArrowIcon direction="up-right" /></span></div>
      </Link>
    </div>

  </section>;
}
